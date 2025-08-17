'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  MapPin, 
  Video,
  Phone,
  MessageSquare,
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  avatar: string;
  nextAvailable: string;
  languages: string[];
  price: string;
  experience: string;
  type: 'human' | 'ai';
  description?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface AppointmentBookingProps {
  onComplete: (consultationId?: string) => void;
  onCancel?: () => void;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ onComplete, onCancel }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<'video' | 'phone' | 'in-person'>('video');
  const [reason, setReason] = useState<string>('');
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');

  // Fetch providers from API
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        
        // Fetch both human and AI providers
        const [humanResponse, aiResponse] = await Promise.all([
          fetch('/api/providers?verified=true&available=true'),
          fetch('/api/ai-providers?isActive=true&isAvailable=true')
        ]);
        
        const humanData = humanResponse.ok ? await humanResponse.json() : { data: [] };
        const aiData = aiResponse.ok ? await aiResponse.json() : { providers: [] };
        
        // Transform human providers to match expected format
        const humanProviders = (humanData.data || []).map((provider: any) => ({
          id: provider.id,
          name: `${provider.firstName || ''} ${provider.lastName || ''}`.trim() || 'Unknown Provider',
          specialty: provider.specialty || 'General Medicine',
          rating: parseFloat(provider.rating || '4.5'),
          reviews: provider.totalReviews || 0,
          avatar: '/placeholder-doctor.jpg',
          nextAvailable: 'Available today',
          languages: provider.languages || ['English'],
          price: provider.consultationFee || '50',
          experience: `${provider.yearsOfExperience || 0} years`,
          type: 'human'
        }));
        
        // Transform AI providers to match expected format
        const aiProviders = (aiData.providers || []).map((provider: any) => ({
          id: provider.id,
          name: provider.name,
          specialty: provider.specialty,
          rating: parseFloat(provider.rating || '4.8'),
          reviews: provider.totalConsultations || 0,
          avatar: provider.avatar || provider.profileImage || '/placeholder-doctor.jpg',
          nextAvailable: 'Available instantly',
          languages: provider.languages || ['English'],
          price: provider.consultationFee || '25',
          experience: provider.experience || 'AI Specialist',
          type: 'ai',
          description: provider.description
        }));
        
        // Combine both types of providers
        const allProviders = [...aiProviders, ...humanProviders];
        setProviders(allProviders);
        
        if (allProviders.length === 0) {
          toast.info('No providers available at the moment');
        }
      } catch (error: unknown) {
        console.error('Error fetching providers:', error);
        toast.error('Failed to load providers');
        // Fallback to mock data
        setProviders([
          {
            id: 'ai-1',
            name: 'Dr. Sarah Chen',
            specialty: 'Pulmonology',
            rating: 4.9,
            reviews: 127,
            avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20doctor%20headshot%20medical%20uniform&image_size=square',
            nextAvailable: 'Available instantly',
            languages: ['English'],
            price: '25',
            experience: 'AI Specialist',
            type: 'ai'
          },
          {
            id: 'ai-2',
            name: 'Dr. Michael Rodriguez',
            specialty: 'Cardiology',
            rating: 4.8,
            reviews: 89,
            avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20male%20doctor%20headshot%20medical%20uniform&image_size=square',
            nextAvailable: 'Available instantly',
            languages: ['English', 'Spanish'],
            price: '25',
            experience: 'AI Specialist',
            type: 'ai'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
  ];

  const appointmentTypes = [
    { id: 'video', label: 'Video Call', icon: Video, description: 'Face-to-face consultation' },
    { id: 'phone', label: 'Phone Call', icon: Phone, description: 'Voice consultation' },
    { id: 'chat', label: 'Secure Chat', icon: MessageSquare, description: 'Text-based consultation' }
  ];

  const handleStartAIConsultation = async (provider: any) => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for visit before starting consultation');
      return;
    }

    if (!isSignedIn || !user) {
      toast.error('Please log in to start an AI consultation');
      return;
    }

    setIsBooking(true);
    
    try {
      const token = await getToken();
      const response = await fetch('/api/ai-consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          aiProviderId: provider.id,
          reasonForVisit: reason.trim(),
          symptoms: [],
          urgencyLevel: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start AI consultation');
      }

      const data = await response.json();
      console.log('🎉 AppointmentBooking - AI consultation API response:', {
        data,
        consultationId: data.consultation?.id,
        timestamp: new Date().toISOString()
      });
      
      toast.success('AI consultation started!', {
        description: `Starting chat with ${provider.name}`
      });
      
      // Pass consultation ID back to parent instead of redirecting
      if (onComplete) {
        console.log('📞 AppointmentBooking - Calling onComplete with ID:', data.consultation.id);
        onComplete(data.consultation.id);
        console.log('✅ AppointmentBooking - onComplete called successfully');
      } else {
        console.log('⚠️ AppointmentBooking - onComplete callback not provided');
      }
    } catch (error: unknown) {
      console.error('Error starting AI consultation:', error);
      toast.error('Failed to start AI consultation', {
        description: error instanceof Error ? error.message : 'Please try again.'
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedProvider || !reason.trim()) {
      toast.error('Please select a provider and provide a reason for visit');
      return;
    }
    
    if (!isSignedIn || !user) {
      toast.error('Please log in to book an appointment');
      return;
    }
    
    setIsBooking(true);
    
    // Check if selected provider is an AI provider
    if (selectedProvider.type === 'ai') {
      try {
        const token = await getToken();
        const response = await fetch('/api/ai-consultations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            aiProviderId: selectedProvider.id,
            reasonForVisit: reason.trim(),
            symptoms: [],
            urgencyLevel: 1,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to start AI consultation');
        }

        const data = await response.json();
        console.log('🎉 AppointmentBooking - handleBookAppointment AI consultation API response:', {
          data,
          consultationId: data.consultation?.id,
          timestamp: new Date().toISOString()
        });
        
        toast.success('AI consultation started!', {
          description: `Starting chat with ${selectedProvider.name}`
        });
        
        // Pass consultation ID back to parent instead of redirecting
        if (onComplete) {
          console.log('📞 AppointmentBooking - handleBookAppointment calling onComplete with ID:', data.consultation.id);
          onComplete(data.consultation.id);
          console.log('✅ AppointmentBooking - handleBookAppointment onComplete called successfully');
        } else {
          console.log('⚠️ AppointmentBooking - handleBookAppointment onComplete callback not provided');
        }
        return;
      } catch (error: unknown) {
        console.error('Error starting AI consultation:', error);
        toast.error('Failed to start AI consultation', {
          description: error instanceof Error ? error.message : 'Please try again.'
        });
        setIsBooking(false);
        return;
      }
    }
    
    // For human providers, require date and time
    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time for human provider appointment');
      setIsBooking(false);
      return;
    }
    
    try {
      const appointmentData = {
        patientId: user.id,
        providerId: selectedProvider.id,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        appointmentType: appointmentType,
        duration: 30, // Default duration
        symptoms: reason.trim(),
        notes: `Appointment booked via telemedicine platform for ${selectedProvider.specialty}`
      };

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book appointment');
      }

      const result = await response.json();
      
      toast.success('Appointment booked successfully!', {
        description: `Your appointment with ${selectedProvider.name} is scheduled for ${new Date(selectedDate).toLocaleDateString()} at ${selectedTime}`
      });
      
      if (onComplete) {
        onComplete();
      }
    } catch (error: unknown) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment', {
        description: error instanceof Error ? error.message : 'Please try again or contact support if the problem persists.'
      });
    } finally {
      setIsBooking(false);
    }
  };

  const isFormValid = selectedProvider && reason.trim() && 
    (selectedProvider.type === 'ai' || (selectedDate && selectedTime));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
        <p className="text-gray-600 mt-2">Schedule a consultation with a healthcare provider</p>
      </div>

      {/* Step 1: Select Provider */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Healthcare Provider</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <motion.div
              key={provider.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`p-4 cursor-pointer transition-all ${
                  selectedProvider?.id === provider.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => {
                  setSelectedProvider(provider);
                  // Don't start consultation immediately - let user fill in reason first
                }}
              >
                <div className="flex items-start space-x-3">
                  <img 
                    src={provider.avatar || '/default-doctor.png'} 
                    alt={provider.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        provider.type === 'ai' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {provider.type === 'ai' ? 'AI' : 'Human'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{provider.specialty}</p>
                    <div className="flex items-center mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">
                        {provider.rating || 4.5} ({provider.reviews || 'New'} {provider.type === 'ai' ? 'consultations' : 'reviews'})
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      {provider.experience && `${provider.experience}`}
                      {provider.nextAvailable && ` • ${provider.nextAvailable}`}
                    </p>
                    {provider.price && (
                      <p className="text-xs font-medium text-blue-600 mt-1">
                        ${provider.price}/session
                      </p>
                    )}
                    {provider.type === 'ai' && (
                      <p className="text-xs font-medium text-purple-600 mt-1">
                        Select to start consultation
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Step 2: Reason for Visit (Required for AI providers) */}
      {selectedProvider && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Reason for Visit
            {selectedProvider.type === 'ai' && (
              <span className="text-purple-600 text-sm font-normal ml-2">
                (Required to start AI consultation)
              </span>
            )}
          </h2>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please describe your symptoms or reason for the consultation..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          {selectedProvider.type === 'ai' && reason.trim() && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-purple-700 text-sm mb-3">
                ✓ Ready to start consultation with {selectedProvider.name}
              </p>
              <Button 
                onClick={() => handleStartAIConsultation(selectedProvider)}
                disabled={isBooking}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isBooking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting Consultation...
                  </>
                ) : (
                  'Start AI Consultation'
                )}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Step 3: Select Appointment Type */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Consultation Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {appointmentTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <Card
                key={type.id}
                className={`p-4 cursor-pointer transition-all ${
                  appointmentType === type.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setAppointmentType(type.id as any)}
              >
                <div className="text-center">
                  <IconComponent className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-medium text-gray-900">{type.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Step 4: Select Date & Time (Only for Human Providers) */}
      {selectedProvider?.type !== 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Date</h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Time</h2>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTime(time)}
                  className="text-sm"
                >
                  {time}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      )}
      
      {/* AI Provider Notice */}
      {selectedProvider?.type === 'ai' && (
        <Card className="p-6 bg-purple-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-semibold">AI</span>
            </div>
            <div>
              <h3 className="font-semibold text-purple-900">Instant AI Consultation</h3>
              <p className="text-purple-700 text-sm">Your chat with {selectedProvider.name} will start immediately after booking. No scheduling required!</p>
            </div>
          </div>
        </Card>
      )}



      {/* Booking Summary & Confirmation */}
      {selectedProvider && (selectedProvider.type === 'ai' || (selectedDate && selectedTime)) && (
        <Card className="p-6 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {selectedProvider.type === 'ai' ? 'Consultation Summary' : 'Appointment Summary'}
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Provider:</span>
              <span className="font-medium">{selectedProvider.name}</span>
            </div>
            {selectedProvider.type === 'ai' ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-purple-600">Instant AI Chat</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Availability:</span>
                  <span className="font-medium text-green-600">Available Now</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{new Date(selectedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">
                    {appointmentTypes.find(t => t.id === appointmentType)?.label}
                  </span>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          onClick={onCancel || (() => window.history.back())}
          disabled={isBooking}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleBookAppointment}
          disabled={!isFormValid || isBooking}
          className="bg-blue-600 hover:bg-blue-700 text-white border-0"
        >
          {isBooking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {selectedProvider?.type === 'ai' ? 'Starting Chat...' : 'Booking...'}
            </>
          ) : (
            selectedProvider?.type === 'ai' ? 'Start AI Chat' : 'Book Appointment'
          )}
        </Button>
      </div>
    </div>
  );
};

export default AppointmentBooking;