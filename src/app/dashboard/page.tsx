'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Activity, 
  FileText, 
  CheckCircle, 
  Calendar,
  TrendingUp,
  Heart,
  Shield
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import HealthCheckHistory from '@/components/dashboard/HealthCheckHistory';
import NewDiagnostic from '@/components/dashboard/NewDiagnostic';
import ReportViewer from '@/components/dashboard/ReportViewer';
import ProfileSettings from '@/components/dashboard/ProfileSettings';
import PrivacySettings from '@/components/dashboard/PrivacySettings';
import SubscriptionStatus from '@/components/dashboard/SubscriptionStatus';
import RealtimeDashboard from '@/components/RealtimeDashboard';
import DeviceManagement from '@/components/devices/DeviceManagement';
import TelemedicineOverview from '@/components/telemedicine/TelemedicineOverview';
import AppointmentBooking from '@/components/telemedicine/AppointmentBooking';
import MyAppointments from '@/components/telemedicine/MyAppointments';
import ConsultationHistory from '@/components/dashboard/ConsultationHistory';
import ActiveConsultationChat from '@/components/dashboard/ActiveConsultationChat';
import HealthCalendarDashboard from '@/components/health-calendar/HealthCalendarDashboard';
import StatCard from '@/components/ui/statcard';
import { Button } from '@/components/ui/button';

// Inline Card component to resolve module import issues
const Card = ({ className = '', children, ...props }: { className?: string; children: React.ReactNode; [key: string]: any }) => {
  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
};
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Type definition for health report from API
interface HealthReport {
  id: string;
  date: string;
  time: string;
  condition: string;
  status: 'Normal' | 'Attention' | 'Urgent';
  riskLevel: string;
  summary: string;
  confidence: number;
  symptoms: string[];
  aiAnalysis: {
    analysis?: string;
    possibleConditions?: string[];
    recommendations?: string[];
    urgencyLevel?: string;
    [key: string]: unknown;
  };
  recommendations: string[];
  urgencyLevel: number;
  followUpRequired: boolean;
  doctorRecommended: boolean;
  createdAt?: string;
  fullReport: {
    analysis?: string;
    possibleConditions?: string[];
    recommendations?: string[];
    lifestyleRecommendations?: string[];
    followUpPlan?: string[];
    redFlags?: string;
    documentAnalysis?: string;
    negligenceAssessment?: string;
    disclaimer?: string;
    [key: string]: unknown;
  };
}

interface DashboardStats {
  totalReports: number;
  normalResults: number;
  attentionResults: number;
  urgentResults: number;
  reportsThisMonth: number;
}

export default function Dashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReport] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeConsultationId, setActiveConsultationId] = useState<string | null>(null);
  const [isLoadingLastConsultation, setIsLoadingLastConsultation] = useState(false);

  // Auto-load last active consultation when switching to active-chat tab
  useEffect(() => {
    const loadLastActiveConsultation = async () => {
      if (activeTab === 'active-chat' && !activeConsultationId && !isLoadingLastConsultation) {
        console.log('🔄 Dashboard - Auto-loading last active consultation');
        setIsLoadingLastConsultation(true);
        
        try {
          const response = await fetch('/api/ai-consultations/last-active');
          if (response.ok) {
            const data = await response.json();
            if (data.consultation) {
              console.log('✅ Dashboard - Found last active consultation:', data.consultation.id);
              setActiveConsultationId(data.consultation.id);
              toast.success('Resumed your last consultation');
            } else {
              console.log('ℹ️ Dashboard - No active consultation found');
            }
          } else {
            console.error('❌ Dashboard - Failed to fetch last consultation:', response.status);
          }
        } catch (error) {
          console.error('❌ Dashboard - Error loading last consultation:', error);
        } finally {
          setIsLoadingLastConsultation(false);
        }
      }
    };

    loadLastActiveConsultation();
  }, [activeTab, activeConsultationId, isLoadingLastConsultation]);

  const handleBookAppointment = () => {
    setBookingLoading(true);
    // Simulate loading for better UX
    setTimeout(() => {
      setShowBookingForm(true);
      setBookingLoading(false);
    }, 300);
  };

  const handleBookingComplete = (consultationId?: string) => {
    console.log('🎯 Dashboard - handleBookingComplete called:', {
      consultationId,
      timestamp: new Date().toISOString()
    });
    
    setShowBookingForm(false);
    if (consultationId) {
      // AI consultation started, clear any previous consultation and switch to new one
      console.log('✅ Dashboard - Setting new consultation ID:', consultationId);
      setActiveConsultationId(consultationId);
      console.log('🔄 Dashboard - Switching to active-chat tab');
      setActiveTab('active-chat');
      toast.success('New AI consultation started!');
      console.log('📱 Dashboard - State updated successfully');
    } else {
      // Regular appointment booked
      console.log('📅 Dashboard - Regular appointment booked');
      toast.success('Appointment booked successfully!');
    }
  };

  const handleCancelBooking = () => {
    setShowBookingForm(false);
    setBookingLoading(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview onStartDiagnostic={() => setActiveTab('new-diagnostic')} />;
      case 'history':
        return <HealthCheckHistory />;
      case 'consultation-history':
        return (
          <ConsultationHistory 
            onResumeChat={(consultationId) => {
              setActiveConsultationId(consultationId);
              setActiveTab('active-chat');
            }}
          />
        );
      case 'new-diagnostic':
        return <NewDiagnostic onComplete={() => setActiveTab('history')} />;
      case 'health-calendar':
        return <HealthCalendarDashboard />;
      case 'telemedicine-overview':
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
                  Back to Overview
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
          <TelemedicineOverview 
            onBookAppointment={handleBookAppointment}
            bookingLoading={bookingLoading}
          />
        );
      case 'my-appointments':
        return (
          <MyAppointments 
            onResumeChat={(consultationId) => {
              console.log('🎯 Dashboard - MyAppointments onResumeChat called:', consultationId);
              setActiveConsultationId(consultationId);
              setActiveTab('active-chat');
            }}
          />
        );

      case 'realtime-monitoring':
        return <RealtimeDashboard userId={user?.id || ''} className="p-6" />;
      case 'device-management':
        return <DeviceManagement />;
      case 'report-viewer':
        return <ReportViewer report={selectedReport} onBack={() => setActiveTab('history')} />;
      case 'profile':
        return <ProfileSettings />;

      case 'privacy':
        return <PrivacySettings />;
      case 'active-chat':
        console.log('🎬 Dashboard - Rendering active-chat tab:', {
          activeConsultationId,
          hasConsultationId: !!activeConsultationId,
          timestamp: new Date().toISOString()
        });
        
        if (activeConsultationId) {
          console.log('✅ Dashboard - Rendering ActiveConsultationChat with ID:', activeConsultationId);
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Active Consultation</h1>
                <Button 
                  onClick={() => {
                    console.log('🔚 Dashboard - Ending chat manually');
                    setActiveConsultationId(null);
                  }}
                  variant="outline"
                >
                  Back to Chat List
                </Button>
              </div>
              <ActiveConsultationChat 
                consultationId={activeConsultationId}
                onConsultationEnd={() => {
                  console.log('🏁 Dashboard - Consultation ended via callback');
                  setActiveConsultationId(null);
                }}
              />
            </div>
          );
        }
        console.log('⚠️ Dashboard - No active consultation ID, showing consultation list');
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Active Chats</h1>
            </div>
            <ConsultationHistory 
              onResumeChat={(consultationId) => {
                setActiveConsultationId(consultationId);
              }}
            />
          </div>
        );
      default:
        return <DashboardOverview onStartDiagnostic={() => setActiveTab('new-diagnostic')} />;
    }
  };

  return (
    <DashboardLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      activeConsultationId={activeConsultationId || undefined}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

function DashboardOverview({ onStartDiagnostic }: { onStartDiagnostic: () => void }) {
  const { user } = useUser();
  const userName = user?.firstName || user?.fullName || 'User';
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    normalResults: 0,
    attentionResults: 0,
    urgentResults: 0,
    reportsThisMonth: 0
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const healthScore = stats.totalReports > 0 
    ? Math.round((stats.normalResults / stats.totalReports) * 100)
    : 0;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/health-reports');
        if (response.ok) {
          const data = await response.json();
          setReports(data.reports || []);
          
          // Calculate stats from real data
          const allReports: HealthReport[] = data.reports || [];
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          const thisMonthReports = allReports.filter((report: HealthReport) => {
            const reportDate = new Date(report.createdAt || report.date);
            return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
          });

          setStats({
            totalReports: allReports.length,
            normalResults: allReports.filter((r: HealthReport) => r.status?.toLowerCase() === 'normal').length,
            attentionResults: allReports.filter((r: HealthReport) => r.status?.toLowerCase() === 'attention').length,
            urgentResults: allReports.filter((r: HealthReport) => r.status?.toLowerCase() === 'urgent').length,
            reportsThisMonth: thisMonthReports.length
          });
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const getRecentReports = (): HealthReport[] => {
    return reports
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
      .slice(0, 3);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        <Card className="border-0 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <div className="relative z-10 p-8">
            <div className="flex items-center justify-between">
              <div>
                <motion.h1 
                  className="text-3xl font-bold text-black mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {getGreeting()}, {userName}!
                </motion.h1>
                <motion.p 
                  className="text-gray-800 text-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Ready to take charge of your health today?
                </motion.p>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="hidden md:block"
              >
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Heart className="w-12 h-12 text-white" />
                </div>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6"
            >
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                onClick={onStartDiagnostic}
              >
                <Activity className="w-5 h-5 mr-2" />
                Start New Health Check
              </Button>
            </motion.div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Reports"
            value={stats.totalReports}
            icon={<FileText className="h-4 w-4" />}
            trend={stats.totalReports > 0 ? { value: 12, isPositive: true } : { value: 0, isPositive: false }}
          />
          
          <StatCard
            title="Health Score"
            value={`${healthScore}%`}
            icon={<Shield className="h-4 w-4" />}
            trend={healthScore >= 70 ? { value: 5, isPositive: true } : { value: 5, isPositive: false }}
          />
          
          <StatCard
            title="Normal Results"
            value={stats.normalResults}
            icon={<CheckCircle className="h-4 w-4" />}
            trend={{ value: 8, isPositive: true }}
          />
          
          <StatCard
            title="This Month"
            value={stats.reportsThisMonth}
            icon={<Calendar className="h-4 w-4" />}
            trend={stats.reportsThisMonth > 0 ? { value: 15, isPositive: true } : { value: 0, isPositive: false }}
          />
        </div>
      </motion.div>

      {/* Subscription Status */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <SubscriptionStatus />
      </motion.div>

      {/* Recent Reports */}
      {getRecentReports().length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Health Reports
                </h2>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              
              <div className="space-y-4">
                {getRecentReports().map((report, index) => (
                  <motion.div
                    key={report.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        report.status?.toLowerCase() === 'normal' && 'bg-green-500',
                        report.status?.toLowerCase() === 'attention' && 'bg-yellow-500',
                        report.status?.toLowerCase() === 'urgent' && 'bg-red-500'
                      )}></div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {report.condition || 'Health Check'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(report.createdAt || report.date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        report.riskLevel?.toLowerCase() === 'low' && 'bg-green-100 text-green-800',
                        report.riskLevel?.toLowerCase() === 'medium' && 'bg-yellow-100 text-yellow-800',
                        report.riskLevel?.toLowerCase() === 'high' && 'bg-red-100 text-red-800'
                      )}>
                        {report.riskLevel || 'Unknown'} risk
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}