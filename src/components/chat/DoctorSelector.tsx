'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, User, UserCheck } from 'lucide-react';
import Image from 'next/image';

interface Doctor {
  id: string;
  name: string;
  gender: 'male' | 'female';
  specialization: string;
  avatar?: string;
  bio?: string;
  isActive: boolean;
}

interface DoctorSelectorProps {
  onDoctorSelect: (doctor: Doctor) => void;
  selectedDoctor?: Doctor | null;
  className?: string;
}

export default function DoctorSelector({ 
  onDoctorSelect, 
  selectedDoctor, 
  className = '' 
}: DoctorSelectorProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to seed doctors if they don't exist
      await fetch('/api/chat/seed', { method: 'POST' });
      
      // Then fetch the doctors
      const response = await fetch('/api/chat/doctors');
      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }
      
      const data = await response.json();
      setDoctors(data.doctors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    onDoctorSelect(doctor);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-between p-3 border border-red-300 rounded-lg bg-red-50">
          <span className="text-red-600 text-sm">{error}</span>
          <button 
            onClick={fetchDoctors}
            className="text-red-600 hover:text-red-800 text-sm underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <div className="flex items-center space-x-3">
          {selectedDoctor ? (
            <>
              {selectedDoctor.avatar ? (
                <Image
                  src={selectedDoctor.avatar}
                  alt={selectedDoctor.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {selectedDoctor.gender === 'male' ? (
                    <User className="w-4 h-4 text-blue-600" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-pink-600" />
                  )}
                </div>
              )}
              <div className="text-left">
                <div className="font-medium text-gray-900">{selectedDoctor.name}</div>
                <div className="text-sm text-gray-500">{selectedDoctor.specialization}</div>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-500">Select a Doctor</div>
                <div className="text-sm text-gray-400">Choose your preferred doctor</div>
              </div>
            </>
          )}
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {doctors.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No doctors available
            </div>
          ) : (
            doctors.map((doctor) => (
              <button
                key={doctor.id}
                onClick={() => handleDoctorSelect(doctor)}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 text-left"
              >
                {doctor.avatar ? (
                  <Image
                    src={doctor.avatar}
                    alt={doctor.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {doctor.gender === 'male' ? (
                    <User className="w-5 h-5 text-primary" />
                  ) : (
                    <UserCheck className="w-5 h-5 text-teal-600" />
                  )}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{doctor.name}</div>
                  <div className="text-sm text-gray-500">{doctor.specialization}</div>
                  {doctor.bio && (
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {doctor.bio}
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    doctor.gender === 'male' 
                      ? 'bg-teal-50 text-primary' 
                      : 'bg-emerald-50 text-teal-700'
                  }`}>
                    {doctor.gender === 'male' ? 'Male Specialist' : 'Female Specialist'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}