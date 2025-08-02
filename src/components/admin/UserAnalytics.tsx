'use client';

import { useState } from 'react';

export default function UserAnalytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [activeChart, setActiveChart] = useState('diagnostics');

  const analyticsData = {
    diagnostics: {
      daily: [45, 52, 38, 67, 73, 58, 82],
      weekly: [324, 387, 298, 445, 512, 389, 623],
      monthly: [1245, 1567, 1389, 1823, 2045, 1756, 2234]
    },
    users: {
      active: 2847,
      new: 234,
      retention: 78.5,
      churn: 3.2
    },
    reports: {
      total: 15234,
      thisMonth: 2847,
      avgPerUser: 5.3
    }
  };

  const timeRanges = [
    { id: '24h', label: '24 Hours' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">User Analytics</h1>
          <p className="text-gray-600">Monitor user engagement and system usage</p>
        </div>
        
        <div className="flex gap-2">
          {timeRanges.map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                timeRange === range.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Active Users</h3>
            <span className="text-green-600 text-xs font-medium">+12.5%</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{analyticsData.users.active.toLocaleString()}</p>
          <p className="text-xs sm:text-sm text-gray-500">vs last period</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">New Users</h3>
            <span className="text-green-600 text-xs font-medium">+8.3%</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{analyticsData.users.new}</p>
          <p className="text-xs sm:text-sm text-gray-500">this period</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Retention Rate</h3>
            <span className="text-green-600 text-xs font-medium">+2.1%</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{analyticsData.users.retention}%</p>
          <p className="text-xs sm:text-sm text-gray-500">30-day retention</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Churn Rate</h3>
            <span className="text-red-600 text-xs font-medium">-0.8%</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{analyticsData.users.churn}%</p>
          <p className="text-xs sm:text-sm text-gray-500">monthly churn</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Diagnostics Chart */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Diagnostics Over Time</h2>
            <select 
              value={activeChart}
              onChange={(e) => setActiveChart(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1"
            >
              <option value="diagnostics">Diagnostics</option>
              <option value="users">Users</option>
              <option value="reports">Reports</option>
            </select>
          </div>
          
          {/* Simple Bar Chart Visualization */}
          <div className="space-y-3">
            {analyticsData.diagnostics.daily.map((value, index) => (
              <div key={index} className="flex items-center">
                <div className="w-12 text-xs text-gray-600">
                  Day {index + 1}
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(value / Math.max(...analyticsData.diagnostics.daily)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-8 text-xs text-gray-600 text-right">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Engagement */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-6">User Engagement</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Daily Active Users</p>
                <p className="text-sm text-gray-600">Users who logged in today</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-800">1,247</p>
                <p className="text-xs text-green-600">+5.2%</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Avg. Session Duration</p>
                <p className="text-sm text-gray-600">Time spent per session</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-800">8m 34s</p>
                <p className="text-xs text-green-600">+12.1%</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Reports per User</p>
                <p className="text-sm text-gray-600">Average reports generated</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-800">{analyticsData.reports.avgPerUser}</p>
                <p className="text-xs text-green-600">+3.7%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics Table */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">User Activity Breakdown</h2>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
            Export Data
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Date</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">New Users</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Active Users</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Diagnostics</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: '2025-01-29', newUsers: 45, activeUsers: 1247, diagnostics: 82, conversion: '6.8%' },
                { date: '2025-01-28', newUsers: 38, activeUsers: 1189, diagnostics: 73, conversion: '6.1%' },
                { date: '2025-01-27', newUsers: 52, activeUsers: 1298, diagnostics: 67, conversion: '5.2%' },
                { date: '2025-01-26', newUsers: 41, activeUsers: 1156, diagnostics: 58, conversion: '5.0%' },
                { date: '2025-01-25', newUsers: 36, activeUsers: 1087, diagnostics: 52, conversion: '4.8%' }
              ].map((row, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 text-sm text-gray-800">{row.date}</td>
                  <td className="py-3 px-2 text-sm text-gray-800">{row.newUsers}</td>
                  <td className="py-3 px-2 text-sm text-gray-800">{row.activeUsers}</td>
                  <td className="py-3 px-2 text-sm text-gray-800">{row.diagnostics}</td>
                  <td className="py-3 px-2 text-sm text-green-600 font-medium">{row.conversion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-6">Geographic Distribution</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Top Countries</h3>
            <div className="space-y-3">
              {[
                { country: 'United States', users: 1247, percentage: 43.8 },
                { country: 'Canada', users: 456, percentage: 16.0 },
                { country: 'United Kingdom', users: 234, percentage: 8.2 },
                { country: 'Australia', users: 189, percentage: 6.6 },
                { country: 'Germany', users: 156, percentage: 5.5 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded mr-3"></div>
                    <span className="text-sm text-gray-800">{item.country}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-800">{item.users}</span>
                    <span className="text-xs text-gray-500 ml-2">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Usage by Time Zone</h3>
            <div className="space-y-3">
              {[
                { timezone: 'EST (UTC-5)', peak: '2:00 PM', users: 892 },
                { timezone: 'PST (UTC-8)', peak: '11:00 AM', users: 634 },
                { timezone: 'GMT (UTC+0)', peak: '7:00 PM', users: 445 },
                { timezone: 'AEST (UTC+10)', peak: '9:00 AM', users: 287 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.timezone}</p>
                    <p className="text-xs text-gray-600">Peak: {item.peak}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{item.users}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}