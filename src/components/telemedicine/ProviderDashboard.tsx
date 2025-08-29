'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  Phone, 
  MessageSquare,
  Star,
  TrendingUp,
  DollarSign,
  Settings,
  Bell,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { 
  Card,
} from "@/components/ui/Card";
import Image from 'next/image';

const ProviderDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'appointments' | 'patients' | 'availability'>('overview');

  const stats = [
    {
      label: "Today&apos;s Appointments",
      value: '8',
      change: '+2 from yesterday',
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      label: 'Total Patients',
      value: '247',
      change: '+12 this month',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      label: 'Average Rating',
      value: '4.9',
      change: '★★★★★',
      icon: Star,
      color: 'bg-yellow-500'
    },
    {
      label: 'Monthly Revenue',
      value: '$12,450',
      change: '+8% from last month',
      icon: DollarSign,
      color: 'bg-purple-500'
    }
  ];

  const todayAppointments = [
    {
      id: 1,
      patient: {
        name: 'John Smith',
        age: 45,
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=middle%20aged%20man%20professional%20headshot&image_size=square'
      },
      time: '9:00 AM',
      type: 'video',
      reason: 'Annual checkup',
      status: 'upcoming',
      duration: 30
    },
    {
      id: 2,
      patient: {
        name: 'Sarah Johnson',
        age: 32,
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=young%20woman%20professional%20headshot&image_size=square'
      },
      time: '10:30 AM',
      type: 'phone',
      reason: 'Follow-up consultation',
      status: 'in-progress',
      duration: 20
    },
    {
      id: 3,
      patient: {
        name: 'Michael Chen',
        age: 28,
        avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=young%20man%20professional%20headshot&image_size=square'
      },
      time: '2:00 PM',
      type: 'video',
      reason: 'Skin condition review',
      status: 'upcoming',
      duration: 25
    }
  ];

  const recentPatients = [
    {
      id: 1,
      name: 'Emma Wilson',
      lastVisit: '2024-01-10',
      condition: 'Hypertension',
      status: 'stable',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=woman%20professional%20headshot&image_size=square'
    },
    {
      id: 2,
      name: 'David Brown',
      lastVisit: '2024-01-08',
      condition: 'Diabetes Type 2',
      status: 'needs-attention',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=man%20professional%20headshot&image_size=square'
    },
    {
      id: 3,
      name: 'Lisa Garcia',
      lastVisit: '2024-01-05',
      condition: 'Allergies',
      status: 'stable',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=woman%20professional%20headshot&image_size=square'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'phone': return Phone;
      case 'chat': return MessageSquare;
      default: return Video;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'stable': return 'bg-green-100 text-green-800';
      case 'needs-attention': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{stat.change}</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Today&apos;s Schedule */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Today&apos;s Schedule</h2>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            View Full Calendar
          </Button>
        </div>
        
        <div className="space-y-4">
          {todayAppointments.map((appointment) => {
            const TypeIcon = getTypeIcon(appointment.type);
            return (
              <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Image 
                    src={appointment.patient.avatar} 
                    alt={appointment.patient.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{appointment.patient.name}</div>
                    <div className="text-sm text-gray-600">{appointment.reason}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium">{appointment.time}</div>
                    <div className="text-sm text-gray-600">{appointment.duration} min</div>
                  </div>
                  
                  <TypeIcon className="w-5 h-5 text-gray-600" />
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                  
                  {appointment.status === 'upcoming' && (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Start
                    </Button>
                  )}
                  
                  {appointment.status === 'in-progress' && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                      Join
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Patients */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Patients</h2>
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            View All Patients
          </Button>
        </div>
        
        <div className="space-y-4">
          {recentPatients.map((patient) => (
            <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <Image 
                  src={patient.avatar} 
                  alt={patient.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-gray-900">{patient.name}</div>
                  <div className="text-sm text-gray-600">{patient.condition}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Last visit</div>
                  <div className="font-medium">{new Date(patient.lastVisit).toLocaleDateString()}</div>
                </div>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                  {patient.status.replace('-', ' ')}
                </span>
                
                <Button size="sm" variant="outline">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderAppointments = () => (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">All Appointments</h2>
      <p className="text-gray-600">Comprehensive appointment management coming soon...</p>
    </Card>
  );

  const renderPatients = () => (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Management</h2>
      <p className="text-gray-600">Patient records and management tools coming soon...</p>
    </Card>
  );

  const renderAvailability = () => (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Availability Settings</h2>
      <p className="text-gray-600">Schedule and availability management coming soon...</p>
    </Card>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'availability', label: 'Availability', icon: Clock }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your practice and patient care</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </Button>
          <Button variant="outline">
            <Settings className="w-5 h-5 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <Card className="p-1">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={selectedTab === tab.id ? "default" : "ghost"}
                onClick={() => setSelectedTab(tab.id as 'overview' | 'appointments' | 'patients' | 'availability')}
                className="flex items-center space-x-2 px-4 py-2"
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Tab Content */}
      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'appointments' && renderAppointments()}
      {selectedTab === 'patients' && renderPatients()}
      {selectedTab === 'availability' && renderAvailability()}
    </div>
  );
};

export default ProviderDashboard;