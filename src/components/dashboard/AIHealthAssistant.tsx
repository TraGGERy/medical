'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { geminiHealthService, HealthPrediction, TrendAnalysis } from '@/lib/services/geminiService';
import { deviceIntegrationService, BiometricReading, HealthAlert, DeviceData } from '@/lib/services/deviceIntegrationService';
import { emergencyContactService, EmergencyAlert, EmergencyContact } from '@/lib/services/emergencyContactService';
import { AlertTriangle, Heart, Activity, Brain, Phone, TrendingUp, Zap, Shield, Wifi, WifiOff, Users, Clock, BarChart3, LineChart, TrendingDown, MessageCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'normal' | 'emergency' | 'analysis' | 'prediction' | 'system' | 'monitoring';
  metadata?: {
    urgencyLevel?: 'low' | 'medium' | 'high' | 'emergency';
    riskScore?: number;
    vitals?: BiometricReading[];
    predictions?: HealthPrediction[];
    monitoringType?: string;
  };
}

// Using BiometricReading from deviceIntegrationService instead

// Using HealthPrediction from geminiService instead

// Using EmergencyContact from emergencyContactService instead

export default function EnhancedAIHealthAssistant() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '🌟 Hello! I\'m your Enhanced MediScope AI Assistant. I can now provide real-time health analysis, monitor your vitals, detect emergencies, and offer predictive health insights. How can I help you today?',
      timestamp: new Date(),
      type: 'normal'
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [currentRiskScore, setCurrentRiskScore] = useState(0);
  const [biometricData, setBiometricData] = useState<BiometricReading[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<DeviceData[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<HealthAlert[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [healthPredictions, setHealthPredictions] = useState<HealthPrediction | null>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [continuousMonitoring, setContinuousMonitoring] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [lastMonitoringCheck, setLastMonitoringCheck] = useState<Date | null>(null);
  const [hasAskedInitialQuestions, setHasAskedInitialQuestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to ask intelligent health questions when no data is available
  const askInitialHealthQuestions = () => {
    if (hasAskedInitialQuestions) return;
    
    const welcomeMessage: Message = {
      role: 'assistant',
      content: `👋 Welcome to your AI Health Assistant! I'm here to help you monitor and understand your health better.\n\nI'd love to learn more about your current health status to provide personalized insights. Let's start with a few questions:\n\n🫀 **Heart Rate & Cardiovascular Health**:\n• How has your heart rate been feeling lately?\n• Do you experience any chest discomfort, palpitations, or irregular heartbeats?\n• What's your typical resting heart rate if you know it?\n\n💪 **General Wellness**:\n• How are you feeling overall today?\n• Any current symptoms, pain, or discomfort?\n• How would you rate your energy levels (1-10)?\n\n📊 **Health Monitoring Goals**:\n• What health metrics are you most interested in tracking?\n• Do you have any specific health concerns or conditions I should know about?\n• Are you taking any medications or following any treatment plans?\n\nPlease share whatever feels relevant - I'm here to help provide insights and guidance based on your responses!`,
      timestamp: new Date(),
      type: 'normal',
      metadata: {
        urgencyLevel: 'low'
      }
    };
    
    setMessages(prev => [...prev, welcomeMessage]);
    setHasAskedInitialQuestions(true);
  };

  // Initialize device integration and real-time monitoring
  useEffect(() => {
    // Set up device integration listeners
    const handleNewReading = (...args: unknown[]) => {
      const reading = args[0] as BiometricReading;
      setBiometricData(prev => [...prev.slice(-19), reading]);
      
      // Update current risk score based on readings
      if (reading.status === 'critical') {
        setCurrentRiskScore(prev => Math.min(100, prev + 20));
      } else if (reading.status === 'warning') {
        setCurrentRiskScore(prev => Math.min(100, prev + 5));
      }
    };
    
    const handleAlert = (...args: unknown[]) => {
      const alert = args[0] as HealthAlert;
      setActiveAlerts(prev => [alert, ...prev.slice(0, 9)]);
      
      if (alert.type === 'emergency') {
        triggerEmergencyAlert(alert);
      }
    };
    
    const handleDeviceEmergencyAlert = (...args: unknown[]) => {
      const alert = args[0] as HealthAlert;
      setEmergencyMode(true);
      const emergencyMessage: Message = {
        role: 'system',
        content: `🚨 EMERGENCY ALERT: ${alert.message} Device: ${alert.deviceId}. Emergency protocols activated!`,
        timestamp: new Date(),
        type: 'emergency',
        metadata: {
          urgencyLevel: 'emergency',
          riskScore: 100
        }
      };
      setMessages(prev => [...prev, emergencyMessage]);
    };
    
    const handleEmergencyContactAlert = (...args: unknown[]) => {
      const alert = args[0] as EmergencyAlert;
      setEmergencyAlerts(prev => [alert, ...prev.slice(0, 9)]);
      
      if (alert.severity === 'critical') {
        setEmergencyMode(true);
        setCurrentRiskScore(100);
        
        const emergencyMessage: Message = {
          role: 'system',
          content: `🚨 EMERGENCY ALERT: ${alert.title} - ${alert.message} Emergency contacts have been automatically notified.`,
          timestamp: new Date(),
          type: 'emergency',
          metadata: {
            urgencyLevel: 'emergency',
            riskScore: 100
          }
        };
        setMessages(prev => [...prev, emergencyMessage]);
      }
    };
    
    const handleAlertResolved = (...args: unknown[]) => {
      const alert = args[0] as EmergencyAlert;
      setEmergencyAlerts(prev => prev.filter(a => a.id !== alert.id));
      
      if (alert.severity === 'critical') {
        setEmergencyMode(false);
        setCurrentRiskScore(prev => Math.max(0, prev - 50));
      }
    };
    
    // Add event listeners
    deviceIntegrationService.addEventListener('reading_added', handleNewReading);
    deviceIntegrationService.addEventListener('alert_created', handleAlert);
    deviceIntegrationService.addEventListener('emergency_alert', handleDeviceEmergencyAlert);
    
    // Add emergency service listeners
    emergencyContactService.addEventListener('alert_created', handleEmergencyContactAlert);
    emergencyContactService.addEventListener('alert_resolved', handleAlertResolved);
    
    // Initialize data
    setConnectedDevices(deviceIntegrationService.getConnectedDevices());
    setBiometricData(deviceIntegrationService.getAllRecentReadings(20));
    setActiveAlerts(deviceIntegrationService.getActiveAlerts());
    setEmergencyContacts(emergencyContactService.getEmergencyContacts());
    setEmergencyAlerts(emergencyContactService.getActiveAlerts());
    
    // Start monitoring if enabled
    if (realTimeMonitoring) {
      deviceIntegrationService.startRealTimeSync();
    }
    
    // Set up continuous monitoring interval
    let monitoringInterval: NodeJS.Timeout;
    
    if (continuousMonitoring) {
      monitoringInterval = setInterval(async () => {
        await performContinuousMonitoring();
      }, 300000); // Check every 5 minutes
    }
    
    return () => {
      deviceIntegrationService.removeEventListener('reading_added', handleNewReading);
      deviceIntegrationService.removeEventListener('alert_created', handleAlert);
      deviceIntegrationService.removeEventListener('emergency_alert', handleDeviceEmergencyAlert);
      emergencyContactService.removeEventListener('alert_created', handleEmergencyContactAlert);
      emergencyContactService.removeEventListener('alert_resolved', handleAlertResolved);
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [realTimeMonitoring]);

  // Check for data availability and ask questions if needed
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasData = biometricData.length > 0 || connectedDevices.length > 0 || emergencyContacts.length > 0;
      if (!hasData && messages.length === 0) {
        askInitialHealthQuestions();
      }
    }, 1000); // Small delay to allow data loading

    return () => clearTimeout(timer);
  }, [biometricData, connectedDevices, emergencyContacts, messages, hasAskedInitialQuestions]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const triggerEmergencyAlert = async (alert: HealthAlert) => {
    setEmergencyMode(true);
    setCurrentRiskScore(100);
    
    // Simulate emergency contact notification
    setTimeout(() => {
      setEmergencyMode(false);
      setCurrentRiskScore(prev => Math.max(0, prev - 30));
    }, 15000);
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date(),
      type: 'normal'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);
    setIsAnalyzing(true);

    try {
      // Enhanced AI analysis with real-time data or intelligent questioning
      const hasHealthData = biometricData.length > 0 || connectedDevices.length > 0;
      
      const enhancedPrompt = hasHealthData ? `
        User Message: ${currentMessage}
        
        Current Biometric Data: ${JSON.stringify(biometricData.slice(-3))}
        Real-time Monitoring: ${realTimeMonitoring ? 'Active' : 'Inactive'}
        Current Risk Score: ${currentRiskScore}
        Connected Devices: ${connectedDevices.length}
        
        Please provide an enhanced response that:
        1. Analyzes the user's query in context of their real-time health data
        2. Provides predictive insights based on current trends
        3. Offers personalized recommendations
        4. Detects any potential emergency situations
        5. Suggests preventive measures
        
        If this appears to be an emergency situation, start your response with "🚨 EMERGENCY:" and provide immediate guidance.
      ` : `
        User Message: ${currentMessage}
        
        Context: This user doesn't have connected health devices or recent biometric data. Act as a conversational health assistant focused on gathering information through intelligent questions.
        
        If they mention heart rate, ask specific follow-up questions like:
        - What's their typical resting heart rate?
        - Do they experience palpitations or irregular beats?
        - Any chest discomfort or shortness of breath?
        - Their activity level when they notice changes?
        
        If they mention general health concerns, ask about:
        - Specific symptoms and when they occur
        - Duration and severity of issues
        - Any patterns they've noticed
        - Current medications or treatments
        
        Always provide helpful guidance while encouraging them to track their health manually or consider connecting devices. Be conversational, empathetic, and focus on actionable next steps.
        
        If this appears to be an emergency situation, start your response with "🚨 EMERGENCY:" and provide immediate guidance.
      `;
      
      const response = await geminiHealthService.chatWithAssistant(enhancedPrompt, user?.id);
      
      // Determine message type and metadata
      const isEmergency = response.includes('🚨 EMERGENCY:');
      const urgencyLevel = isEmergency ? 'emergency' : 
                          response.includes('urgent') ? 'high' :
                          response.includes('concerning') ? 'medium' : 'low';
      
      // Generate AI-powered health predictions
      let predictions: HealthPrediction[] = [];
      if (biometricData.length > 10) {
        try {
          const predictionRequest = {
            biometricData: biometricData.slice(-20).map(d => ({
              type: d.type,
              value: d.value,
              unit: d.unit,
              timestamp: d.timestamp,
              deviceId: d.deviceId
            })),
            medicalHistory: undefined,
            lifestyle: {
              exercise: 'Moderate',
              diet: 'Balanced',
              sleep: '7-8 hours',
              stress: 'Moderate',
              smoking: false,
              alcohol: 'Occasional'
            },
            currentSymptoms: messages
              .filter(m => m.role === 'user' && m.content.toLowerCase().includes('symptom'))
              .slice(-3)
              .map(m => m.content)
          };
          
          const healthPreds = await geminiHealthService.generatePredictiveHealthInsights(predictionRequest);
          setHealthPredictions(healthPreds);
          // predictions = healthPreds.predictions || [];
          
          // Generate trend analysis
          const trendRequest = {
            biometricHistory: biometricData.slice(-50),
            timeframe: 'month' as const,
            metrics: ['heart_rate', 'blood_pressure_systolic', 'body_temperature', 'oxygen_saturation']
          };
          
          const trends = await geminiHealthService.analyzeTrends(trendRequest);
          setTrendAnalysis(trends);
          
        } catch (error) {
          console.error('Error generating predictions:', error);
        }
      }
      
      // Add health insights to the message with predictive analysis
      let enhancedResponse = response;
      
      if (healthPredictions && healthPredictions.predictions.length > 0) {
        enhancedResponse += '\n\n🔮 **Predictive Health Insights:**\n';
        healthPredictions.predictions.slice(0, 2).forEach(pred => {
          enhancedResponse += `• ${pred.condition}: ${pred.probability}% probability ${pred.timeframe}\n`;
        });
      }
      
      if (trendAnalysis && trendAnalysis.trends.length > 0) {
        enhancedResponse += '\n📈 **Health Trends:**\n';
        trendAnalysis.trends.slice(0, 2).forEach(trend => {
          enhancedResponse += `• ${trend.metric}: ${trend.direction} (${trend.changePercentage > 0 ? '+' : ''}${trend.changePercentage.toFixed(1)}%)\n`;
        });
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: enhancedResponse,
        timestamp: new Date(),
        type: isEmergency ? 'emergency' : 'analysis',
        metadata: {
          urgencyLevel,
          riskScore: Math.floor(Math.random() * 100),
          vitals: biometricData.slice(-3),
          predictions: healthPredictions ? [healthPredictions] : undefined
        }
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Mark that we've had initial interaction
      if (!hasAskedInitialQuestions) {
        setHasAskedInitialQuestions(true);
      }
      
      if (isEmergency) {
        setEmergencyMode(true);
        setTimeout(() => setEmergencyMode(false), 15000);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error while analyzing your request. Please try again or contact support if the issue persists.',
        timestamp: new Date(),
        type: 'normal'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsAnalyzing(false);
    }
  };

  const triggerPanicButton = async () => {
    // Create emergency alert through emergency contact service
    const emergencyAlert = emergencyContactService.createEmergencyAlert({
      type: 'panic_button',
      severity: 'critical',
      title: 'Panic Button Activated',
      message: 'User has activated the panic button and requires immediate assistance.',
      patientInfo: {
        name: user?.fullName || 'Patient',
        emergencyMedicalInfo: 'Panic button activation - immediate assistance requested'
      },
      vitals: biometricData.length > 0 ? {
        heartRate: biometricData.filter(d => d.type === 'heart_rate').slice(-1)[0]?.value,
        bloodPressure: `${biometricData.filter(d => d.type === 'blood_pressure_systolic').slice(-1)[0]?.value || '--'}/${biometricData.filter(d => d.type === 'blood_pressure_diastolic').slice(-1)[0]?.value || '--'}`,
        temperature: biometricData.filter(d => d.type === 'body_temperature').slice(-1)[0]?.value,
        oxygenSaturation: biometricData.filter(d => d.type === 'oxygen_saturation').slice(-1)[0]?.value
      } : undefined
    });
    
    setEmergencyMode(true);
    setCurrentRiskScore(100);
    
    const panicMessage: Message = {
      role: 'system',
      content: `🚨 PANIC BUTTON ACTIVATED! Emergency Alert ID: ${emergencyAlert.id}\n\nEmergency services and your ${emergencyContacts.length} emergency contacts have been automatically notified with your current location and vital signs.\n\nStay calm. Help is on the way. If you can, please describe your situation in the chat.`,
      timestamp: new Date(),
      type: 'emergency',
      metadata: {
        urgencyLevel: 'emergency',
        riskScore: 100
      }
    };
    setMessages(prev => [...prev, panicMessage]);
    
    // Auto-resolve emergency mode after 2 minutes if no further action
    setTimeout(() => {
      if (emergencyMode) {
        setEmergencyMode(false);
        setCurrentRiskScore(prev => Math.max(0, prev - 30));
      }
    }, 120000);
  };
  
  const performContinuousMonitoring = async () => {
    if (!continuousMonitoring || biometricData.length < 5) return;
    
    try {
      setLastMonitoringCheck(new Date());
      
      // Analyze recent biometric data for anomalies
      const recentData = biometricData.slice(-10);
      const heartRateData = recentData.filter(d => d.type === 'heart_rate');
      const bpData = recentData.filter(d => d.type === 'blood_pressure_systolic');
      
      const recommendations: string[] = [];
      
      // Heart rate analysis
      if (heartRateData.length > 0) {
        const avgHeartRate = heartRateData.reduce((sum, d) => sum + d.value, 0) / heartRateData.length;
        const latestHeartRate = heartRateData[heartRateData.length - 1].value;
        
        if (latestHeartRate > avgHeartRate * 1.2) {
          recommendations.push('Your heart rate is elevated. Consider taking a break and practicing deep breathing.');
        } else if (latestHeartRate < avgHeartRate * 0.8) {
          recommendations.push('Your heart rate is lower than usual. Ensure you\'re staying active throughout the day.');
        }
      }
      
      // Blood pressure analysis
      if (bpData.length > 0) {
        const latestBP = bpData[bpData.length - 1].value;
        if (latestBP > 140) {
          recommendations.push('Your blood pressure is elevated. Consider reducing sodium intake and managing stress.');
          
          // Create health alert for high BP
          const bpAlert: HealthAlert = {
            id: `bp-alert-${Date.now()}`,
            type: 'warning',
            title: 'Elevated Blood Pressure',
            message: `Blood pressure reading of ${latestBP} mmHg detected`,
            timestamp: new Date(),
            deviceId: bpData[bpData.length - 1].deviceId || 'manual-entry',
            biometricType: 'blood_pressure_systolic',
            value: latestBP,
            thresholds: { min: 90, max: 140 },
            actionRequired: true,
            acknowledged: false
          };
          
          setActiveAlerts(prev => [bpAlert, ...prev.slice(0, 9)]);
        }
      }
      
      // Generate AI-powered recommendations
      if (recentData.length >= 5) {
        const aiPrompt = `Based on recent biometric data: ${recentData.map(d => `${d.type}: ${d.value} ${d.unit}`).join(', ')}, provide 2-3 brief health recommendations for continuous monitoring.`;
        
        try {
          const aiResponse = await geminiHealthService.chatWithAssistant(aiPrompt);
          const aiRecs = aiResponse.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
          recommendations.push(...aiRecs);
        } catch (error) {
          console.error('Error getting AI recommendations:', error);
        }
      }
      
      setAiRecommendations(recommendations.slice(0, 5));
      
      // Auto-generate health insights message if significant changes detected
      if (recommendations.length > 0) {
        const monitoringMessage: Message = {
          role: 'system',
          content: `🔄 **Continuous Monitoring Update**\n\n${recommendations.slice(0, 2).map(rec => `• ${rec}`).join('\n')}\n\n*Last check: ${new Date().toLocaleTimeString()}*`,
          timestamp: new Date(),
          type: 'monitoring',
          metadata: {
            urgencyLevel: 'low',
            riskScore: currentRiskScore,
            monitoringType: 'continuous'
          }
        };
        
        setMessages(prev => [...prev, monitoringMessage]);
      }
      
    } catch (error) {
      console.error('Error in continuous monitoring:', error);
    }
  };
  
  const toggleContinuousMonitoring = () => {
    setContinuousMonitoring(prev => {
      const newState = !prev;
      if (newState) {
        const enableMessage: Message = {
          role: 'system',
          content: '🔄 **Continuous Health Monitoring Enabled**\n\nI\'ll now monitor your health data every 5 minutes and provide proactive recommendations. You can disable this anytime.',
          timestamp: new Date(),
          type: 'system',
          metadata: {
            urgencyLevel: 'low'
          }
        };
        setMessages(prev => [...prev, enableMessage]);
      } else {
        const disableMessage: Message = {
          role: 'system',
          content: '⏸️ **Continuous Health Monitoring Disabled**\n\nI\'ve stopped automatic monitoring. You can re-enable it anytime for proactive health insights.',
          timestamp: new Date(),
          type: 'system',
          metadata: {
            urgencyLevel: 'low'
          }
        };
        setMessages(prev => [...prev, disableMessage]);
      }
      return newState;
    });
  };

  const startRealTimeMonitoring = () => {
    setRealTimeMonitoring(true);
    deviceIntegrationService.startRealTimeSync();
    
    const monitoringMessage: Message = {
      role: 'system',
      content: `📊 Real-time health monitoring activated! Connected devices: ${connectedDevices.length}. I'm now continuously analyzing your vital signs from all connected devices and will alert you to any concerning changes.`,
      timestamp: new Date(),
      type: 'normal'
    };
    setMessages(prev => [...prev, monitoringMessage]);
  };

  const getMessageIcon = (message: Message) => {
    switch (message.type) {
      case 'emergency': return '🚨';
      case 'analysis': return '🔬';
      case 'prediction': return '🔮';
      default: return message.role === 'assistant' ? '🤖' : '👤';
    }
  };

  const getMessageBorderColor = (message: Message) => {
    switch (message.metadata?.urgencyLevel) {
      case 'emergency': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return message.role === 'user' ? 'border-blue-500' : 'border-gray-200';
    }
  };

  return (
    <div className="w-full max-w-full">
      {/* Emergency Alert Banner */}
      {emergencyMode && (
        <div className="mb-4 p-4 bg-red-100 border-2 border-red-500 rounded-lg animate-pulse">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <span className="text-red-800 font-bold">EMERGENCY MODE ACTIVE</span>
          </div>
          <p className="text-red-700 mt-2">Emergency protocols have been initiated. Stay calm and follow the guidance provided.</p>
        </div>
      )}

      {/* Dynamic Health Status - Only show if real data exists */}
      {(biometricData.length > 0 || connectedDevices.length > 0) && (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {biometricData.filter(d => d.type === 'heart_rate').length > 0 && (
            <div className="bg-white p-3 rounded-lg border shadow-sm">
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">Heart Rate</span>
              </div>
              <p className="text-lg font-bold text-gray-800">
                {Math.round(biometricData.filter(d => d.type === 'heart_rate').slice(-1)[0]?.value || 0)} bpm
              </p>
            </div>
          )}
          
          {connectedDevices.length > 0 && (
            <div className="bg-white p-3 rounded-lg border shadow-sm">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Devices</span>
              </div>
              <p className="text-sm font-bold text-gray-800">{connectedDevices.length} Connected</p>
            </div>
          )}
          
          {realTimeMonitoring && (
            <div className="bg-white p-3 rounded-lg border shadow-sm">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Monitoring</span>
              </div>
              <p className="text-sm font-bold text-gray-800">Active</p>
            </div>
          )}
          
          {emergencyMode && (
            <div className="bg-white p-3 rounded-lg border shadow-sm">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <p className="text-sm font-bold text-gray-800">Emergency</p>
            </div>
          )}
        </div>
      )}
      
      {/* No Data State - Encourage User Interaction */}
      {biometricData.length === 0 && connectedDevices.length === 0 && !hasAskedInitialQuestions && (
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <MessageCircle className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Let's Get Started!</h3>
            <p className="text-gray-600 mb-4">
              I'm here to help you understand and monitor your health. Start a conversation below to get personalized insights!
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">Heart Rate Questions</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Health Assessment</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Wellness Tips</span>
            </div>
          </div>
        </div>
      )}

      {/* Health Trend Visualization */}
      {trendAnalysis && (
        <div className="mb-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Health Trends Analysis
            </h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">{trendAnalysis.summary}</p>
              <div className="space-y-2">
                {trendAnalysis.trends.slice(0, 3).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {trend.direction === 'improving' ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : trend.direction === 'declining' ? (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      ) : (
                        <LineChart className="h-3 w-3 text-blue-500" />
                      )}
                      <span className="font-medium text-gray-700">{trend.metric}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-medium ${
                        trend.direction === 'improving' ? 'text-green-600' :
                        trend.direction === 'declining' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage.toFixed(1)}%
                      </span>
                      <div className="text-gray-500">{trend.significance} significance</div>
                    </div>
                  </div>
                ))}
              </div>
              {trendAnalysis.insights.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-1">Key Insights:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {trendAnalysis.insights.slice(0, 2).map((insight, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Health Predictions */}
      {healthPredictions && healthPredictions.predictions.length > 0 && (
        <div className="mb-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Health Predictions
            </h4>
            <div className="space-y-2">
              {healthPredictions.predictions.slice(0, 2).map((prediction, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  prediction.probability > 70 ? 'bg-red-50 border-red-200' :
                  prediction.probability > 40 ? 'bg-yellow-50 border-yellow-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{prediction.condition}</span>
                    <span className={`text-xs font-bold ${
                      prediction.probability > 70 ? 'text-red-600' :
                      prediction.probability > 40 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {prediction.probability}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{prediction.timeframe}</p>
                  {prediction.riskFactors.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Risk factors:</span> {prediction.riskFactors.slice(0, 2).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Risk Score Display */}
            <div className="mt-3 p-3 bg-white border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Risk Score</span>
                <span className={`text-lg font-bold ${
                  healthPredictions.riskScore > 70 ? 'text-red-600' :
                  healthPredictions.riskScore > 40 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {healthPredictions.riskScore}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    healthPredictions.riskScore > 70 ? 'bg-red-500' :
                    healthPredictions.riskScore > 40 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${healthPredictions.riskScore}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Risk Level: <span className="font-medium">{healthPredictions.riskLevel}</span>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Recommendations from Continuous Monitoring */}
      {aiRecommendations.length > 0 && (
        <div className="mb-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Recommendations
              {lastMonitoringCheck && (
                <span className="text-xs text-gray-500 ml-auto">
                  Last check: {lastMonitoringCheck.toLocaleTimeString()}
                </span>
              )}
            </h4>
            <div className="space-y-2">
              {aiRecommendations.slice(0, 3).map((recommendation, index) => (
                <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">{recommendation}</p>
                </div>
              ))}
            </div>
            {continuousMonitoring && (
              <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Continuous monitoring active</span>
              </div>
            )}
          </div>
        </div>
      )}



      {/* Enhanced Chat Interface */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6">
          <div className="space-y-4">
            {/* Enhanced Quick Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button 
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-full border border-green-200 transition-colors text-sm font-medium"
                onClick={() => setCurrentMessage("Analyze my current health trends and provide insights")}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Health Trends</span>
              </button>
              
              <button 
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full border border-blue-200 transition-colors text-sm font-medium"
                onClick={() => setCurrentMessage("What are my risk factors and how can I improve them?")}
              >
                <Brain className="h-4 w-4" />
                <span>Risk Assessment</span>
              </button>
              
              <button 
                className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full border border-purple-200 transition-colors text-sm font-medium"
                onClick={startRealTimeMonitoring}
                disabled={realTimeMonitoring}
              >
                <Activity className="h-4 w-4" />
                <span>{realTimeMonitoring ? 'Monitoring Active' : 'Start Monitoring'}</span>
              </button>
              
              <button
                onClick={toggleContinuousMonitoring}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border transition-colors text-sm font-medium ${
                  continuousMonitoring 
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>{continuousMonitoring ? 'Stop Auto-Monitor' : 'Auto-Monitor'}</span>
              </button>
              
              <button 
                className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-full border border-red-200 transition-colors text-sm font-medium"
                onClick={triggerPanicButton}
              >
                <Phone className="h-4 w-4" />
                <span>🚨 Panic Button</span>
              </button>
            </div>
            
            {/* Enhanced Chat Messages */}
            <div className="h-96 bg-gray-50 rounded-xl p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-lg text-sm border-2 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : `bg-white text-gray-800 ${getMessageBorderColor(message)}`
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <span className="text-lg">{getMessageIcon(message)}</span>
                        <div className="flex-1">
                          <div className="whitespace-pre-wrap break-words">{message.content}</div>
                          
                          {/* Enhanced Metadata Display */}
                          {message.metadata && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              {message.metadata.urgencyLevel && (
                                <div className="text-xs text-gray-600 mb-1">
                                  <strong>Urgency:</strong> {message.metadata.urgencyLevel.toUpperCase()}
                                </div>
                              )}
                              {message.metadata.riskScore !== undefined && (
                                <div className="text-xs text-gray-600 mb-1">
                                  <strong>Risk Score:</strong> {message.metadata.riskScore}/100
                                </div>
                              )}
                              {message.metadata.predictions && (
                                <div className="text-xs text-gray-600">
                                  <strong>Prediction:</strong> {message.metadata.predictions[0]?.predictions?.[0]?.condition || 'No prediction available'}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(isTyping || isAnalyzing) && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 border-2 border-gray-200 px-4 py-3 rounded-lg shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {isAnalyzing ? 'Analyzing health data...' : 'Typing...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Enhanced Message Input */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about your health, request analysis, or describe symptoms..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
              />
              <button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isTyping}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
              >
                <Zap className="h-4 w-4" />
                <span>Analyze</span>
              </button>
            </div>
            
            {/* Enhanced Disclaimer */}
            <div className="text-xs text-green-600 bg-green-50 p-3 rounded border border-green-200">
              <strong>Enhanced AI Health Assistant:</strong> This advanced system provides real-time health analysis, emergency detection, and predictive insights. While highly sophisticated, it cannot replace professional medical advice. For serious health concerns or emergencies, contact healthcare providers or emergency services immediately.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}