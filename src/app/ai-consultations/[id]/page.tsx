'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
// Inline UI Components
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className = '' }: CardProps) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: CardProps) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: CardProps) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }: CardProps) => (
  <p className={`text-sm text-muted-foreground ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }: CardProps) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

const Button = ({ children, onClick, disabled = false, variant = 'default', size = 'default', className = '' }: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  };
  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};

interface TextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  ref?: React.RefObject<HTMLTextAreaElement>;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ value, onChange, onKeyPress, placeholder, className = '', disabled = false }, ref) => (
  <textarea
    ref={ref}
    value={value}
    onChange={onChange}
    onKeyPress={onKeyPress}
    placeholder={placeholder}
    disabled={disabled}
    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  />
));
Textarea.displayName = "Textarea";

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border border-input'
  };
  
  return (
    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

import { 
  Send, 
  ArrowLeft, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Phone, 
  Video, 
  FileText, 
  Star,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  consultationId: string;
  senderId: string;
  senderType: 'user' | 'ai_provider';
  content: string;
  messageType: 'text' | 'image' | 'file';
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

export default function AiConsultationChatPage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, userId } = useAuth();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [endingConsultation, setEndingConsultation] = useState(false);
  const [aiResponsePending, setAiResponsePending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('🔍 AI Consultation Page - Authentication Check:', {
      isSignedIn,
      userId,
      consultationId: params.id,
      timestamp: new Date().toISOString()
    });

    if (!isSignedIn) {
      console.log('❌ User not signed in, redirecting to sign-in page');
      router.push('/sign-in');
      return;
    }

    if (params.id) {
      console.log('✅ User authenticated, fetching consultation data');
      fetchConsultation(params.id as string);
      fetchMessages(params.id as string);
    }
  }, [params.id, isSignedIn, userId, fetchConsultation, fetchMessages, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling for new AI responses
  useEffect(() => {
    if (aiResponsePending && consultation) {
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(consultation.id);
      }, 2000); // Poll every 2 seconds
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [aiResponsePending, consultation, fetchMessages]);

  // Check if AI response arrived
  useEffect(() => {
    if (aiResponsePending && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderType === 'ai_provider') {
        setAiResponsePending(false);
      }
    }
  }, [messages, aiResponsePending]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { getToken } = useAuth();

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
          console.log('🚫 Consultation not found, redirecting to AI providers');
          toast.error('Consultation not found');
          router.push('/ai-providers');
          return;
        }
        if (response.status === 401) {
          console.log('🔒 Unauthorized, redirecting to sign-in');
          toast.error('Please sign in to access this consultation');
          router.push('/sign-in');
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
    } catch (error) {
      console.error('💥 Error fetching consultation:', error);
      toast.error('Failed to load consultation');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (consultationId: string) => {
    try {
      setMessagesLoading(true);
      console.log('💬 Fetching messages for consultation:', consultationId);
      
      const token = await getToken();
      const response = await fetch(`/api/ai-consultations/${consultationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('📨 Messages API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Messages API Error:', errorText);
        
        if (response.status === 401) {
          console.log('🔒 Unauthorized for messages, redirecting to sign-in');
          toast.error('Please sign in to access messages');
          router.push('/sign-in');
          return;
        }
        throw new Error(`Failed to fetch messages: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      const newMessages = data.messages || [];
      
      console.log('✅ Messages received:', {
        count: newMessages.length,
        lastMessageTime: newMessages[newMessages.length - 1]?.createdAt
      });
      
      // Update messages
      setMessages(newMessages);
      
      // Update consultation message count if it has changed
      if (consultation && newMessages.length !== consultation.messageCount) {
        setConsultation(prev => prev ? {
          ...prev,
          messageCount: newMessages.length
        } : null);
      }
    } catch (error) {
      console.error('💥 Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage || !consultation) {
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    try {
      const token = await getToken();
      const response = await fetch(`/api/ai-consultations/${consultation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: messageContent,
          messageType: 'text'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add user message immediately
      setMessages(prev => [...prev, data.userMessage]);
      
      // Update message count for user message
      setConsultation(prev => prev ? {
        ...prev,
        messageCount: prev.messageCount + 1
      } : null);
      
      // Set AI response pending if indicated
      if (data.aiResponsePending) {
        setAiResponsePending(true);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Restore the message if sending failed
      setNewMessage(messageContent);
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
      
      toast.success('Consultation ended successfully');
      
    } catch (error) {
      console.error('Error ending consultation:', error);
      toast.error('Failed to end consultation');
    } finally {
      setEndingConsultation(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Consultation Not Found</h3>
          <p className="text-gray-600 mb-4">The consultation you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Link href="/ai-providers">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to AI Providers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/ai-providers">
          <Button variant="ghost" className="p-0 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to AI Providers
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Consultation</h1>
            <p className="text-gray-600">Consultation with {consultation.aiProvider.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(consultation.status)}
            {getUrgencyBadge(consultation.urgencyLevel)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Image
                    src={consultation.aiProvider.profileImageUrl || '/placeholder-doctor.jpg'}
                    alt={consultation.aiProvider.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-3 h-3 border-2 border-white"></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-lg">{consultation.aiProvider.name}</CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span>{consultation.aiProvider.specialty}</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {consultation.aiProvider.rating}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
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
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.senderType === 'ai_provider' && (
                      <Image
                        src={consultation.aiProvider.profileImageUrl || '/placeholder-doctor.jpg'}
                        alt={consultation.aiProvider.name}
                        width={32}
                        height={32}
                        className="rounded-full object-cover mt-1"
                      />
                    )}
                    
                    <div className={`max-w-[70%] ${message.senderType === 'user' ? 'order-first' : ''}`}>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.senderType === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <div className={`text-xs text-gray-500 mt-1 ${
                        message.senderType === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    
                    {message.senderType === 'user' && (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {/* AI Response Pending Indicator */}
              {aiResponsePending && (
                <div className="flex gap-3 justify-start">
                  <Image
                    src={consultation.aiProvider.profileImageUrl || '/placeholder-doctor.jpg'}
                    alt={consultation.aiProvider.name}
                    width={32}
                    height={32}
                    className="rounded-full object-cover mt-1"
                  />
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
              
              <div ref={messagesEndRef} />
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
                  disabled={sendingMessage || consultation.status !== 'active'}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage || consultation.status !== 'active'}
                  size="lg"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {consultation.status !== 'active' && (
                <p className="text-sm text-gray-500 mt-2">
                  This consultation is {consultation.status}. You cannot send new messages.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Consultation Details Sidebar */}
        <div className="space-y-6">
          {/* Consultation Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Consultation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-900">Reason for Visit</div>
                <div className="text-sm text-gray-600 mt-1">{consultation.reasonForVisit}</div>
              </div>
              
              {consultation.symptoms.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-900">Symptoms</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {consultation.symptoms.join(', ')}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {consultation.patientAge && (
                  <div>
                    <div className="font-medium text-gray-900">Age</div>
                    <div className="text-gray-600">{consultation.patientAge}</div>
                  </div>
                )}
                {consultation.patientGender && (
                  <div>
                    <div className="font-medium text-gray-900">Gender</div>
                    <div className="text-gray-600 capitalize">{consultation.patientGender}</div>
                  </div>
                )}
              </div>
              
              <div className="text-sm">
                <div className="font-medium text-gray-900">Started</div>
                <div className="text-gray-600">
                  {formatDistanceToNow(new Date(consultation.createdAt), { addSuffix: true })}
                </div>
              </div>
              
              <div className="text-sm">
                <div className="font-medium text-gray-900">Messages</div>
                <div className="text-gray-600">{consultation.messageCount}</div>
              </div>
              
              <div className="text-sm">
                <div className="font-medium text-gray-900">Total Cost</div>
                <div className="text-gray-600">${consultation.totalCost}</div>
              </div>
            </CardContent>
          </Card>

          {/* Medical History */}
          {(consultation.medicalHistory.length > 0 || consultation.currentMedications.length > 0 || consultation.allergies.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Medical Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {consultation.medicalHistory.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-900">Medical History</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {consultation.medicalHistory.join(', ')}
                    </div>
                  </div>
                )}
                
                {consultation.currentMedications.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-900">Current Medications</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {consultation.currentMedications.join(', ')}
                    </div>
                  </div>
                )}
                
                {consultation.allergies.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-900">Allergies</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {consultation.allergies.join(', ')}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Download Transcript
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <User className="h-4 w-4 mr-2" />
                Request Human Doctor
              </Button>
              {consultation.status === 'active' && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="sm"
                  onClick={endConsultation}
                  disabled={endingConsultation}
                >
                  {endingConsultation ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  End Consultation
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}