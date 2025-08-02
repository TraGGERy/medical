'use client';

import { useState } from 'react';

export default function AIHealthAssistant() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hello! I\'m your MediScope AI. I\'m here to help you with health questions, wellness tips, and general health guidance. How can I assist you today? 🌟' }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = { role: 'user' as const, content: currentMessage };
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    try {
      // Simulate AI response for now since the chat API was removed
      setTimeout(() => {
        const responses = [
          "Thank you for your question! As your MediScope AI, I'm here to provide general health guidance. For specific medical concerns, please consult with a healthcare professional.",
          "That's a great wellness question! Remember that maintaining a balanced diet, regular exercise, and adequate sleep are fundamental pillars of good health.",
          "I appreciate you reaching out about your health concerns. While I can provide general wellness information, it's always best to discuss specific symptoms with a qualified healthcare provider.",
          "Great question about wellness! Staying hydrated, managing stress, and maintaining social connections are also important aspects of overall health and wellbeing."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const assistantMessage = { role: 'assistant' as const, content: randomResponse };
        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { role: 'assistant' as const, content: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full max-w-full">
      {/* Chat Interface */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-3 sm:p-6">
          <div className="space-y-4">
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button 
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-full border border-green-200 transition-colors text-sm font-medium"
                onClick={() => setCurrentMessage("What are some healthy breakfast ideas?")}
              >
                <span>🥗</span>
                <span>Nutrition Tips</span>
              </button>
              
              <button 
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full border border-blue-200 transition-colors text-sm font-medium"
                onClick={() => setCurrentMessage("How can I improve my sleep quality?")}
              >
                <span>😴</span>
                <span>Sleep Health</span>
              </button>
              
              <button 
                className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full border border-purple-200 transition-colors text-sm font-medium"
                onClick={() => setCurrentMessage("What exercises can I do at home?")}
              >
                <span>🏃‍♀️</span>
                <span>Exercise Guide</span>
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="h-64 sm:h-80 lg:h-96 bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 overflow-y-auto">
              <div className="space-y-3 sm:space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm sm:text-base ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-800 border shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 border px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Message Input */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask MediScope AI about wellness, health tips, nutrition, exercise..."
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black text-sm sm:text-base"
              />
              <button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isTyping}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium"
              >
                Send
              </button>
            </div>
            
            {/* Disclaimer */}
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
              <strong>Disclaimer:</strong> MediScope AI provides general wellness information and cannot replace professional medical advice. For serious health concerns, please consult a healthcare provider.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}