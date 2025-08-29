'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Brain, Calendar, Zap, Heart, Moon, Activity, RefreshCw, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useUser } from '@clerk/nextjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

type TimeRangeKey = 'week' | 'month' | '3months' | '6months' | 'year';
type TabKey = 'overview' | 'trends' | 'patterns' | 'correlations';

interface HealthPatternsAnalyticsProps {
  className?: string;
}

interface HealthPattern {
  id: string;
  type: 'correlation' | 'trend' | 'frequency' | 'severity';
  title: string;
  description: string;
  confidence: number;
  insights: string[];
  data: Record<string, unknown>;
  dateRange: {
    start: string;
    end: string;
  };
  createdAt: string;
}

interface AnalyticsData {
  moodTrends: Array<{ date: string; mood: number; energy: number; sleep: number }>;
  symptomFrequency: Array<{ name: string; count: number; severity: number }>;
  correlations: Array<{ factor1: string; factor2: string; correlation: number; significance: string }>;
  patterns: HealthPattern[];
  summary: {
    totalCheckins: number;
    avgMood: number;
    avgEnergy: number;
    avgSleep: number;
    mostCommonSymptom: string;
    streakDays: number;
  };
}

const HealthPatternsAnalytics: React.FC<HealthPatternsAnalyticsProps> = ({ className = '' }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | '3months'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'patterns' | 'correlations'>('overview');

  const timeRanges = useMemo(() => ({
    week: { label: 'This Week', days: 7 },
    month: { label: 'This Month', days: 30 },
    '3months': { label: 'Last 3 Months', days: 90 }
  }), []);

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, selectedTimeRange, loadAnalyticsData]);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = subDays(endDate, timeRanges[selectedTimeRange].days);
      
      const response = await fetch(
        `/api/health-calendar/patterns?start=${format(startDate, 'yyyy-MM-dd')}&end=${format(endDate, 'yyyy-MM-dd')}&analyze=true`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load analytics data');
      }
      
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load health analytics');
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange, timeRanges, setLoading, setData]);

  const runPatternAnalysis = async () => {
    try {
      setAnalyzing(true);
      
      const endDate = new Date();
      const startDate = subDays(endDate, timeRanges[selectedTimeRange].days);
      
      const response = await fetch('/api/health-calendar/patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          analysisTypes: ['correlation', 'trend', 'frequency', 'severity']
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to run pattern analysis');
      }
      
      toast.success('Pattern analysis completed!');
      await loadAnalyticsData();
    } catch (error) {
      console.error('Error running analysis:', error);
      toast.error('Failed to run pattern analysis');
    } finally {
      setAnalyzing(false);
    }
  };



  const getCorrelationStrength = (correlation: number): string => {
    const abs = Math.abs(correlation);
    if (abs >= 0.7) return 'Strong';
    if (abs >= 0.5) return 'Moderate';
    if (abs >= 0.3) return 'Weak';
    return 'Very Weak';
  };





  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Loading health analytics...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center py-12">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600 mb-4">Start logging daily check-ins to see health patterns and insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Health Patterns & Analytics</h2>
              <p className="text-sm sm:text-base text-gray-600">AI-powered insights from your health data</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as TimeRangeKey)}
              className="px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation text-base sm:text-sm"
            >
              {Object.entries(timeRanges).map(([key, range]) => (
                <option key={key} value={key}>{range.label}</option>
              ))}
            </select>
            <button
              onClick={runPatternAnalysis}
              disabled={analyzing}
              className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 touch-manipulation text-base sm:text-sm"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap sm:flex-nowrap gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'trends', label: 'Trends', icon: TrendingUp },
            { key: 'patterns', label: 'Patterns', icon: Brain },
            { key: 'correlations', label: 'Correlations', icon: Activity }
          ].map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation flex-1 sm:flex-none ${
                  activeTab === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 touch-manipulation">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="text-xs sm:text-sm font-medium text-blue-900">Check-ins</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-blue-900">{data.summary.totalCheckins}</div>
                <div className="text-xs text-blue-700">{timeRanges[selectedTimeRange].label}</div>
              </div>
              
              <div className="bg-pink-50 rounded-lg p-4 touch-manipulation">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                  <span className="text-xs sm:text-sm font-medium text-pink-900">Avg Mood</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-pink-900">{data.summary.avgMood.toFixed(1)}/10</div>
                <div className="text-xs text-pink-700">Overall wellbeing</div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4 touch-manipulation">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                  <span className="text-xs sm:text-sm font-medium text-yellow-900">Avg Energy</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-yellow-900">{data.summary.avgEnergy.toFixed(1)}/10</div>
                <div className="text-xs text-yellow-700">Energy levels</div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 touch-manipulation">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="text-xs sm:text-sm font-medium text-blue-900">Avg Sleep</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-blue-900">{data.summary.avgSleep.toFixed(1)}/10</div>
                <div className="text-xs text-blue-700">Sleep quality</div>
              </div>
            </div>

            {/* Symptom Frequency Chart */}
            {data.symptomFrequency.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Most Common Symptoms</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.symptomFrequency.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Mood, Energy, Sleep Trends */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Daily Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.moodTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM d')} fontSize={12} />
                  <YAxis domain={[0, 10]} fontSize={12} />
                  <Tooltip labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')} />
                  <Line type="monotone" dataKey="mood" stroke="#EC4899" strokeWidth={2} name="Mood" />
                  <Line type="monotone" dataKey="energy" stroke="#F59E0B" strokeWidth={2} name="Energy" />
                  <Line type="monotone" dataKey="sleep" stroke="#3B82F6" strokeWidth={2} name="Sleep" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="space-y-6">
            {data.patterns.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {data.patterns.map((pattern, index) => (
                  <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200 touch-manipulation">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{pattern.title}</h4>
                        <p className="text-gray-700 text-xs sm:text-sm mb-3 leading-relaxed">{pattern.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full inline-block w-fit">
                            Confidence: {Math.round(pattern.confidence * 100)}%
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(pattern.createdAt), 'MMM d')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 px-4">
                <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm sm:text-base mb-4">No patterns detected yet. Keep logging your health data to discover insights!</p>
                <button
                  onClick={runPatternAnalysis}
                  disabled={analyzing}
                  className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 mx-auto touch-manipulation text-base sm:text-sm"
                >
                  {analyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  {analyzing ? 'Analyzing...' : 'Analyze Patterns'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'correlations' && (
          <div className="space-y-6">
            {data.correlations.length > 0 ? (
              <div className="space-y-4">
                {data.correlations.map((correlation, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 touch-manipulation">
                    <div className="flex items-start gap-3">
                      <BarChart3 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base break-words">
                          {correlation.factor1} ↔ {correlation.factor2}
                        </h4>
                        <p className="text-gray-700 text-xs sm:text-sm mb-3 leading-relaxed">
                          {getCorrelationStrength(correlation.correlation)} {correlation.correlation > 0 ? 'positive' : 'negative'} correlation
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block w-fit">
                            Strength: {(correlation.correlation * 100).toFixed(0)}%
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full inline-block w-fit ${
                            correlation.correlation > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {correlation.correlation > 0 ? '↗' : '↘'} {correlation.correlation > 0 ? 'positive' : 'negative'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 px-4">
                <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">No correlations found yet. More data needed to identify relationships!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthPatternsAnalytics;