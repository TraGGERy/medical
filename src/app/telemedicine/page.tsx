'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  UserPlus, 
  Video, 
  Stethoscope,
  Clock,
  Shield,
  Star,
  Users,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import Header from '@/components/Header';

export default function TelemedicinePage() {
  const router = useRouter();
  const { isSignedIn } = useUser();

  const handleBookAppointment = () => {
    if (!isSignedIn) {
      router.push('/sign-in?redirect=/telemedicine/book-appointment');
      return;
    }
    router.push('/telemedicine/book-appointment');
  };

  const handleProviderRegistration = () => {
    if (!isSignedIn) {
      router.push('/sign-in?redirect=/telemedicine/provider-registration');
      return;
    }
    router.push('/telemedicine/provider-registration');
  };

  const handleProviderDashboard = () => {
    if (!isSignedIn) {
      router.push('/sign-in?redirect=/telemedicine/provider-dashboard');
      return;
    }
    router.push('/telemedicine/provider-dashboard');
  };

  const features = [
    {
      icon: Video,
      title: "Virtual Consultations",
      description: "Connect with healthcare providers through secure video calls"
    },
    {
      icon: Calendar,
      title: "Easy Scheduling",
      description: "Book appointments that fit your schedule"
    },
    {
      icon: Shield,
      title: "HIPAA Compliant",
      description: "Your health data is secure and private"
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Access healthcare when you need it most"
    }
  ];

  const specialties = [
    "General Medicine",
    "Cardiology",
    "Dermatology",
    "Mental Health",
    "Pediatrics",
    "Endocrinology"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Stethoscope className="w-4 h-4 mr-2" />
            Telemedicine Platform
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Healthcare at Your
            <span className="text-blue-600 block">Fingertips</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with qualified healthcare providers from the comfort of your home. 
            Get professional medical consultations, prescriptions, and follow-up care.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={handleBookAppointment}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Book Appointment
            </Button>
            
            <Button 
              onClick={handleProviderRegistration}
              variant="outline"
              size="lg"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Join as Provider
            </Button>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Secure & Private
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Licensed Providers
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Insurance Accepted
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our Telemedicine Platform?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience healthcare that adapts to your lifestyle with our comprehensive telemedicine solution.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Medical Specialties Available
            </h2>
            <p className="text-gray-600">
              Connect with specialists across various medical fields
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {specialties.map((specialty, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="px-4 py-2 text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
              >
                {specialty}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Verified Providers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-100">Consultations Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.9</div>
              <div className="text-blue-100 flex items-center justify-center">
                <Star className="w-4 h-4 mr-1 fill-current" />
                Average Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 mb-8">
            Join thousands of patients and providers who trust our platform for their healthcare needs.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleBookAppointment}>
              <div className="text-center">
                <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">For Patients</h3>
                <p className="text-gray-600 mb-4">Book appointments and consult with healthcare providers</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0">
                  Book Appointment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
            
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleProviderRegistration}>
              <div className="text-center">
                <Stethoscope className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">For Providers</h3>
                <p className="text-gray-600 mb-4">Join our network and expand your practice</p>
                <Button variant="outline" className="w-full">
                  Register as Provider
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>
          
          {isSignedIn && (
            <div className="mt-8">
              <Button 
                onClick={handleProviderDashboard}
                variant="ghost"
                className="text-blue-600 hover:text-blue-700"
              >
                Access Provider Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}