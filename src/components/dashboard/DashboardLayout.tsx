'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Plus, 
  History, 
  Bot, 
  User, 
  Shield, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Bell,
  Search,
  Activity,
  Smartphone,
  Video,
  Calendar,
  Clock,
  Stethoscope,
  MessageSquare,
  MessageCircle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeConsultationId?: string;
}

export default function DashboardLayout({ children, activeTab, onTabChange, activeConsultationId }: DashboardLayoutProps) {
  const router = useRouter();
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get user display information
  const userName = user?.firstName || user?.fullName || 'User';
  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : user?.firstName 
    ? user.firstName[0] 
    : user?.fullName 
    ? user.fullName[0] 
    : 'U';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'new-diagnostic', label: 'New Check', icon: Plus },
    { id: 'health-calendar', label: 'Health Calendar', icon: Calendar },
    { id: 'active-chat', label: 'Active Chat', icon: MessageCircle },
    { id: 'telemedicine-overview', label: 'Telemedicine', icon: Video },
    { id: 'my-appointments', label: 'My Appointments', icon: Clock },
    { id: 'realtime-monitoring', label: 'Real-time Monitoring', icon: Activity },
    { id: 'device-management', label: 'Device Management', icon: Smartphone },
    { id: 'report-viewer', label: 'Health Reports', icon: FileText },
    { id: 'ai-consultations', label: 'AI Consultations', icon: Bot },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Glassmorphism Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? 80 : 280,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full bg-white/25 backdrop-blur-md border-r border-white/20 shadow-xl z-50"
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <motion.div 
                onClick={() => router.push('/')}
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="ml-3"
                    >
                      <h1 className="text-lg font-bold text-gray-800">MediScope AI</h1>
                      <p className="text-xs text-gray-600">Health Analytics</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              
              <motion.button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={cn(
                    'w-full flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-300 group',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-white/30 hover:text-gray-900'
                  )}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Icon className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-800'
                  )} />
                  
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="ml-3 text-sm"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute right-0 w-1 h-8 bg-white rounded-l-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-white/10">
            <div className={cn(
              'flex items-center p-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors cursor-pointer',
              sidebarCollapsed && 'justify-center'
            )}>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">{userInitials}</span>
              </div>
              
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 flex-1"
                  >
                    <p className="text-sm font-medium text-gray-800">{userName}</p>
                    <p className="text-xs text-gray-600">Premium Member</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-0 top-0 h-full w-280 bg-white/95 backdrop-blur-md border-r border-white/20 shadow-xl z-50 lg:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">M</span>
                    </div>
                    <div className="ml-3">
                      <h1 className="text-lg font-bold text-gray-800">MediScope AI</h1>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={cn(
                        'w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors',
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="ml-3">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className={cn(
        'fixed top-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm z-30 transition-all duration-300',
        sidebarCollapsed ? 'left-[80px]' : 'left-[280px]'
      )}>
        <div className="flex items-center justify-between h-full px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search health reports..."
                className="w-full pl-10 pr-4 py-2 bg-white/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <motion.button
              className="p-2 rounded-lg hover:bg-white/20 transition-colors relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </motion.button>

            {/* User Avatar */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-800">{userName}</p>
                <p className="text-xs text-gray-600">Premium Member</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">{userInitials}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={cn(
        'pt-16 transition-all duration-300',
        sidebarCollapsed ? 'ml-[80px]' : 'ml-[280px]'
      )}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}