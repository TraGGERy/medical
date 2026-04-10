'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import DoctorSelector from './DoctorSelector';
import ChatInterface from './ChatInterface';

interface Doctor {
  id: string;
  name: string;
  gender: 'male' | 'female';
  specialization: string;
  avatar?: string;
  bio?: string;
  isActive: boolean;
}

interface ChatPageProps {
  className?: string;
}

export default function ChatPage({ className = '' }: ChatPageProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Load selected doctor from localStorage on mount
  useEffect(() => {
    const savedDoctor = localStorage.getItem('selectedDoctor');
    if (savedDoctor) {
      try {
        const doctor = JSON.parse(savedDoctor);
        setSelectedDoctor(doctor);
      } catch (error) {
        console.error('Error parsing saved doctor:', error);
        localStorage.removeItem('selectedDoctor');
      }
    }
  }, []);

  // Save selected doctor to localStorage
  useEffect(() => {
    if (selectedDoctor) {
      localStorage.setItem('selectedDoctor', JSON.stringify(selectedDoctor));
    }
  }, [selectedDoctor]);

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowChat(true);
  };

  const handleBackToSelector = () => {
    setShowChat(false);
  };

  const handleStartChat = () => {
    if (selectedDoctor) {
      setShowChat(true);
    }
  };

  if (showChat && selectedDoctor) {
    return (
      <div className={`h-full ${className}`}>
        <ChatInterface 
          doctor={selectedDoctor} 
          onBack={handleBackToSelector}
        />
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-secondary">AI Health Assistant</h1>
              <p className="text-sm text-slate-500">Professional medical consultation powered by AI Specialists</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Doctor Selection Section */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Choose Your Doctor
              </h2>
              <DoctorSelector 
                onDoctorSelect={handleDoctorSelect}
                selectedDoctor={selectedDoctor}
                className="max-w-md"
              />
            </div>

            {/* Selected Doctor Info & Chat Button */}
            {selectedDoctor && (
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Ready to chat with {selectedDoctor.name}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Specialization:</span> {selectedDoctor.specialization}
                      </p>
                      <p>
                        <span className="font-medium">Gender:</span> {selectedDoctor.gender === 'male' ? 'Male Doctor' : 'Female Doctor'}
                      </p>
                      {selectedDoctor.bio && (
                        <p>
                          <span className="font-medium">About:</span> {selectedDoctor.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleStartChat}
                    className="ml-6 px-8 py-3 bg-primary text-white rounded-xl hover:bg-teal-400 transition-colors duration-200 flex items-center space-x-2 font-bold shadow-lg shadow-teal-500/20"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Start Consultation</span>
                  </button>
                </div>
              </div>
            )}

            {/* Instructions */}
            {!selectedDoctor && (
              <div className="p-6 bg-gray-50">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Professional Medical Consultation
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Select a doctor from the dropdown above to start your consultation. 
                    Our doctors are available to help with your health concerns.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Real-time Chat</h3>
              <p className="text-sm text-gray-600">
                Instant messaging with qualified medical professionals for immediate assistance.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-sm text-gray-600">
                Your conversations are encrypted and protected according to medical privacy standards.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">24/7 Availability</h3>
              <p className="text-sm text-gray-600">
                Access medical consultation anytime, anywhere with our dedicated healthcare team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}