'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { 
  Video, 
  Calendar, 
  Clock, 
  MessageSquare, 
  FileText,
  Shield,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
import { Appointment } from './MyAppointments';

interface ApiAppointment {
  id: string;
  providerId: string;
  patientId: string;
  appointmentDate: string;
  duration: number;
  appointmentType: string;
  status: string;
  symptoms: string[];
  notes: string | null;
  meetingUrl: string | null;
  totalCost: number | null;
  createdAt: string;
  updatedAt: string;
  providerFirstName: string;
  providerLastName: string;
  providerSpecialization: string;
}

interface TelemedicineOverviewProps {
  onBookAppointment: () => void;
  bookingLoading?: boolean;
}

interface StatData {
  label: string;
  value: string;
  change: string;
}

const TelemedicineOverview: React.FC<TelemedicineOverviewProps> = ({ onBookAppointment, bookingLoading }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    providers: 0,
    avgRating: 4.8
  });

  // Fetch appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!isLoaded) return;
      
      try {
        setLoading(true);
        if (!isSignedIn || !user) {
          // User not logged in, show default stats
          setStats({ total: 0, upcoming: 0, providers: 5, avgRating: 4.8 });
          return;
        }

        const response = await fetch(`/api/appointments?patientId=${user.id}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }

        const data = await response.json();
        const transformedAppointments: Appointment[] = (data.data || []).map((apt: ApiAppointment) => {
          const scheduledAt = new Date(apt.appointmentDate);
          return {
            id: apt.id,
            providerId: apt.providerId,
            patientId: apt.patientId,
            appointmentDate: scheduledAt.toISOString().split('T')[0],
            appointmentTime: scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            duration: apt.duration,
            appointmentType: apt.appointmentType as 'video' | 'phone' | 'in-person',
            status: apt.status as 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show',
            symptoms: Array.isArray(apt.symptoms) ? apt.symptoms.join(', ') : apt.symptoms,
            notes: apt.notes,
            meetingUrl: apt.meetingUrl,
            totalCost: apt.totalCost || 0,
            createdAt: apt.createdAt,
            updatedAt: apt.updatedAt,
            provider: {
              id: apt.providerId,
              name: `${apt.providerFirstName || ''} ${apt.providerLastName || ''}`.trim(),
              specialty: apt.providerSpecialization || '',
            }
          };
        });
        setAppointments(transformedAppointments);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        // Set default stats on error
        setStats({ total: 0, upcoming: 0, providers: 5, avgRating: 4.8 });
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [isLoaded, isSignedIn, user]);

  const features = [
    {
      icon: Video,
      title: 'Virtual Consultations',
      description: 'Connect with healthcare providers through secure video calls',
      color: 'bg-blue-500'
    },
    {
      icon: Calendar,
      title: 'Easy Scheduling',
      description: 'Book appointments at your convenience with real-time availability',
      color: 'bg-green-500'
    },
    {
      icon: FileText,
      title: 'Digital Prescriptions',
      description: 'Receive and manage prescriptions digitally',
      color: 'bg-purple-500'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'HIPAA-compliant platform ensuring your privacy',
      color: 'bg-red-500'
    }
  ];

  // Get next upcoming appointment for display
  const nextAppointment: Appointment | undefined = appointments
    .filter(apt => ['scheduled', 'confirmed'].includes(apt.status))
    .sort((a, b) => new Date(a.appointmentDate + ' ' + a.appointmentTime).getTime() - 
                   new Date(b.appointmentDate + ' ' + b.appointmentTime).getTime())[0];

  const getNextAppointmentText = () => {
    if (!nextAppointment) return 'No upcoming appointments';
    const date = new Date(nextAppointment.appointmentDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today ${nextAppointment.appointmentTime}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow ${nextAppointment.appointmentTime}`;
    } else {
      return `${date.toLocaleDateString()} ${nextAppointment.appointmentTime}`;
    }
  };

  const statsData: StatData[] = [
    { 
      label: 'Total Appointments', 
      value: stats.total.toString(), 
      change: loading ? 'Loading...' : `${stats.total > 0 ? '+' + Math.min(stats.total, 2) : '0'} this month` 
    },
    { 
      label: 'Upcoming', 
      value: stats.upcoming.toString(), 
      change: loading ? 'Loading...' : (nextAppointment ? `Next: ${getNextAppointmentText()}` : 'No upcoming appointments')
    },
    { 
      label: 'Providers', 
      value: stats.providers.toString(), 
      change: 'Available now' 
    },
    { 
      label: 'Avg Rating', 
      value: stats.avgRating.toString(), 
      change: '★★★★★' 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Telemedicine</h1>
          <p className="text-gray-600 mt-2">Healthcare at your fingertips</p>
        </div>
        <Button 
          onClick={onBookAppointment}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-sm font-medium text-gray-600">{stat.label}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.change}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start space-x-4">
                  <div className={`${feature.color} p-3 rounded-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="flex items-center justify-center p-4 h-auto"
            onClick={onBookAppointment}
            disabled={bookingLoading}
          >
            {bookingLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <div className="text-left">
                  <div className="font-medium">Loading...</div>
                  <div className="text-sm text-gray-500">Preparing booking form</div>
                </div>
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Book Appointment</div>
                  <div className="text-sm text-gray-500">Schedule with a provider</div>
                </div>
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center justify-center p-4 h-auto"
          >
            <Clock className="w-5 h-5 mr-2" />
            <div className="text-left">
              <div className="font-medium">View Appointments</div>
              <div className="text-sm text-gray-500">Manage your schedule</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center justify-center p-4 h-auto"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            <div className="text-left">
              <div className="font-medium">Message Provider</div>
              <div className="text-sm text-gray-500">Secure messaging</div>
            </div>
          </Button>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading recent activity...</span>
            </div>
          ) : appointments.length > 0 ? (
            appointments
              .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
              .slice(0, 3)
              .map((appointment) => {
                const getActivityIcon = (): { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string } => {
                  if (appointment.status === 'completed') return { icon: Video, color: 'bg-green-500' };
                  if (appointment.status === 'cancelled') return { icon: Calendar, color: 'bg-red-500' };
                  return { icon: Calendar, color: 'bg-blue-500' };
                };
                
                const { icon: Icon, color } = getActivityIcon();
                const date = new Date(appointment.appointmentDate);
                const isToday = date.toDateString() === new Date().toDateString();
                const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString();
                
                let dateText = date.toLocaleDateString();
                if (isToday) dateText = 'Today';
                else if (isYesterday) dateText = 'Yesterday';
                
                return (
                  <div key={appointment.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className={`${color} p-2 rounded-full`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {appointment.status === 'completed' ? 'Consultation with' : 
                         appointment.status === 'cancelled' ? 'Cancelled appointment with' : 
                         'Appointment scheduled with'} {appointment.provider?.name || 'Provider'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {dateText}, {appointment.appointmentTime} - {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </div>
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
              <p className="text-sm">Book your first appointment to get started</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TelemedicineOverview;