'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  User, 
  Bot, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Phone, 
  Video, 
  FileText, 
  Star,
  Sparkles,
  MessageCircle,
  UserPlus,
  ChevronDown
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { conversationDataCollector } from '@/lib/services/conversationDataCollector';
import { DiagnosticCompletenessDetector } from '@/lib/services/diagnosticCompletenessDetector';
import DiagnosticConfirmationDialog from '@/components/consultation/DiagnosticConfirmationDialog';
import { QuickResponseConfirmDialog } from '@/components/dashboard/QuickResponseConfirmDialog';
import type { DiagnosticTriggerResult } from '@/lib/services/diagnosticCompletenessDetector';

interface Message {
  id: string;
  consultationId: string;
  senderId: string;
  senderType: 'patient' | 'ai' | 'ai_provider' | 'user' | 'system';
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface AiProvider {
  id: string;
  name: string;
  specialty: string;
  profileImageUrl?: string;
  rating: string;
  responseTimeSeconds: number;
}

interface Consultation {
  id: string;
  userId: string;
  aiProviderId: string;
  status: 'active' | 'completed' | 'cancelled';
  reasonForVisit: string;
  symptoms: string[];
  urgencyLevel: number;
  patientAge?: number;
  patientGender?: string;
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  messageCount: number;
  totalCost: string;
  createdAt: string;
  updatedAt: string;
  aiProvider: AiProvider;
}

interface ActiveConsultationChatProps {
  consultationId: string;
  onConsultationEnd?: () => void;
}

export default function ActiveConsultationChat({ consultationId, onConsultationEnd }: ActiveConsultationChatProps) {
  console.log('🚀 ActiveConsultationChat - Component initialized with:', {
    consultationId,
    onConsultationEnd: !!onConsultationEnd,
    timestamp: new Date().toISOString()
  });
  
  const { isSignedIn, userId } = useAuth();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [aiResponsePending, setAiResponsePending] = useState(false);
  const [switchingDoctor, setSwitchingDoctor] = useState(false);
  const [endingConsultation, setEndingConsultation] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'reconnecting'>('online');
  const [availableDoctors, setAvailableDoctors] = useState<AiProvider[]>([]);
  const [showDoctorSwitch, setShowDoctorSwitch] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [aiResponseTimeout, setAiResponseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  // Diagnostic-related state
  const [showDiagnosticDialog, setShowDiagnosticDialog] = useState(false);
  const [diagnosticTriggerResult, setDiagnosticTriggerResult] = useState<DiagnosticTriggerResult | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ step: string; progress: number } | undefined>();
  const [generatedReport, setGeneratedReport] = useState<{ id: string; downloadUrl: string; viewUrl: string } | undefined>();
  
  // Quick response confirmation state
  const [showQuickResponseDialog, setShowQuickResponseDialog] = useState(false);
  const [pendingQuickMessage, setPendingQuickMessage] = useState<{ content: string; responseTime: number } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const continuousPollingRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const doctorSwitchRef = useRef<HTMLDivElement>(null);
  const diagnosticDetectorRef = useRef<DiagnosticCompletenessDetector | null>(null);

  useEffect(() => {
    console.log('🔍 Active Consultation Chat - Authentication Check:', {
      isSignedIn,
      userId,
      consultationId,
      timestamp: new Date().toISOString()
    });

    if (!isSignedIn) {
      console.log('❌ User not signed in');
      return;
    }

    if (consultationId) {
      console.log('✅ User authenticated, fetching consultation data');
      fetchConsultation(consultationId);
      fetchMessages(consultationId);
      fetchAvailableDoctors(consultationId);
      
      // Initialize diagnostic detector
      if (!diagnosticDetectorRef.current) {
        diagnosticDetectorRef.current = new DiagnosticCompletenessDetector(conversationDataCollector);
        console.log('🔬 Diagnostic detector initialized');
      }
      
      // Initialize conversation timing when consultation is loaded
      if (consultation) {
        const conversationStartTime = new Date(consultation.createdAt);
        conversationDataCollector.initializeConversation(conversationStartTime);
        console.log('⏰ Conversation timing initialized with start time:', conversationStartTime);
      }
    }
  }, [consultationId, isSignedIn, userId]);

  // Initialize scroll position check
  useEffect(() => {
    // Check scroll position after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      checkIfAtBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Smart scroll behavior - only auto-scroll when user is at bottom
  useEffect(() => {
    if (isUserAtBottom && messages.length > 0) {
      scrollToBottom();
    } else if (!isUserAtBottom && messages.length > 0) {
      setShowScrollToBottom(true);
    }
  }, [messages, isUserAtBottom]);

  // Page Visibility API to track tab focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabVisible(isVisible);
      console.log('👁️ Tab visibility changed:', isVisible ? 'visible' : 'hidden');
      
      // If tab becomes visible, immediately fetch messages
      if (isVisible && consultation) {
        console.log('🔄 Tab became visible, fetching latest messages');
        fetchMessages(consultation.id, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [consultation]);

  // Continuous polling for real-time updates (works regardless of tab focus)
  useEffect(() => {
    if (consultation && consultation.status === 'active') {
      console.log('🔄 Starting continuous polling for consultation:', consultation.id);
      
      continuousPollingRef.current = setInterval(() => {
        console.log('🔍 Continuous polling for new messages... (tab visible:', isTabVisible, ')');
        fetchMessages(consultation.id, true);
      }, isTabVisible ? 3000 : 5000); // Poll every 3s when visible, 5s when hidden
    } else {
      if (continuousPollingRef.current) {
        console.log('⏹️ Stopping continuous polling');
        clearInterval(continuousPollingRef.current);
        continuousPollingRef.current = null;
      }
    }

    return () => {
      if (continuousPollingRef.current) {
        clearInterval(continuousPollingRef.current);
      }
    };
  }, [consultation, isTabVisible]);

  // Enhanced polling for AI responses
  useEffect(() => {
    console.log('🔄 AI Response Polling useEffect triggered:', {
      aiResponsePending,
      hasConsultation: !!consultation,
      consultationId: consultation?.id
    });
    
    if (aiResponsePending && consultation) {
      console.log('✅ Starting enhanced AI response polling every 1.5 seconds');
      pollingIntervalRef.current = setInterval(() => {
        console.log('🔍 Enhanced polling for AI response...');
        fetchMessages(consultation.id, true);
      }, 1500); // Poll every 1.5 seconds for faster AI response detection
    } else {
      if (pollingIntervalRef.current) {
        console.log('⏹️ Stopping AI response polling - aiResponsePending:', aiResponsePending);
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [aiResponsePending, consultation]);

  // Check if AI response arrived
  useEffect(() => {
    console.log('🔍 AI Response Detection useEffect triggered:', {
      aiResponsePending,
      messagesCount: messages.length,
      lastMessageSender: messages.length > 0 ? messages[messages.length - 1]?.senderType : 'none'
    });
    
    if (aiResponsePending && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      console.log('📨 Checking last message:', {
        id: lastMessage.id,
        senderType: lastMessage.senderType,
        content: lastMessage.content?.substring(0, 50) + '...'
      });
      
      if (lastMessage.senderType === 'ai_provider' || lastMessage.senderType === 'ai') {
        console.log('🎉 AI response detected! Setting aiResponsePending to FALSE');
        setAiResponsePending(false);
        // Clear AI response timeout
        if (aiResponseTimeout) {
          clearTimeout(aiResponseTimeout);
          setAiResponseTimeout(null);
        }
      } else {
        console.log('⏳ Last message is not from AI, continuing to wait...');
      }
    }
  }, [messages, aiResponsePending, aiResponseTimeout]);

  // Process messages for diagnostic data collection with timing validation
  useEffect(() => {
    if (messages.length === 0 || !diagnosticDetectorRef.current) {
      return;
    }

    // Check for automatic diagnostic report generation notifications
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && (lastMessage.senderType === 'ai' || lastMessage.senderType === 'ai_provider')) {
      // Detect automatic diagnostic report generation notification
      if (lastMessage.content.includes('🔄 **Generating Comprehensive Diagnostic Report**')) {
        console.log('🤖 Automatic diagnostic report generation detected');
        setIsGeneratingReport(true);
        setGenerationProgress({ step: 'Analyzing conversation data...', progress: 25 });
        
        // Simulate progress updates for better UX
        setTimeout(() => {
          setGenerationProgress({ step: 'Processing medical information...', progress: 50 });
        }, 2000);
        
        setTimeout(() => {
          setGenerationProgress({ step: 'Generating comprehensive report...', progress: 75 });
        }, 4000);
        
        // Check for report completion periodically
        const checkReportCompletion = setInterval(async () => {
          try {
            const response = await fetch(`/api/ai-consultations/${consultationId}/diagnostic-report`);
            if (response.ok) {
              const reportData = await response.json();
              if (reportData.report) {
                console.log('✅ Automatic diagnostic report completed');
                setGenerationProgress({ step: 'Report completed!', progress: 100 });
                setGeneratedReport({
                  id: reportData.report.id,
                  downloadUrl: reportData.report.downloadUrl,
                  viewUrl: reportData.report.viewUrl
                });
                setIsGeneratingReport(false);
                clearInterval(checkReportCompletion);
                
                toast.success('Your comprehensive diagnostic report is ready!', {
                  duration: 5000,
                  action: {
                    label: 'View Report',
                    onClick: () => window.open(reportData.report.viewUrl, '_blank')
                  }
                });
              }
            }
          } catch (error) {
            console.error('Error checking report completion:', error);
          }
        }, 3000);
        
        // Stop checking after 2 minutes
        setTimeout(() => {
          clearInterval(checkReportCompletion);
          if (isGeneratingReport) {
            setIsGeneratingReport(false);
            setGenerationProgress(undefined);
          }
        }, 120000);
        
        return; // Skip normal diagnostic processing when auto-generation is triggered
      }
    }

    // Process new messages for diagnostic information with timing checks
    messages.forEach(message => {
      if (message.senderType === 'user' || message.senderType === 'patient') {
        const messageTime = new Date(message.createdAt);
        const processingResult = conversationDataCollector.processMessage(
          message.content, 
          message.senderType, 
          messageTime
        );
        
        // Handle quick response confirmation
        if (processingResult.shouldConfirm && !showQuickResponseDialog) {
          const timingData = conversationDataCollector.getTimingData();
          const lastResponseTime = timingData.userResponseTimes[timingData.userResponseTimes.length - 1] || 0;
          
          setPendingQuickMessage({
            content: message.content,
            responseTime: lastResponseTime
          });
          setShowQuickResponseDialog(true);
          console.log('⚡ Quick response detected, showing confirmation dialog');
          return; // Don't process further until user confirms
        }
        
        // Show timeout message if conversation is too old
        if (processingResult.reason && processingResult.reason.includes('30-minute time limit')) {
          toast.info('Diagnostic data collection is disabled for conversations older than 30 minutes.', {
            duration: 5000
          });
        }
      }
    });

    // Only proceed with diagnostic detection if no quick response confirmation is pending and no auto-generation is active
    if (!showQuickResponseDialog && !isGeneratingReport) {
      // Notify detector about message processing
      diagnosticDetectorRef.current.onMessageProcessed();

      // Check if we should trigger diagnostic report generation
      const triggerResult = diagnosticDetectorRef.current.shouldTriggerDiagnostic();
      
      if (triggerResult.shouldTrigger && !showDiagnosticDialog && !isGeneratingReport) {
        console.log('🔬 Diagnostic trigger conditions met:', triggerResult);
        setDiagnosticTriggerResult(triggerResult);
        setShowDiagnosticDialog(true);
      }
    }
  }, [messages, showDiagnosticDialog, isGeneratingReport, showQuickResponseDialog, consultationId]);

  // WebSocket-like real-time connection using Server-Sent Events with enhanced error handling
  useEffect(() => {
    if (!consultation || !isSignedIn) {
      return;
    }

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const baseReconnectDelay = 1000; // Start with 1 second
    
    const connectToRealTimeUpdates = async () => {
      try {
        console.log(`🔌 Attempting to connect to real-time updates (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}) for consultation:`, consultation.id);
        
        const token = await getToken();
        if (!token) {
          console.error('❌ No auth token available for real-time connection');
          setWsConnected(false);
          return;
        }
        
        const eventSource = new EventSource(
          `/api/ai-consultations/${consultation.id}/stream?token=${encodeURIComponent(token)}`
        );
        
        eventSourceRef.current = eventSource;
        
        // Connection timeout - if no open event within 10 seconds, consider it failed
        const connectionTimeout = setTimeout(() => {
          if (eventSource.readyState === EventSource.CONNECTING) {
            console.error('❌ Real-time connection timeout');
            eventSource.close();
            handleReconnection();
          }
        }, 10000);
        
        eventSource.onopen = () => {
          console.log('✅ Real-time connection established successfully');
          clearTimeout(connectionTimeout);
          setWsConnected(true);
          setConnectionStatus('online');
          reconnectAttempts = 0; // Reset attempts on successful connection
        };
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 Real-time message received:', data);
            
            if (data.type === 'new_message') {
              // Immediately fetch latest messages when new message arrives
              fetchMessages(consultation.id, true);
            } else if (data.type === 'ai_response') {
              // AI response received, stop pending state
              setAiResponsePending(false);
              fetchMessages(consultation.id, true);
            } else if (data.type === 'heartbeat') {
              // Keep connection alive
              console.log('💓 Heartbeat received');
            }
          } catch (error: unknown) {
            console.error('❌ Error parsing real-time message:', error, 'Raw data:', event.data);
          }
        };
        
        const handleReconnection = () => {
          clearTimeout(connectionTimeout);
          setWsConnected(false);
          
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
            console.log(`🔄 Scheduling reconnection attempt ${reconnectAttempts + 1} in ${delay}ms`);
            setConnectionStatus('reconnecting');
            
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts++;
              connectToRealTimeUpdates();
            }, delay);
          } else {
            console.error('❌ Max reconnection attempts reached, giving up');
            setConnectionStatus('offline');
            toast.error('Real-time connection failed. Please refresh the page.', { duration: 10000 });
          }
        };
        
        eventSource.onerror = (error: Event) => {
          console.error('❌ Real-time connection error:', {
            readyState: eventSource.readyState,
            error: error,
            url: eventSource.url
          });
          
          // Only attempt reconnection if the connection was closed
          if (eventSource.readyState === EventSource.CLOSED) {
            handleReconnection();
          }
        };
        
      } catch (error: unknown) {
        console.error('❌ Failed to establish real-time connection:', error);
        setWsConnected(false);
        setConnectionStatus('offline');
        
        // Still attempt reconnection on general errors
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttempts), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts++;
            connectToRealTimeUpdates();
          }, delay);
        }
      }
    };
    
    // Only connect if we don't already have a connection
    if (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) {
      connectToRealTimeUpdates();
    }
    
    return () => {
      if (eventSourceRef.current) {
        console.log('🔌 Closing real-time connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setWsConnected(false);
    };
  }, [consultation, isSignedIn]);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('online');
      toast.success('Connection restored', { duration: 2000 });
      
      // Reconnect real-time updates when coming back online
      if (consultation && (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED)) {
        console.log('🔄 Reconnecting real-time updates after coming online');
        // Trigger reconnection by updating consultation dependency
        setConsultation(prev => prev ? {...prev} : null);
      }
    };
    const handleOffline = () => {
      setConnectionStatus('offline');
      toast.error('Connection lost. Trying to reconnect...', { duration: 5000 });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [consultation]);

  // Close doctor switch dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (doctorSwitchRef.current && !doctorSwitchRef.current.contains(event.target as Node)) {
        setShowDoctorSwitch(false);
      }
    };

    if (showDoctorSwitch) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDoctorSwitch]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollToBottom(false);
  };

  // Check if user is at bottom of chat
  const checkIfAtBottom = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const threshold = 100; // 100px threshold
      const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
      setIsUserAtBottom(atBottom);
      
      if (atBottom) {
        setShowScrollToBottom(false);
      }
    }
  };

  // Handle scroll events
  const handleScroll = () => {
    checkIfAtBottom();
  };

  const scrollToReferral = (messageId: string) => {
    const referralElement = document.getElementById(`referral-${messageId}`);
    if (referralElement) {
      referralElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const { getToken } = useAuth();

  const fetchAvailableDoctors = async (consultationId: string) => {
    try {
      setLoadingDoctors(true);
      console.log('🔄 Fetching available doctors for consultation:', consultationId);
      
      const token = await getToken();
      const response = await fetch(`/api/ai-consultations/${consultationId}/switch-provider`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.warn('⚠️ Failed to fetch available doctors:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('✅ Available doctors received:', {
        count: data.providers?.length || 0,
        currentProviderId: data.currentProviderId
      });
      
      setAvailableDoctors(data.providers || []);
    } catch (error: unknown) {
      console.error('💥 Error fetching available doctors:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchConsultation = async (consultationId: string) => {
    try {
      setLoading(true);
      console.log('🔄 Fetching consultation:', consultationId);
      
      const token = await getToken();
      console.log('🔑 Auth token obtained:', token ? 'Yes' : 'No');
      
      const response = await fetch(`/api/ai-consultations/${consultationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('📡 API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ API Error Response:', errorText);
        
        if (response.status === 404) {
          console.log('🚫 Consultation not found');
          toast.error('Consultation not found');
          return;
        }
        if (response.status === 401) {
          console.log('🔒 Unauthorized');
          toast.error('Please sign in to access this consultation');
          return;
        }
        throw new Error(`Failed to fetch consultation: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Consultation data received:', {
        consultationId: data.consultation?.id,
        status: data.consultation?.status,
        aiProvider: data.consultation?.aiProvider?.name
      });
      
      setConsultation(data.consultation);
    } catch (error: unknown) {
      console.error('💥 Error fetching consultation:', error);
      toast.error('Failed to load consultation');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (consultationId: string, isPolling = false) => {
    try {
      if (!isPolling) {
        setMessagesLoading(true);
      }
      console.log('🔄 Fetching messages for consultation:', consultationId);
      
      const token = await getToken();
      const response = await fetch(`/api/ai-consultations/${consultationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        // Add timeout for polling requests
        signal: isPolling ? AbortSignal.timeout(5000) : undefined
      });
      
      if (!response.ok) {
        // Don't show error toast for polling failures to avoid spam
        if (!isPolling) {
          throw new Error('Failed to fetch messages');
        }
        console.warn('⚠️ Polling request failed:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('✅ Messages received:', {
        count: data.messages?.length || 0,
        consultationId
      });
      
      // Filter out any invalid messages to prevent undefined errors
      const validMessages = (data.messages || []).filter((message: Message) => 
        message && 
        message.id && 
        message.senderType && 
        message.content !== undefined
      );
      
      console.log('📋 Valid messages after filtering:', validMessages.map((msg: Message) => ({
        id: msg.id,
        senderType: msg.senderType,
        content: msg.content?.substring(0, 30) + '...',
        createdAt: msg.createdAt
      })));
      
      setMessages(validMessages);
    } catch (error: unknown) {
      console.error('💥 Error fetching messages:', error);
      // Only show error toast for non-polling requests
      if (!isPolling) {
        toast.error('Failed to load messages');
      }
    } finally {
      if (!isPolling) {
        setMessagesLoading(false);
      }
    }
  };

  const sendMessage = async (retryCount = 0) => {
    if (!newMessage.trim() || !consultation || sendingMessage) {
      return;
    }

    setSendingMessage(true);
    setAiResponsePending(true);
    console.log('🤖 AI Response Pending set to TRUE - waiting for AI response');

    try {
      console.log('📤 Sending message:', {
        consultationId: consultation.id,
        messageLength: newMessage.length,
        retryCount
      });

      const token = await getToken();
      const response = await fetch(`/api/ai-consultations/${consultation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newMessage,
          messageType: 'text'
        }),
        // Add timeout for send requests
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        if (response.status >= 500 && retryCount < 2) {
          // Retry server errors up to 2 times
          console.log(`🔄 Retrying message send (attempt ${retryCount + 1})`);
          setTimeout(() => sendMessage(retryCount + 1), 1000 * (retryCount + 1));
          return;
        }
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Message sent successfully:', {
        messageId: data.message?.id,
        consultationId: consultation.id
      });

      // Add user message immediately (with validation)
      if (data.message && data.message.id && data.message.senderType) {
        setMessages(prev => [...prev, data.message]);
      }
      setNewMessage('');
      
      // Immediately refresh messages to ensure real-time updates
      console.log('🔄 Immediately refreshing messages after sending');
      setTimeout(() => {
        fetchMessages(consultation.id, true);
      }, 500); // Small delay to allow backend processing
      
      // Set AI response timeout (60 seconds)
      const timeout = setTimeout(() => {
        if (aiResponsePending) {
          setAiResponsePending(false);
          toast.warning('AI response is taking longer than expected. The AI may still respond shortly.', {
            duration: 5000
          });
        }
      }, 60000);
      setAiResponseTimeout(timeout);
      
      // Focus back to textarea
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      
      // Additional refresh after a short delay to catch any immediate AI responses
      setTimeout(() => {
        console.log('🔄 Secondary refresh to catch immediate AI responses');
        fetchMessages(consultation.id, true);
      }, 2000);
      
    } catch (error: unknown) {
      console.error('💥 Error sending message:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Message send timed out. Please try again.');
      } else {
        toast.error('Failed to send message. Please check your connection and try again.');
      }
      setAiResponsePending(false);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (level: number) => {
    switch (level) {
      case 1:
        return <Badge variant="outline" className="text-green-600 border-green-600">Low Priority</Badge>;
      case 2:
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Medium Priority</Badge>;
      case 3:
        return <Badge variant="outline" className="text-red-600 border-red-600">High Priority</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const endConsultation = async () => {
    if (!consultation || endingConsultation) {
      return;
    }

    setEndingConsultation(true);

    try {
      // Show initial notification about ending consultation
      toast.info('Ending consultation and generating full diagnostic report...', {
        duration: 3000
      });

      const token = await getToken();
      const response = await fetch(`/api/ai-consultations/${consultation.id}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to end consultation');
      }

      const data = await response.json();
      
      // Update consultation status
      setConsultation(prev => prev ? {
        ...prev,
        status: 'completed',
        totalCost: data.consultation.totalCost
      } : null);
      
      // Show success message with information about the full diagnostic report
      if (data.fullDiagnosticReport) {
        toast.success('Consultation ended successfully! Full diagnostic report has been generated and will be available in your health reports.', {
          duration: 5000
        });
      } else {
        toast.success('Consultation ended successfully');
      }
      
      // Notify parent component
      if (onConsultationEnd) {
        onConsultationEnd();
      }
      
    } catch (error: unknown) {
      console.error('Error ending consultation:', error);
      toast.error('Failed to end consultation');
    } finally {
      setEndingConsultation(false);
    }
  };

  const handleDiagnosticConfirmation = async () => {
    if (!diagnosticTriggerResult || isGeneratingReport) {
      return;
    }

    setIsGeneratingReport(true);
    setGenerationProgress({ step: 'Preparing diagnostic data...', progress: 10 });

    try {
      console.log('🔬 Starting diagnostic report generation');
      
      // Validate collected data
      const validation = diagnosticDetectorRef.current?.validateForDiagnosticRequest();
      if (!validation?.isValid) {
        throw new Error(`Invalid diagnostic data: ${validation?.errors.join(', ')}`);
      }

      // Convert collected data to FullDiagnosticRequest format
      const diagnosticRequest = conversationDataCollector.toFullDiagnosticRequest();
      
      setGenerationProgress({ step: 'Analyzing symptoms with AI...', progress: 30 });
      
      const token = await getToken();
      const response = await fetch('/api/ai/full-diagnostic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(diagnosticRequest)
      });

      if (!response.ok) {
        throw new Error(`Failed to generate diagnostic report: ${response.status}`);
      }

      const analysisData = await response.json();
      
      setGenerationProgress({ step: 'Saving report to your health records...', progress: 70 });
      
      // Save the report
      const saveResponse = await fetch('/api/health-reports/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...analysisData,
          source: 'conversation',
          consultationId: consultation?.id
        })
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save diagnostic report');
      }

      const savedReport = await saveResponse.json();
      
      setGenerationProgress({ step: 'Report generated successfully!', progress: 100 });
      
      // Set the generated report for display
      setGeneratedReport({
        id: savedReport.id,
        downloadUrl: `/api/health-reports/${savedReport.id}/download`,
        viewUrl: `/health-reports/${savedReport.id}`
      });
      
      toast.success('Diagnostic report generated successfully!');
      
      // Reset the data collector for future use
      conversationDataCollector.reset();
      diagnosticDetectorRef.current?.reset();
      
    } catch (error: unknown) {
      console.error('💥 Error generating diagnostic report:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate diagnostic report');
      setShowDiagnosticDialog(false);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDiagnosticDialogClose = () => {
    if (!isGeneratingReport) {
      setShowDiagnosticDialog(false);
      setDiagnosticTriggerResult(null);
      setGenerationProgress(undefined);
      setGeneratedReport(undefined);
    }
  };

  const handleQuickResponseConfirm = () => {
    if (pendingQuickMessage) {
      // Process the message after user confirmation
      conversationDataCollector.processConfirmedMessage(pendingQuickMessage.content);
      console.log('✅ Quick response confirmed and processed');
      
      // Check if diagnostic trigger conditions are now met
      if (diagnosticDetectorRef.current) {
        diagnosticDetectorRef.current.onMessageProcessed();
        const triggerResult = diagnosticDetectorRef.current.shouldTriggerDiagnostic();
        
        if (triggerResult.shouldTrigger && !showDiagnosticDialog && !isGeneratingReport) {
          console.log('🔬 Diagnostic trigger conditions met after confirmation:', triggerResult);
          setDiagnosticTriggerResult(triggerResult);
          setShowDiagnosticDialog(true);
        }
      }
    }
    
    // Close the quick response dialog
    setShowQuickResponseDialog(false);
    setPendingQuickMessage(null);
  };

  const handleQuickResponseDecline = () => {
    console.log('❌ Quick response declined, message not added to diagnostic data');
    
    // Close the quick response dialog without processing the message
    setShowQuickResponseDialog(false);
    setPendingQuickMessage(null);
  };

  const handleQuickResponseClose = () => {
    // Same as decline - user chose not to add the message
    handleQuickResponseDecline();
  };

  const switchDoctor = async (newProviderId: string, reason: string) => {
    if (!consultation || switchingDoctor) {
      return;
    }

    setSwitchingDoctor(true);

    try {
      toast.info('Switching to specialist...', {
        duration: 2000
      });

      const token = await getToken();
      const response = await fetch(`/api/ai-consultations/${consultation.id}/switch-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          newProviderId,
          reason,
          transferContext: 'Patient has been referred for specialized care. Please review the conversation history for context.'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to switch provider');
      }

      const data = await response.json();
      
      // Update consultation with new provider
      setConsultation(prev => prev ? {
        ...prev,
        aiProviderId: newProviderId,
        aiProvider: {
          id: data.newProvider.id,
          name: data.newProvider.name,
          specialty: data.newProvider.specialty,
          profileImageUrl: consultation.aiProvider?.profileImageUrl,
          rating: consultation.aiProvider?.rating || 'N/A',
          responseTimeSeconds: consultation.aiProvider?.responseTimeSeconds || 30
        }
      } : null);
      
      // Refresh messages to show handoff message
      await fetchMessages(consultation.id);
      
      // Refresh available doctors list to update current provider status
      await fetchAvailableDoctors(consultation.id);
      
      toast.success(`Successfully switched to ${data.newProvider.name} (${data.newProvider.specialty})`, {
        duration: 4000
      });
      
    } catch (error: unknown) {
      console.error('Error switching provider:', error);
      toast.error('Failed to switch to specialist');
    } finally {
      setSwitchingDoctor(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!consultation || !consultation.aiProvider) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Consultation Not Found</h3>
        <p className="text-gray-600 mb-4">The consultation you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Consultation</h1>
            <p className="text-gray-600">Consultation with {consultation?.aiProvider?.name || 'AI Provider'}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(consultation?.status)}
              {getUrgencyBadge(consultation?.urgencyLevel)}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Chat Interface */}
        <div>
          <Card className="h-[600px] flex flex-col">
            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Image
                    src={consultation.aiProvider?.profileImageUrl || '/placeholder-doctor.jpg'}
                    alt={consultation.aiProvider?.name || 'AI Provider'}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-3 h-3 border-2 border-white"></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-lg">{consultation.aiProvider?.name || 'AI Provider'}</CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span>{consultation.aiProvider?.specialty || 'AI Specialist'}</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {consultation.aiProvider?.rating || 'N/A'}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {/* Connection Status Indicator */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    connectionStatus === 'online' && wsConnected
                      ? 'bg-green-100 text-green-800' 
                      : connectionStatus === 'offline' || !wsConnected
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'online' && wsConnected
                        ? 'bg-green-500' 
                        : connectionStatus === 'offline' || !wsConnected
                        ? 'bg-red-500'
                        : 'bg-yellow-500 animate-pulse'
                    }`}></div>
                    {connectionStatus === 'online' && wsConnected ? 'Real-time' : connectionStatus === 'offline' || !wsConnected ? 'Offline' : 'Connecting'}
                  </div>
                  
                  {/* Doctor Switch Dropdown */}
                   {consultation?.status === 'active' && availableDoctors.length > 0 && (
                     <div className="relative" ref={doctorSwitchRef}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDoctorSwitch(!showDoctorSwitch)}
                        disabled={switchingDoctor || loadingDoctors}
                        className="flex items-center gap-1"
                      >
                        <UserPlus className="h-4 w-4" />
                        Switch Doctor
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      
                      {showDoctorSwitch && (
                        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          <div className="p-2">
                            <div className="text-sm font-medium text-gray-700 mb-2">Available Doctors</div>
                            {loadingDoctors ? (
                              <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {availableDoctors.map((doctor) => (
                                  <button
                                    key={doctor.id}
                                    onClick={() => {
                                      switchDoctor(doctor.id, `Switched to ${doctor.specialty} specialist`);
                                      setShowDoctorSwitch(false);
                                    }}
                                    disabled={switchingDoctor || doctor.id === consultation?.aiProviderId}
                                    className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                                      doctor.id === consultation?.aiProviderId
                                        ? 'bg-blue-50 text-blue-600 cursor-not-allowed'
                                        : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                                  >
                                    <div className="font-medium">{doctor.name}</div>
                                    <div className="text-xs text-gray-500">{doctor.specialty}</div>
                                    {doctor.id === consultation?.aiProviderId && (
                                      <div className="text-xs text-blue-600 mt-1">Currently Active</div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  {consultation?.status === 'active' && (
                    <Button 
                      onClick={endConsultation}
                      disabled={endingConsultation}
                      variant="destructive"
                      size="sm"
                    >
                      {endingConsultation ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth relative"
              onScroll={handleScroll}
            >
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.filter((message: Message) => message && message.senderType && message.id).map((message: Message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${message.senderType === 'user' || message.senderType === 'patient' ? 'justify-end' : 'justify-start'}`}
                  >
                    {(message.senderType === 'ai_provider' || message.senderType === 'ai') && consultation?.aiProvider && (
                      <div className="flex-shrink-0">
                        <Image
                          src={consultation.aiProvider.profileImageUrl || '/placeholder-doctor.jpg'}
                          alt={consultation.aiProvider.name || 'AI Provider'}
                          width={36}
                          height={36}
                          className="rounded-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className={`max-w-[70%] ${message.senderType === 'user' || message.senderType === 'patient' ? 'order-first' : ''}`}>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.senderType === 'user' || message.senderType === 'patient'
                            ? 'bg-blue-600 text-white'
                            : message.senderType === 'system'
                            ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        
                        {/* Referral Notification with inline Switch Doctor button */}
                        {(message.senderType === 'ai_provider' || message.senderType === 'ai') && message.metadata?.referralNeeded && (
                          <div id={`referral-${message.id}`} className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-blue-900 mb-1">
                                  Specialist Referral Recommended
                                </h4>
                                <p className="text-sm text-blue-700 mb-3">
                                  A {message.metadata.recommendedSpecialty} specialist is recommended for your case.
                                  {message.metadata.suggestedProviderName && (
                                    <span> Dr. {message.metadata.suggestedProviderName} is available to assist you.</span>
                                  )}
                                </p>
                                {message.metadata.suggestedProvider && (
                                  <Button
                                    onClick={() => switchDoctor(
                                      message.metadata.suggestedProvider,
                                      `Referral to ${message.metadata.recommendedSpecialty} specialist`
                                    )}
                                    disabled={switchingDoctor}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    {switchingDoctor ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    ) : null}
                                    Switch to Specialist
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`text-xs text-gray-500 mt-1 ${
                        message.senderType === 'user' || message.senderType === 'patient' ? 'text-right' : 'text-left'
                      }`}>
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    
                    {(message.senderType === 'user' || message.senderType === 'patient') && (
                      <div className="flex-shrink-0">
                        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {/* AI Response Pending Indicator */}
              {aiResponsePending && consultation?.aiProvider && (
                <div className="flex items-start gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <Image
                      src={consultation.aiProvider.profileImageUrl || '/placeholder-doctor.jpg'}
                      alt={consultation.aiProvider.name || 'AI Provider'}
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div className="max-w-[70%]">
                    <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                        <span className="text-sm text-gray-500">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Automatic Diagnostic Report Generation Indicator */}
              {isGeneratingReport && generationProgress && consultation?.aiProvider && (
                <div className="flex items-start gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <Image
                      src={consultation.aiProvider.profileImageUrl || '/placeholder-doctor.jpg'}
                      alt={consultation.aiProvider.name || 'AI Provider'}
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div className="max-w-[70%]">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-900 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="font-medium text-sm">Generating Diagnostic Report</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-blue-700">{generationProgress.step}</p>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${generationProgress.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-blue-600">{generationProgress.progress}% complete</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Report Generation Complete Indicator */}
              {generatedReport && !isGeneratingReport && (
                <div className="flex items-start gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <Image
                      src={consultation?.aiProvider?.profileImageUrl || '/placeholder-doctor.jpg'}
                      alt={consultation?.aiProvider?.name || 'AI Provider'}
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div className="max-w-[70%]">
                    <div className="bg-green-50 border border-green-200 text-green-900 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-sm">Diagnostic Report Ready!</span>
                      </div>
                      <p className="text-xs text-green-700 mb-3">
                        Your comprehensive diagnostic report has been generated and is ready for review.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => window.open(generatedReport.viewUrl, '_blank')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View Report
                        </Button>
                        <Button
                          onClick={() => window.open(generatedReport.downloadUrl, '_blank')}
                          size="sm"
                          variant="outline"
                          className="border-green-300 text-green-700 hover:bg-green-50 text-xs"
                        >
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
              
              {/* Scroll to Bottom Button */}
              {showScrollToBottom && (
                <div className="absolute bottom-4 right-4 z-10">
                  <Button
                    onClick={scrollToBottom}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full p-2"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                  disabled={sendingMessage || consultation?.status !== 'active'}
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!newMessage.trim() || sendingMessage || consultation?.status !== 'active'}
                  size="lg"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {consultation?.status !== 'active' && (
                <p className="text-sm text-gray-500 mt-2">
                  This consultation is {consultation.status}. You cannot send new messages.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
      
      {/* Diagnostic Confirmation Dialog */}
      {showDiagnosticDialog && diagnosticTriggerResult && (
        <DiagnosticConfirmationDialog
          isOpen={showDiagnosticDialog}
          onClose={handleDiagnosticDialogClose}
          onConfirm={handleDiagnosticConfirmation}
          triggerResult={diagnosticTriggerResult}
          isGenerating={isGeneratingReport}
          generationProgress={generationProgress}
          generatedReport={generatedReport}
        />
      )}
      
      {/* Quick Response Confirmation Dialog */}
      {showQuickResponseDialog && pendingQuickMessage && (
        <QuickResponseConfirmDialog
          isOpen={showQuickResponseDialog}
          onClose={handleQuickResponseClose}
          onConfirm={handleQuickResponseConfirm}
          onDecline={handleQuickResponseDecline}
          message={pendingQuickMessage.content}
          responseTime={pendingQuickMessage.responseTime}
        />
      )}
    </div>
  );
}