'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { 
  Video,
  Phone,
  MessageSquare,
  Star,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import Image from 'next/image';

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

interface HumanProviderData {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  rating: string;
  totalReviews: number;
  languages: string[];
  consultationFee: string;
  yearsOfExperience: number;
}

interface AIProviderData {
    id: string;
    name: string;
    specialty: string;
    rating: string;
    totalConsultations: number;
    avatar: string;
    profileImage: string;
    languages: string[];
    consultationFee: string;
    experience: string;
    description: string;
}

interface AppointmentBookingProps {
  onComplete: (consultationId?: string) => void;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ onComplete }) => {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<'video' | 'phone' | 'chat'>('video');
  const [reason, setReason] = useState<string>('');
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

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
        const humanProviders = (humanData.data || []).map((provider: HumanProviderData) => ({
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
        const aiProviders = (aiData.providers || []).map((provider: AIProviderData) => ({
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

  const handleStartAIConsultation = async (provider: Provider) => {
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

      const result = await response.json();
      toast.success('AI consultation started successfully!');
      onComplete(result.consultationId);
    } catch (error) {
      console.error('Error starting AI consultation:', error);
      toast.error('Failed to start AI consultation', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.'
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedProvider || !selectedDate || !selectedTime) {
      toast.error('Please select a provider, date, and time');
      return;
    }

    if (!isSignedIn || !user) {
      toast.error('Please log in to book an appointment');
      return;
    }

    setIsBooking(true);

    try {
      const token = await getToken();
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          providerId: selectedProvider.id,
          patientId: user.id,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          appointmentType: appointmentType,
          reasonForVisit: reason,
          duration: 30, // Example duration
          totalCost: parseFloat(selectedProvider.price)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book appointment');
      }

      await response.json();
      toast.success('Appointment booked successfully!');
      onComplete();
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.'
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!selectedProvider) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Book an Appointment</h1>
        {/* Search and filter UI can be added here */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden transition-shadow duration-300 hover:shadow-lg flex flex-col">
              <div className="relative h-48 w-full">
                <Image 
                  src={provider.avatar} 
                  alt={provider.name} 
                  layout="fill"
                  objectFit="cover"
                  width={300}
                  height={300}
                />
                {provider.type === 'ai' && (
                  <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full">AI</span>
                )}
              </div>
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                <p className="text-sm text-blue-600 font-medium">{provider.specialty}</p>
                <div className="flex items-center my-2 text-sm">
                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                  <span>{provider.rating} ({provider.reviews} reviews)</span>
                </div>
                <p className="text-sm text-gray-600 flex-grow">{provider.description}</p>
                <div className="mt-4">
                  <p className="text-sm text-gray-800 font-semibold">Next available: {provider.nextAvailable}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">${provider.price}</p>
                </div>
              </div>
              <div className="p-4 border-t">
                <Button onClick={() => setSelectedProvider(provider)} className="w-full">
                  {provider.type === 'ai' ? 'Start AI Consultation' : 'Book Appointment'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto p-4 md:p-8 bg-white rounded-2xl shadow-xl border border-gray-100"
    >
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => setSelectedProvider(null)} 
        className="mb-6 text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-md flex items-center space-x-2"
      >
        <ChevronLeft className="w-5 h-5" />
        <span>Back to all providers</span>
      </Button>

      {/* Provider Details */}
      <div className="flex flex-col md:flex-row items-start gap-8 mb-8">
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-lg border-4 border-blue-100 flex-shrink-0">
          <Image 
            src={selectedProvider.avatar} 
            alt={selectedProvider.name} 
            layout="fill"
            objectFit="cover"
            width={300}
            height={300}
          />
        </div>
        <div className="flex-grow">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{selectedProvider.name}</h1>
          <p className="text-lg text-blue-600 font-semibold mt-1">{selectedProvider.specialty}</p>
          <div className="flex items-center my-3 text-md">
            <Star className="w-5 h-5 text-yellow-400 mr-1.5" />
            <span>{selectedProvider.rating} ({selectedProvider.reviews} reviews)</span>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">{selectedProvider.experience}</span>
            {selectedProvider.languages.map(lang => (
              <span key={lang} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">{lang}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Reason for Visit */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Reason for Visit</h2>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Briefly describe your symptoms or reason for this consultation..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          rows={4}
        />
      </Card>

      {/* AI Consultation Immediate Start */}
      {selectedProvider.type === 'ai' && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Start Your AI Consultation</h2>
          <p className="text-blue-800 mb-6">Your AI-powered consultation with {selectedProvider.name} can begin immediately. Please ensure you&apos;ve provided a reason for your visit above.</p>
          <Button 
            onClick={() => handleStartAIConsultation(selectedProvider)} 
            disabled={isBooking || !reason.trim()}
            className="w-full text-lg py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-transform transform hover:scale-105"
          >
            {isBooking ? (
              <><Loader2 className="w-6 h-6 animate-spin mr-3" /> Starting...</>
            ) : (
              'Start Instant Consultation'
            )}
          </Button>
        </Card>
      )}

      {/* Human Provider Booking Flow */}
      {selectedProvider.type === 'human' && (
        <div className="space-y-6">
          {/* Step 3: Choose Appointment Type */}
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
                    onClick={() => setAppointmentType(type.id as 'video' | 'phone' | 'chat')}
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
                {/* Basic date picker for now, can be replaced with a proper calendar component */}
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]} // Disable past dates
                />
              </Card>
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Time</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map(slot => (
                    <Button 
                      key={slot}
                      variant={selectedTime === slot ? 'default' : 'outline'}
                      onClick={() => setSelectedTime(slot)}
                      className="w-full"
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Step 5: Confirmation */}
          <Card className="p-6 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Booking</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>Provider:</strong> {selectedProvider.name}</p>
              <p><strong>Date:</strong> {selectedDate || 'Not selected'}</p>
              <p><strong>Time:</strong> {selectedTime || 'Not selected'}</p>
              <p><strong>Type:</strong> {appointmentType}</p>
              <p><strong>Price:</strong> ${selectedProvider.price}</p>
            </div>
            <Button 
              onClick={handleBookAppointment} 
              disabled={isBooking || !selectedDate || !selectedTime}
              className="w-full mt-6 text-lg py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-transform transform hover:scale-105"
            >
              {isBooking ? (
                <><Loader2 className="w-6 h-6 animate-spin mr-3" /> Booking...</>
              ) : (
                'Confirm & Book Appointment'
              )}
            </Button>
          </Card>
        </div>
      )}
    </motion.div>
  );
};

export default AppointmentBooking;