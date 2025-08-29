'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import ProviderDashboard from '@/components/telemedicine/ProviderDashboard';
import Header from '@/components/Header';
import { ArrowLeft, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function ProviderDashboardPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();

  // Redirect to sign-in if not authenticated
  if (isLoaded && !isSignedIn) {
    redirect('/sign-in?redirect=/telemedicine/provider-dashboard');
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
          <div className="flex items-center justify-between">
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
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold text-gray-900">
                  Dr. {user?.firstName || 'Provider'}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Provider Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your appointments, availability, and patient consultations
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              size="sm" 
              variant="outline"
              className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => {
                // Scroll to availability section or implement quick action
                const availabilitySection = document.getElementById('availability-section');
                availabilitySection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Update Availability
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => {
                // Scroll to appointments section or implement quick action
                const appointmentsSection = document.getElementById('appointments-section');
                appointmentsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              View Appointments
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => router.push('/telemedicine/provider-registration')}
            >
              Update Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProviderDashboard />
      </div>
    </div>
  );
}