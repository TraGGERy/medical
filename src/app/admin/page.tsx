'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import UserAnalytics from '@/components/admin/UserAnalytics';
import AIPerformance from '@/components/admin/AIPerformance';
import ReportManagement from '@/components/admin/ReportManagement';
import ContentManagement from '@/components/admin/ContentManagement';
import BillingManagement from '@/components/admin/BillingManagement';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview onNavigate={setActiveTab} />;
      case 'analytics':
        return <UserAnalytics />;
      case 'ai-performance':
        return <AIPerformance />;
      case 'reports':
        return <ReportManagement />;
      case 'content':
        return <ContentManagement />;
      case 'billing':
        return <BillingManagement />;
      default:
        return <AdminOverview onNavigate={setActiveTab} />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
}

function AdminOverview({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="opacity-90 mb-4 text-sm sm:text-base">Monitor system performance, manage users, and oversee AI diagnostics.</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button 
            onClick={() => onNavigate('reports')}
            className="bg-white text-purple-700 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:bg-gray-50 transition text-sm sm:text-base"
          >
            📋 Review Reports
          </button>
          <button 
            onClick={() => onNavigate('ai-performance')}
            className="bg-white/20 backdrop-blur-sm text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:bg-white/30 transition text-sm sm:text-base"
          >
            🤖 AI Performance
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-2 sm:mr-4">
              <span className="text-blue-600 text-sm sm:text-xl">👥</span>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">2,847</p>
              <p className="text-xs sm:text-sm text-gray-600">Active Users</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mr-2 sm:mr-4">
              <span className="text-green-600 text-sm sm:text-xl">📊</span>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">15,234</p>
              <p className="text-xs sm:text-sm text-gray-600">Reports Generated</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-2 sm:mr-4">
              <span className="text-purple-600 text-sm sm:text-xl">🎯</span>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">94.2%</p>
              <p className="text-xs sm:text-sm text-gray-600">AI Accuracy</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-100 rounded-xl flex items-center justify-center mr-2 sm:mr-4">
              <span className="text-yellow-600 text-sm sm:text-xl">💰</span>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">$24.5K</p>
              <p className="text-xs sm:text-sm text-gray-600">Monthly Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Recent Activity</h2>
            <button 
              onClick={() => onNavigate('analytics')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {[
              { time: '2 min ago', action: 'New user registration', user: 'john.doe@email.com', type: 'user' },
              { time: '5 min ago', action: 'Report flagged for review', user: 'Report #15234', type: 'warning' },
              { time: '12 min ago', action: 'Premium subscription activated', user: 'sarah.wilson@email.com', type: 'success' },
              { time: '18 min ago', action: 'AI accuracy below threshold', user: 'System Alert', type: 'error' }
            ].map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' :
                  activity.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-medium text-gray-800">{activity.action}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{activity.user}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">System Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800 text-sm sm:text-base">AI Processing</p>
                <p className="text-xs sm:text-sm text-gray-600">Response time: 1.2s avg</p>
              </div>
              <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Operational
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800 text-sm sm:text-base">Database</p>
                <p className="text-xs sm:text-sm text-gray-600">Query time: 45ms avg</p>
              </div>
              <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Operational
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800 text-sm sm:text-base">Payment System</p>
                <p className="text-xs sm:text-sm text-gray-600">Stripe integration</p>
              </div>
              <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}