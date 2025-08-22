'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Activity, Heart, Pill, AlertCircle, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { useWebSocket, HealthCalendarEvent } from '@/lib/websocket/websocket-service';

interface HealthEvent {
  id: string;
  eventType: 'symptom' | 'medication' | 'appointment' | 'exercise' | 'mood';
  title: string;
  description?: string;
  severity?: number;
  date: string;
  time?: string;
  duration?: number;
  tags?: string[];
}

interface DailyCheckin {
  id: string;
  date: string;
  mood: number;
  energy: number;
  sleepQuality: number;
  sleepHours?: number;
  symptoms?: string[];
  medications?: string[];
  notes?: string;
}

interface StreakInfo {
  streakType: string;
  currentStreak: number;
  longestStreak: number;
  status: 'active' | 'at_risk' | 'broken';
}

const HealthCalendarDashboard: React.FC = () => {
  const { user } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [dailyCheckins, setDailyCheckins] = useState<DailyCheckin[]>([]);
  const [streaks, setStreaks] = useState<StreakInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  
  // WebSocket integration for real-time updates
  const { connectionState, isConnected, emitHealthEvent } = useWebSocket({
    onHealthEventUpdate: (event: HealthCalendarEvent) => {
      console.log('Received health event update:', event);
      if (event.type === 'health_event_created') {
        handleRealTimeEventCreated(event.data as any);
      } else if (event.type === 'health_event_updated') {
        handleRealTimeEventUpdated(event.data as any);
      } else if (event.type === 'health_event_deleted') {
        handleRealTimeEventDeleted(event.data as any);
      }
    },
    onDailyCheckinUpdate: (event: HealthCalendarEvent) => {
      console.log('Received daily checkin update:', event);
      if (event.type === 'daily_checkin_created' || event.type === 'daily_checkin_updated') {
        handleRealTimeCheckinUpdate(event.data as any);
      }
    },
    onNotificationUpdate: (event: HealthCalendarEvent) => {
      console.log('Received notification update:', event);
      toast.info((event.data as any).message || 'New health notification received');
    },
    onConnect: () => {
      toast.success('Connected to real-time updates');
    },
    onDisconnect: () => {
      toast.warning('Disconnected from real-time updates');
    },
    onError: (error: Error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error occurred');
    }
  });

  // Get calendar days for current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Load data on component mount and when month changes
  useEffect(() => {
    if (user) {
      loadCalendarData();
    }
  }, [user, currentDate]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');

      // Load health events for the month
      const eventsResponse = await fetch(
        `/api/health-calendar/health-events?startDate=${startDate}&endDate=${endDate}`
      );
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setHealthEvents(eventsData.events || []);
      }

      // Load daily check-ins for the month
      const checkinsResponse = await fetch(
        `/api/health-calendar/daily-checkins?startDate=${startDate}&endDate=${endDate}`
      );
      if (checkinsResponse.ok) {
        const checkinsData = await checkinsResponse.json();
        setDailyCheckins(checkinsData.checkins || []);
      }

      // Load streak information
      const streaksResponse = await fetch('/api/health-calendar/streaks');
      if (streaksResponse.ok) {
        const streaksData = await streaksResponse.json();
        setStreaks(streaksData.streaks || []);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  // Real-time event handlers
  const handleRealTimeEventCreated = (eventData: { id: string; title: string; description?: string; eventType: string; date: string; severity?: number; time?: string; duration?: number; tags?: string[]; userId: string; createdAt: string; updatedAt: string }) => {
    const newEvent: HealthEvent = {
      id: eventData.id,
      eventType: eventData.eventType as HealthEvent['eventType'],
      title: eventData.title,
      description: eventData.description,
      severity: eventData.severity,
      date: eventData.date,
      time: eventData.time,
      duration: eventData.duration,
      tags: eventData.tags
    };
    setHealthEvents(prev => [...prev, newEvent]);
    toast.success('New health event added');
  };

  const handleRealTimeEventUpdated = (eventData: { id: string; title: string; description?: string; eventType: string; date: string; severity?: number; time?: string; duration?: number; tags?: string[]; userId: string; createdAt: string; updatedAt: string }) => {
    const updatedEvent: HealthEvent = {
      id: eventData.id,
      eventType: eventData.eventType as HealthEvent['eventType'],
      title: eventData.title,
      description: eventData.description,
      severity: eventData.severity,
      date: eventData.date,
      time: eventData.time,
      duration: eventData.duration,
      tags: eventData.tags
    };
    setHealthEvents(prev => prev.map(event => 
      event.id === eventData.id ? updatedEvent : event
    ));
    toast.info('Health event updated');
  };

  const handleRealTimeEventDeleted = (eventData: { id: string }) => {
    setHealthEvents(prev => prev.filter(event => event.id !== eventData.id));
    toast.info('Health event deleted');
  };

  const handleRealTimeCheckinUpdate = (checkinData: { id: string; date: string; mood: number; energy: number; sleepQuality: number; sleepHours?: number; symptoms?: string[]; medications?: string[]; notes?: string; userId: string; createdAt: string; updatedAt: string }) => {
    const updatedCheckin: DailyCheckin = {
      id: checkinData.id,
      date: checkinData.date,
      mood: checkinData.mood,
      energy: checkinData.energy,
      sleepQuality: checkinData.sleepQuality,
      sleepHours: checkinData.sleepHours,
      symptoms: checkinData.symptoms || [],
      medications: checkinData.medications || [],
      notes: checkinData.notes
    };
    
    setDailyCheckins(prev => {
      const existingIndex = prev.findIndex(checkin => checkin.id === checkinData.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = updatedCheckin;
        return updated;
      } else {
        return [...prev, updatedCheckin];
      }
    });
    
    toast.success('Daily check-in updated');
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const getEventsForDate = (date: Date): HealthEvent[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return healthEvents.filter(event => event.date === dateStr);
  };

  const getCheckinForDate = (date: Date): DailyCheckin | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return dailyCheckins.find(checkin => checkin.date === dateStr);
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'symptom':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'medication':
        return <Pill className="w-3 h-3 text-blue-500" />;
      case 'appointment':
        return <Calendar className="w-3 h-3 text-green-500" />;
      case 'exercise':
        return <Activity className="w-3 h-3 text-orange-500" />;
      case 'mood':
        return <Heart className="w-3 h-3 text-pink-500" />;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  const getMoodColor = (mood: number): string => {
    if (mood >= 8) return 'bg-green-500';
    if (mood >= 6) return 'bg-yellow-500';
    if (mood >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleQuickCheckin = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const existingCheckin = getCheckinForDate(new Date());
    
    if (existingCheckin) {
      toast.info('You\'ve already completed today\'s check-in!');
      return;
    }
    
    setShowCheckinForm(true);
  };

  const handleEventSave = async (eventData: { title: string; description?: string; eventType: string; date: string }) => {
    try {
      const response = await fetch('/api/health-calendar/health-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Emit WebSocket event for real-time updates
        if (isConnected) {
          emitHealthEvent('health_event_created', result.data);
        }
        
        await loadCalendarData();
        setShowEventModal(false);
        toast.success('Event created successfully');
      } else {
        throw new Error('Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    }
  };

  const handleCheckinSave = async (checkinData: { mood: number; energy: number; sleepQuality: number; notes?: string }) => {
    try {
      const response = await fetch('/api/health-calendar/daily-checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...checkinData,
          date: format(selectedDate, 'yyyy-MM-dd')
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Emit WebSocket event for real-time updates
        if (isConnected) {
          emitHealthEvent('daily_checkin_created', result.data);
        }
        
        await loadCalendarData();
        setShowCheckinForm(false);
        toast.success('Daily check-in saved successfully');
      } else {
        throw new Error('Failed to save check-in');
      }
    } catch (error) {
      console.error('Error saving check-in:', error);
      toast.error('Failed to save check-in');
    }
  };

  const renderCalendarDay = (date: Date) => {
    const events = getEventsForDate(date);
    const checkin = getCheckinForDate(date);
    const isSelected = isSameDay(date, selectedDate);
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isTodayDate = isToday(date);

    return (
      <div
        key={date.toISOString()}
        className={`
          min-h-[80px] p-1 border border-gray-200 cursor-pointer transition-all duration-200
          ${isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}
          ${!isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''}
          ${isTodayDate ? 'ring-2 ring-blue-500' : ''}
        `}
        onClick={() => handleDateClick(date)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-medium ${
            isTodayDate ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
          }`}>
            {format(date, 'd')}
          </span>
          {checkin && (
            <div 
              className={`w-2 h-2 rounded-full ${getMoodColor(checkin.mood)}`}
              title={`Mood: ${checkin.mood}/10`}
            />
          )}
        </div>
        
        <div className="space-y-1">
          {events.slice(0, 3).map((event, index) => (
            <div
              key={event.id}
              className="flex items-center gap-1 text-xs p-1 rounded bg-white shadow-sm"
              title={event.description || event.title}
            >
              {getEventTypeIcon(event.eventType)}
              <span className="truncate flex-1">{event.title}</span>
            </div>
          ))}
          {events.length > 3 && (
            <div className="text-xs text-gray-500 text-center">
              +{events.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStreakSummary = () => {
    const dailyCheckinStreak = streaks.find(s => s.streakType === 'daily_checkin');
    
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Daily Check-in Streak</h3>
            <p className="text-blue-100">
              {dailyCheckinStreak ? `${dailyCheckinStreak.currentStreak} days` : 'Start your streak!'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {dailyCheckinStreak?.currentStreak || 0}
            </div>
            <div className="text-xs text-blue-200">
              Best: {dailyCheckinStreak?.longestStreak || 0}
            </div>
          </div>
        </div>
        
        {dailyCheckinStreak?.status === 'at_risk' && (
          <div className="mt-2 text-yellow-200 text-sm">
            ⚠️ Your streak is at risk! Complete today's check-in to continue.
          </div>
        )}
      </div>
    );
  };

  const renderSelectedDateDetails = () => {
    const events = getEventsForDate(selectedDate);
    const checkin = getCheckinForDate(selectedDate);
    const isSelectedToday = isToday(selectedDate);

    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          {isSelectedToday && (
            <button
              onClick={handleQuickCheckin}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Quick Check-in
            </button>
          )}
        </div>

        {checkin && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Daily Check-in</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Mood:</span>
                <div className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${getMoodColor(checkin.mood)}`} />
                  <span>{checkin.mood}/10</span>
                </div>
              </div>
              <div>
                <span className="text-gray-600">Energy:</span>
                <span className="ml-1">{checkin.energy}/10</span>
              </div>
              <div>
                <span className="text-gray-600">Sleep:</span>
                <span className="ml-1">{checkin.sleepQuality}/10</span>
              </div>
            </div>
            {checkin.notes && (
              <div className="mt-2">
                <span className="text-gray-600 text-sm">Notes:</span>
                <p className="text-sm mt-1">{checkin.notes}</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Health Events ({events.length})</h4>
            <button
              onClick={() => setShowEventModal(true)}
              className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </div>
          
          {events.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">
              No health events recorded for this day
            </p>
          ) : (
            <div className="space-y-2">
              {events.map(event => (
                <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getEventTypeIcon(event.eventType)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-sm">{event.title}</h5>
                      {event.time && (
                        <span className="text-xs text-gray-500">{event.time}</span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    )}
                    {event.severity && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-gray-500">Severity:</span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < event.severity! ? 'bg-red-500' : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Health Calendar</h1>
          <p className="text-gray-600 mt-1">Track your daily health journey</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          {/* Connection status indicator */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isConnected 
              ? 'bg-green-100 text-green-700' 
              : connectionState === 'connecting' 
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
            {isConnected ? (
              <><Wifi className="w-3 h-3" /> Live</>
            ) : connectionState === 'connecting' ? (
              <><Wifi className="w-3 h-3 animate-pulse" /> Connecting...</>
            ) : (
              <><WifiOff className="w-3 h-3" /> Offline</>
            )}
          </div>
          
          <button
            onClick={() => setShowCheckinForm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Daily Check-in</span>
            <span className="sm:hidden">Check-in</span>
          </button>
          <button
            onClick={() => setShowEventModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">View Patterns</span>
            <span className="sm:hidden">Patterns</span>
          </button>
        </div>
      </div>

      {/* Streak Summary */}
      {renderStreakSummary()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-2 sm:p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 py-1 sm:py-2">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.charAt(0)}</span>
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(renderCalendarDay)}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          {renderSelectedDateDetails()}
        </div>
      </div>

      {/* Modals would be rendered here */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Health Event</h3>
            <p className="text-gray-600">Health event modal will be implemented next.</p>
            <button
              onClick={() => setShowEventModal(false)}
              className="mt-4 w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showCheckinForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Daily Check-in</h3>
            <p className="text-gray-600">Daily check-in form will be implemented next.</p>
            <button
              onClick={() => setShowCheckinForm(false)}
              className="mt-4 w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthCalendarDashboard;