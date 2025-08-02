'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import HealthCheckHistory from '@/components/dashboard/HealthCheckHistory';
import NewDiagnostic from '@/components/dashboard/NewDiagnostic';
import ReportViewer from '@/components/dashboard/ReportViewer';
import ProfileSettings from '@/components/dashboard/ProfileSettings';
import AIHealthAssistant from '@/components/dashboard/AIHealthAssistant';
import PrivacySettings from '@/components/dashboard/PrivacySettings';
import SubscriptionStatus from '@/components/dashboard/SubscriptionStatus';

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
  symptoms: any[];
  aiAnalysis: any;
  recommendations: any[];
  urgencyLevel: number;
  followUpRequired: boolean;
  doctorRecommended: boolean;
  createdAt?: string;
  fullReport: any;
}

interface DashboardStats {
  total: number;
  normal: number;
  attention: number;
  thisMonth: number;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReport, setSelectedReport] = useState(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview onStartDiagnostic={() => setActiveTab('new-diagnostic')} />;
      case 'history':
        return <HealthCheckHistory />;
      case 'new-diagnostic':
        return <NewDiagnostic onComplete={() => setActiveTab('history')} />;
      case 'report-viewer':
        return <ReportViewer report={selectedReport} onBack={() => setActiveTab('history')} />;
      case 'profile':
        return <ProfileSettings />;
      case 'ai-assistant':
        return <AIHealthAssistant />;
      case 'privacy':
        return <PrivacySettings />;
      default:
        return <DashboardOverview onStartDiagnostic={() => setActiveTab('new-diagnostic')} />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
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
    total: 0,
    normal: 0,
    attention: 0,
    thisMonth: 0
  });

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
            total: allReports.length,
            normal: allReports.filter((r: HealthReport) => r.status?.toLowerCase() === 'normal').length,
            attention: allReports.filter((r: HealthReport) => r.status?.toLowerCase() === 'attention' || r.status?.toLowerCase() === 'urgent').length,
            thisMonth: thisMonthReports.length
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
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-2xl p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
        <p className="opacity-90 mb-4 text-sm sm:text-base">Your health dashboard is ready. Start a new diagnostic or review your history.</p>
        <button 
          onClick={onStartDiagnostic}
          className="bg-white text-blue-700 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:bg-gray-50 transition text-sm sm:text-base w-full sm:w-auto"
        >
          🚀 Start New Health Check
        </button>
      </div>

      {/* Subscription Status */}
      <SubscriptionStatus />
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-2 sm:mr-4">
              <span className="text-blue-600 text-sm sm:text-xl">📊</span>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">
                {loading ? '...' : stats.total}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Total Reports</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mr-2 sm:mr-4">
              <span className="text-green-600 text-sm sm:text-xl">✅</span>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">
                {loading ? '...' : stats.normal}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Normal Results</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-100 rounded-xl flex items-center justify-center mr-2 sm:mr-4">
              <span className="text-yellow-600 text-sm sm:text-xl">⚠️</span>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">
                {loading ? '...' : stats.attention}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Need Attention</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-2 sm:mr-4">
              <span className="text-purple-600 text-sm sm:text-xl">📅</span>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">
                {loading ? '...' : stats.thisMonth}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">This Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Recent Reports</h2>
          <button className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base">View All</button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading recent reports...</p>
          </div>
        ) : getRecentReports().length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {getRecentReports().map((report, index) => (
              <div key={report.id || index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-xl space-y-2 sm:space-y-0">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${
                    report.status?.toLowerCase() === 'normal' ? 'bg-green-500' : 
                    report.status?.toLowerCase() === 'urgent' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm sm:text-base truncate">
                       {report.condition || 'Health Check'}
                     </p>
                     <p className="text-xs sm:text-sm text-gray-600">
                       {formatDate(report.createdAt || report.date)}
                     </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right ml-6 sm:ml-0">
                  <p className={`text-xs sm:text-sm font-medium ${
                    report.riskLevel?.toLowerCase() === 'low' ? 'text-green-600' : 
                    report.riskLevel?.toLowerCase() === 'high' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {report.riskLevel || 'Unknown'} Risk
                  </p>
                  <button className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm">Please View Report</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-gray-600 text-sm">No reports yet</p>
            <p className="text-gray-500 text-xs">Start your first health check to see reports here</p>
          </div>
        )}
      </div>
    </div>
  );
}