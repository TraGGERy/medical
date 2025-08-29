'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import AppointmentBooking from '@/components/telemedicine/AppointmentBooking';
import Header from '@/components/Header';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function BookAppointmentPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const handleBookingComplete = (consultationId?: string) => {
    if (consultationId) {
      // AI consultation started, redirect to dashboard with active chat
      router.push(`/dashboard?activeTab=chat&consultationId=${consultationId}`);
    } else {
      // Regular appointment booked, redirect to appointments page
      router.push('/telemedicine/appointments');
    }
  };

  const handleBookingCancel = () => {
    router.push('/telemedicine');
  };

  // Redirect to sign-in if not authenticated
  if (isLoaded && !isSignedIn) {
    redirect('/sign-in?redirect=/telemedicine/book-appointment');
  }

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/telemedicine')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Telemedicine
            </Button>
          </div>
          
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Book an Appointment
            </h1>
            <p className="text-gray-600 mt-2">
              Find and book appointments with qualified healthcare providers
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AppointmentBooking 
          onComplete={handleBookingComplete}
          onCancel={handleBookingCancel}
        />
      </div>
    </div>
  );
}