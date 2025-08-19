'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  MessageSquare, 
  User, 
  Star,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Download,
  Filter,
  Search,
  Loader2,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import AppointmentBooking from './AppointmentBooking';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  image?: string;
  rating?: number;
}

interface Appointment {
  id: string;
  providerId: string;
  provider?: Provider;
  patientId: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  appointmentType: 'video' | 'phone' | 'in-person';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  symptoms?: string;
  notes?: string;
  meetingUrl?: string;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
}

interface MyAppointmentsProps {
  onResumeChat?: (consultationId: string) => void;
}

const MyAppointments: React.FC<MyAppointmentsProps> = ({ onResumeChat }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Fetch appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!isLoaded || !isSignedIn || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/appointments?patientId=${user.id}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }

        const data = await response.json();
        if (data.success) {
          setAppointments(data.data || []);
        } else {
          throw new Error(data.error || 'Failed to load appointments');
        }
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load appointments');
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [isLoaded, isSignedIn, user]);

  // Mock data for fallback (remove this when API is ready)
  const mockAppointments = [
    {
      id: 1,
      provider: {
        name: 'Dr. Sarah Johnson',
        specialty: 'General Medicine',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20doctor%20headshot%20medical%20uniform&image_size=square',
        rating: 4.9
      },
      date: '2024-01-15',
      time: '2:00 PM',
      type: 'video',
      status: 'upcoming',
      reason: 'Annual checkup and blood pressure monitoring',
      duration: 30,
      notes: 'Please bring your current medications list'
    },
    {
      id: 2,
      provider: {
        name: 'Dr. Michael Chen',
        specialty: 'Cardiology',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20male%20doctor%20headshot%20medical%20uniform&image_size=square',
        rating: 4.8
      },
      date: '2024-01-12',
      time: '10:00 AM',
      type: 'video',
      status: 'completed',
      reason: 'Follow-up for heart palpitations',
      duration: 45,
      prescription: 'Beta-blocker medication prescribed',
      report: 'Consultation_Report_Jan12.pdf'
    },
    {
      id: 3,
      provider: {
        name: 'Dr. Emily Rodriguez',
        specialty: 'Dermatology',
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20doctor%20headshot%20medical%20uniform&image_size=square',
        rating: 4.9
      },
      date: '2024-01-18',
      time: '4:30 PM',
      type: 'phone',
      status: 'upcoming',
      reason: 'Skin rash consultation',
      duration: 20,
      notes: 'Please have photos of affected area ready'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'phone': return Phone;
      case 'in-person': return MapPin;
      case 'chat': return MessageSquare;
      default: return Video;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const statusMap = {
      'upcoming': ['scheduled', 'confirmed'],
      'completed': ['completed'],
      'cancelled': ['cancelled', 'no-show']
    };
    
    const matchesFilter = filter === 'all' || 
      (statusMap[filter as keyof typeof statusMap]?.includes(appointment.status) ?? false);
    
    const matchesSearch = appointment.provider?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.symptoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const upcomingCount = appointments.filter(a => ['scheduled', 'confirmed'].includes(a.status)).length;
   const completedCount = appointments.filter(a => a.status === 'completed').length;

   // Handler functions for appointment actions
   const handleReschedule = async (appointmentId: string) => {
     // TODO: Implement reschedule functionality
     toast.info('Reschedule functionality coming soon');
   };

   const handleCancel = async (appointmentId: string) => {
     if (!isSignedIn || !user) {
       toast.error('Authentication required');
       return;
     }

     try {
       const response = await fetch(`/api/appointments/${appointmentId}`, {
         method: 'DELETE',
         headers: {
           'Content-Type': 'application/json'
         }
       });

       if (!response.ok) {
         throw new Error('Failed to cancel appointment');
       }

       // Refresh appointments list
       setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
       toast.success('Appointment cancelled successfully');
     } catch (error) {
       console.error('Error cancelling appointment:', error);
       toast.error('Failed to cancel appointment');
     }
   };

   const handleDownloadReport = (appointmentId: string) => {
     // TODO: Implement report download
     toast.info('Report download functionality coming soon');
   };

   const handleRateProvider = (providerId: string) => {
     // TODO: Implement provider rating
     toast.info('Provider rating functionality coming soon');
   };

   const handleMessageProvider = (providerId: string) => {
     // TODO: Implement provider messaging
     toast.info('Provider messaging functionality coming soon');
   };

   // Booking form handlers
   const handleBookAppointment = () => {
     setBookingLoading(true);
     // Simulate loading for better UX
     setTimeout(() => {
       setShowBookingForm(true);
       setBookingLoading(false);
     }, 300);
   };

   const handleBookingComplete = (consultationId?: string) => {
     console.log('🎯 MyAppointments - handleBookingComplete called:', {
       consultationId,
       timestamp: new Date().toISOString()
     });
     
     setShowBookingForm(false);
     if (consultationId && onResumeChat) {
       // AI consultation started, call onResumeChat to switch to active chat
       console.log('✅ MyAppointments - Starting AI consultation with ID:', consultationId);
       onResumeChat(consultationId);
       toast.success('AI consultation started!');
       console.log('📱 MyAppointments - onResumeChat called successfully');
     } else {
       // Regular appointment booked or no onResumeChat callback
       console.log('📅 MyAppointments - Regular appointment booked or no callback');
       toast.success('Appointment booked successfully!');
       // Refresh appointments list
       window.location.reload();
     }
   };

   const handleCancelBooking = () => {
     setShowBookingForm(false);
     setBookingLoading(false);
   };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your appointments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Appointments</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // If booking form is shown, render it instead of the main content
  if (showBookingForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleCancelBooking}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Appointments
          </button>
        </div>
        <AppointmentBooking 
          onComplete={handleBookingComplete} 
          onCancel={handleCancelBooking}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600 mt-2">Manage your healthcare consultations</p>
        </div>
        <Button 
          onClick={handleBookAppointment}
          disabled={bookingLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {bookingLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Calendar className="w-5 h-5 mr-2" />
              Book Appointment
            </>
          )}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{upcomingCount}</div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{completedCount}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="bg-purple-500 p-3 rounded-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">5</div>
              <div className="text-sm text-gray-600">Providers</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex space-x-2">
            {['all', 'upcoming', 'completed', 'cancelled'].map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterOption as any)}
                className="capitalize"
              >
                {filterOption}
              </Button>
            ))}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.map((appointment, index) => {
          const TypeIcon = getTypeIcon(appointment.appointmentType);
          return (
            <motion.div
              key={appointment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <img 
                      src={appointment.provider?.image || '/default-doctor.png'} 
                      alt={appointment.provider?.name || 'Doctor'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {appointment.provider?.name || 'Unknown Provider'}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">{appointment.provider?.specialty || 'General Practice'}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(appointment.appointmentDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {appointment.appointmentTime}
                        </div>
                        <div className="flex items-center">
                          <TypeIcon className="w-4 h-4 mr-1" />
                          {appointment.appointmentType === 'video' ? 'Video Call' : 
                           appointment.appointmentType === 'phone' ? 'Phone Call' : 'In-Person'}
                        </div>
                      </div>
                      
                      {appointment.symptoms && (
                        <p className="text-gray-700 mb-2">
                          <strong>Symptoms:</strong> {appointment.symptoms}
                        </p>
                      )}
                      
                      {appointment.notes && (
                        <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                          Note: {appointment.notes}
                        </p>
                      )}
                      
                      <div className="text-sm text-gray-500 mb-2">
                        <strong>Cost:</strong> ${appointment.totalCost}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {['scheduled', 'confirmed'].includes(appointment.status) && (
                      <>
                        {appointment.meetingUrl && appointment.appointmentType === 'video' && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => window.open(appointment.meetingUrl, '_blank')}
                          >
                            <Video className="w-4 h-4 mr-1" />
                            Join Call
                          </Button>
                        )}
                        <Button 
                           size="sm" 
                           variant="outline"
                           onClick={() => handleReschedule(appointment.id)}
                         >
                           <Calendar className="w-4 h-4 mr-1" />
                           Reschedule
                         </Button>
                         <Button 
                           size="sm" 
                           variant="outline"
                           className="text-red-600 border-red-300 hover:bg-red-50"
                           onClick={() => handleCancel(appointment.id)}
                         >
                           Cancel
                         </Button>
                      </>
                    )}
                    
                    {appointment.status === 'completed' && (
                      <>
                        <Button 
                           size="sm" 
                           variant="outline"
                           onClick={() => handleDownloadReport(appointment.id)}
                         >
                           <Download className="w-4 h-4 mr-1" />
                           Report
                         </Button>
                         <Button 
                           size="sm" 
                           variant="outline"
                           onClick={() => handleRateProvider(appointment.providerId)}
                         >
                           <Star className="w-4 h-4 mr-1" />
                           Rate
                         </Button>
                         <Button 
                           size="sm" 
                           variant="outline"
                           onClick={() => handleMessageProvider(appointment.providerId)}
                         >
                           <MessageSquare className="w-4 h-4 mr-1" />
                           Message
                         </Button>
                      </>
                    )}
                    
                    <Button size="sm" variant="outline">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredAppointments.length === 0 && (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' 
              ? 'You haven\'t scheduled any appointments yet.' 
              : `No ${filter} appointments found.`
            }
          </p>
          <Button 
            onClick={handleBookAppointment}
            disabled={bookingLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {bookingLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Book Appointment'
            )}
          </Button>
        </Card>
      )}
    </div>
  );
};

export default MyAppointments;