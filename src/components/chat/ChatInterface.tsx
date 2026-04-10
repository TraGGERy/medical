'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, AlertCircle, Paperclip } from 'lucide-react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import ImageUpload from './ImageUpload';

interface Doctor {
  id: string;
  name: string;
  gender: 'male' | 'female';
  specialization: string;
  avatar?: string;
  bio?: string;
  isActive: boolean;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'doctor';
  content: string;
  messageType: string;
  metadata?: any;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  hasAttachments?: boolean;
  attachments?: MessageAttachment[];
}

interface MessageAttachment {
  id: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  thumbnailUrl?: string;
  isPrescription: boolean;
  analysisResult?: any;
}

interface Conversation {
  id: string;
  userId: string;
  doctorId: string;
  title: string;
  status: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatInterfaceProps {
  doctor: Doctor;
  onBack?: () => void;
  className?: string;
}

export default function ChatInterface({ doctor, onBack, className = '' }: ChatInterfaceProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Local storage key for caching messages
  const getStorageKey = (conversationId: string) => `chat_messages_${conversationId}`;
  const getConversationStorageKey = (doctorId: string, userId: string) => `conversation_${doctorId}_${userId}`;
  
  // Clean up old cached data (older than 7 days)
  const cleanupOldCache = () => {
    try {
      const keys = Object.keys(localStorage);
      const chatKeys = keys.filter(key => key.startsWith('chat_messages_') || key.startsWith('conversation_'));
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      chatKeys.forEach(key => {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const data = JSON.parse(item);
            const lastUpdate = new Date(data.updatedAt || data.createdAt || 0).getTime();
            if (lastUpdate < sevenDaysAgo) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          // Remove corrupted items
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Failed to cleanup old cache:', e);
    }
  };

  useEffect(() => {
    if (doctor && user) {
      // Clean up old cached data on component mount
      cleanupOldCache();
      
      // Try to load cached conversation first for faster initialization
      const cachedConversation = localStorage.getItem(getConversationStorageKey(doctor.id, user.id));
      if (cachedConversation) {
        try {
          const parsed = JSON.parse(cachedConversation);
          setConversation(parsed);
          // Load cached messages immediately
          const cachedMessages = localStorage.getItem(getStorageKey(parsed.id));
          if (cachedMessages) {
            try {
              setMessages(JSON.parse(cachedMessages));
            } catch (e) {
              console.warn('Failed to parse cached messages:', e);
            }
          }
        } catch (e) {
          console.warn('Failed to parse cached conversation:', e);
        }
      }
      
      initializeConversation();
    }
  }, [doctor, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeConversation = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, try to find existing conversation
      const conversationsResponse = await fetch('/api/chat/conversations');
      if (!conversationsResponse.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const conversationsData = await conversationsResponse.json();
      const existingConversation = conversationsData.conversations?.find(
        (conv: any) => conv.doctor.id === doctor.id
      );

      let currentConversation = existingConversation;

      // If no existing conversation, create one
      if (!currentConversation) {
        const createResponse = await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctorId: doctor.id,
            title: `Chat with ${doctor.name}`,
          }),
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create conversation');
        }

        const createData = await createResponse.json();
        currentConversation = createData.conversation;
      }

      setConversation(currentConversation);
      
      // Cache conversation info
      if (currentConversation && user) {
        localStorage.setItem(
          getConversationStorageKey(doctor.id, user.id),
          JSON.stringify(currentConversation)
        );
      }

      // Load messages
      if (currentConversation) {
        await loadMessages(currentConversation.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      // First, try to load from localStorage for instant display
      const cachedMessages = localStorage.getItem(getStorageKey(conversationId));
      if (cachedMessages) {
        try {
          const parsed = JSON.parse(cachedMessages);
          setMessages(parsed);
        } catch (e) {
          console.warn('Failed to parse cached messages:', e);
        }
      }

      // Then fetch fresh data from server
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      const freshMessages = data.messages || [];
      setMessages(freshMessages);
      
      // Cache the fresh messages
      localStorage.setItem(getStorageKey(conversationId), JSON.stringify(freshMessages));
    } catch (err) {
      console.error('Error loading messages:', err);
      // If server fails but we have cached messages, keep them
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && pendingAttachments.length === 0) || !conversation || sending) return;

    const messageContent = newMessage.trim();
    const attachments = [...pendingAttachments];
    setNewMessage('');
    setPendingAttachments([]);
    setShowImageUpload(false);
    setSending(true);

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          content: messageContent,
          messageType: attachments.length > 0 ? 'multimedia' : 'text',
          attachments: attachments,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Reload messages to get the latest
      await loadMessages(conversation.id);
      
      // Poll for doctor response
      setTimeout(() => {
        loadMessages(conversation.id);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setNewMessage(messageContent); // Restore message on error
      setPendingAttachments(attachments); // Restore attachments on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageUpload = (files: any[]) => {
    setPendingAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading chat...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chat Error</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={initializeConversation}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-400 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          {doctor.avatar ? (
            <Image
              src={doctor.avatar}
              alt={doctor.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center">
              <span className="text-primary font-medium">
                {doctor.name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-medium text-gray-900">{doctor.name}</h3>
            <p className="text-sm text-gray-500">{doctor.specialization}</p>
          </div>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Back
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              {doctor.avatar ? (
                <Image
                  src={doctor.avatar}
                  alt={doctor.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <span className="text-primary font-medium text-lg">
                  {doctor.name.charAt(0)}
                </span>
              )}
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Start a conversation</h4>
            <p className="text-gray-500 text-sm">
              Send a message to {doctor.name} to begin your consultation.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                  message.senderType === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-900 border border-slate-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.hasAttachments && message.attachments && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-black bg-opacity-10 rounded">
                        <div className="text-xs">
                          📎 {attachment.originalName}
                          {attachment.isPrescription && (
                            <span className="ml-2 px-1 py-0.5 bg-white bg-opacity-20 rounded text-xs">
                              Prescription
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p
                  className={`text-xs mt-1 ${
                    message.senderType === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-end">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-primary text-white shadow-lg shadow-teal-500/20">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">AI doctor is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        {/* Pending Attachments */}
        {pendingAttachments.length > 0 && (
          <div className="mb-3 space-y-2">
            {pendingAttachments.map((attachment, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">📎 {attachment.originalName}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Image Upload Component */}
        {showImageUpload && (
          <div className="mb-3">
            <ImageUpload
              onUpload={handleImageUpload}
              onClose={() => setShowImageUpload(false)}
            />
          </div>
        )}
        
        <div className="flex items-end space-x-2">
          <button
            onClick={() => setShowImageUpload(!showImageUpload)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            disabled={sending}
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${doctor.name}...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[40px] max-h-32"
              rows={1}
              disabled={sending}
            />
          </div>
            <button
              onClick={sendMessage}
              disabled={(!newMessage.trim() && pendingAttachments.length === 0) || sending}
              className="p-3 bg-primary text-white rounded-xl hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/20"
            >
              <Send className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
}