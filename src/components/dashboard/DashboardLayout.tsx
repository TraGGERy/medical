'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Plus, 
  User, 
  Shield, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Bell,
  Search,
  Activity,
  MessageCircle,
  FileText,
  ShoppingBag,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
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
    { id: 'new-diagnostic', label: 'Start Evaluation', icon: Plus },
    { id: 'report-viewer', label: 'My Reports', icon: FileText },
    { id: 'chat', label: 'AI Health Chat', icon: MessageCircle },
    { id: 'shop', label: 'Member Shop', icon: ShoppingBag },
    { id: 'profile', label: 'Profile Settings', icon: User },
    // { id: 'privacy', label: 'Security', icon: Shield },
  ];

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Premium Navy Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? 80 : 280,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col h-screen sticky top-0 bg-secondary text-white shadow-2xl z-50 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <motion.div 
                onClick={() => router.push('/')}
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                  <span className="text-white font-bold text-lg italic">M</span>
                </div>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="ml-3"
                    >
                      <h1 className="text-lg font-bold font-serif leading-none">MediScope</h1>
                      <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mt-1">Provider AI</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              
              {!sidebarCollapsed && (
                <button
                    onClick={() => setSidebarCollapsed(true)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 text-white/40" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 pt-8 space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={cn(
                    'w-full flex items-center px-4 py-4 rounded-2xl font-bold transition-all group overflow-hidden relative',
                    isActive
                      ? 'bg-primary text-white shadow-xl shadow-primary/20'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className={cn(
                    'w-5 h-5 transition-colors shrink-0',
                    isActive ? 'text-white' : 'group-hover:text-white'
                  )} />
                  
                  {!sidebarCollapsed && (
                    <span className="ml-4 text-sm whitespace-nowrap">{item.label}</span>
                  )}

                  {isActive && !sidebarCollapsed && (
                    <motion.div
                      layoutId="activeGlow"
                      className="absolute right-0 w-1.5 h-6 bg-white rounded-l-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-white/5 mb-4">
            <div className={cn(
              'flex items-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer',
              sidebarCollapsed && 'justify-center p-2'
            )}>
              <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center text-primary font-bold shadow-inner shrink-0">
                {userInitials}
              </div>
              
              {!sidebarCollapsed && (
                <div className="ml-3 flex-1 overflow-hidden">
                    <p className="text-sm font-bold truncate">{userName}</p>
                    <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Premium Access</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Nav Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 z-50 flex items-center justify-between px-4">
         <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white mr-2">
                <span className="font-bold text-xs italic">M</span>
            </div>
            <h1 className="text-lg font-serif font-bold text-secondary">MediScope</h1>
         </div>
         <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-400">
            <Menu className="w-6 h-6" />
         </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-[60] lg:hidden" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed left-0 top-0 bottom-0 w-4/5 max-w-sm bg-secondary text-white z-[70] lg:hidden p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-12">
                   <h2 className="text-2xl font-serif font-bold">Menu</h2>
                   <button onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6 text-white/40" /></button>
                </div>
                <nav className="space-y-4">
                    {menuItems.map(item => (
                        <button key={item.id} onClick={() => handleTabChange(item.id)} className={cn("w-full flex items-center p-4 rounded-2xl font-bold transition", activeTab === item.id ? "bg-primary text-white" : "text-white/40 hover:text-white")}>
                            <item.icon className="w-5 h-5 mr-4" />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 pb-12">
        {/* Desktop Header */}
        <div className="hidden lg:flex h-20 items-center justify-between px-8 bg-white border-b border-slate-100 sticky top-0 z-40">
           <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Private Diagnostic Environment
           </div>
           <div className="flex items-center space-x-6">
                <div className="p-2 text-slate-300 hover:text-primary transition cursor-pointer">
                    <Bell className="w-5 h-5" />
                </div>
                <div className="h-8 w-px bg-slate-100" />
                <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => onTabChange('profile')}>
                    <span className="text-sm font-bold text-secondary group-hover:text-primary transition">{userName}</span>
                    <div className="w-10 h-10 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center text-primary group-hover:border-primary transition font-bold shadow-sm">
                        {userInitials}
                    </div>
                </div>
           </div>
        </div>

        <div className="p-4 sm:p-8 pt-20 lg:pt-8 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}