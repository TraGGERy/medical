'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  TrendingDown, 
  CheckCircle, 
  Calendar,
  Package,
  Heart,
  ShieldCheck,
  ChevronRight,
  Plus,
  ShoppingBag,
  MessageCircle,
  FileText,
  User,
  Shield,
  Search,
  ArrowRight,
  Star,
  Zap,
  Clock
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Button from '@/components/Button';
import { cn } from '@/lib/utils';

// Mock components for different tabs
import ChatPage from '@/components/chat/ChatPage';
import HealthCheckHistory from '@/components/dashboard/HealthCheckHistory';
import ReportViewer from '@/components/dashboard/ReportViewer';
import ProfileSettings from '@/components/dashboard/ProfileSettings';
import PrivacySettings from '@/components/dashboard/PrivacySettings';

export default function Dashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('overview');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleBuy = async (priceId: string) => {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview onStartQuiz={() => window.location.href = '/health-check'} onTabChange={setActiveTab} />;
      case 'new-diagnostic':
        window.location.href = '/health-check';
        return null;
      case 'chat':
        return <ChatPage />;
      case 'shop':
        return <MemberShop onBuy={handleBuy} />;
      case 'report-viewer':
        return <HealthCheckHistory />;
      case 'profile':
        return <ProfileSettings />;
      case 'privacy':
        return <PrivacySettings />;
      default:
        return <DashboardOverview onStartQuiz={() => window.location.href = '/health-check'} onTabChange={setActiveTab} />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

function DashboardOverview({ onStartQuiz, onTabChange }: { onStartQuiz: () => void, onTabChange: (tab: string) => void }) {
  const { user } = useUser();
  const userName = user?.firstName || 'User';

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-secondary rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Welcome back, {userName}!</h1>
            <p className="text-teal-100 opacity-90 max-w-md text-lg">Your health journey is in motion. Check your status or discover new wellness protocols in our member shop.</p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
               <Button onClick={onStartQuiz} className="bg-primary hover:bg-teal-400 text-white border-0 px-8 py-4 rounded-2xl shadow-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  New Evaluation
               </Button>
               <Button variant="outline" onClick={() => onTabChange('chat')} className="border-white/20 hover:bg-white/10 text-white px-8 py-4 rounded-2xl">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Ask AI Assistant
               </Button>
            </div>
          </div>
          <div className="hidden lg:flex flex-col space-y-4">
             <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10 w-64">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Status</span>
                   <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                </div>
                <div className="text-xl font-bold font-serif">Awaiting Quiz</div>
                <p className="text-[10px] opacity-60 mt-1">Completion time: ~5 mins</p>
             </div>
             <div className="bg-white/5 p-4 rounded-2xl border border-white/5 w-64">
                <p className="text-[10px] opacity-60">MEMBERSHIP: <span className="text-primary font-bold">PREMIUM</span></p>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      </motion.div>

      {/* Grid Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatusCard title="Active Protocols" value="0" icon={<Zap className="w-6 h-6 text-primary" />} desc="Visit shop to browse treatments." />
         <StatusCard title="Next Evaluation" value="Ready" icon={<Activity className="w-6 h-6 text-primary" />} desc="Free for all premium members." />
         <StatusCard title="Discreet Orders" value="None" icon={<Package className="w-6 h-6 text-slate-400" />} desc="Track your pharmacy shipments." />
      </div>

      {/* Main Content Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="font-serif font-bold text-2xl text-secondary">My Health History</h3>
               <Button variant="ghost" size="sm" onClick={() => onTabChange('report-viewer')}>View All</Button>
            </div>
            <div className="space-y-4">
               <div className="flex items-center justify-center h-48 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="text-center">
                     <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                     <p className="text-slate-400 text-sm">No medical reports found.</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="font-serif font-bold text-2xl text-secondary">Member Spotlight</h3>
               <ShoppingBag className="text-primary w-6 h-6" />
            </div>
            <div className="space-y-4">
               <div className="p-6 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-between group cursor-pointer" onClick={() => onTabChange('shop')}>
                  <div className="flex items-center space-x-4">
                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                        <Zap className="w-6 h-6" />
                     </div>
                     <div>
                        <div className="font-bold text-secondary">Advanced Weight Loss</div>
                        <p className="text-xs text-slate-500">GLP-1 Semaglutide Protocol</p>
                     </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition" />
               </div>
               <div className="p-6 rounded-3xl bg-pink-50 border border-pink-100 flex items-center justify-between group cursor-pointer" onClick={() => onTabChange('shop')}>
                  <div className="flex items-center space-x-4">
                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-pink-600 shadow-sm">
                        <Heart className="w-6 h-6" />
                     </div>
                     <div>
                        <div className="font-bold text-secondary">Sexual Wellness</div>
                        <p className="text-xs text-slate-500">Personalized ED & Libido care</p>
                     </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-pink-600 group-hover:translate-x-1 transition" />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function MemberShop({ onBuy }: { onBuy: (id: string) => void }) {
   return (
      <div className="space-y-8 pb-20">
         <div className="flex items-center justify-between">
            <div>
               <h2 className="text-4xl font-serif font-bold text-secondary mb-2">Member <span className="text-primary italic">Shop</span></h2>
               <p className="text-slate-500">Exclusively for MediScope AI members. All orders require doctor authorization.</p>
            </div>
            <div className="flex items-center space-x-4 bg-white p-2 rounded-2xl border border-slate-100">
               <div className="px-4 py-2 bg-teal-50 rounded-xl text-primary font-bold text-sm flex items-center">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  0 items
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ShopItem 
               title="Semaglutide 5mg" 
               category="Weight Loss" 
               price="$179" 
               img="https://placehold.co/400x400/0d9488/ffffff?text=Semaglutide" 
               tag="Subscription"
               onBuy={() => onBuy('price_placeholder_semaglutide')}
            />
            <ShopItem 
               title="Sildenafil 50mg" 
               category="Men's Health" 
               price="$49" 
               img="https://placehold.co/400x400/0f172a/ffffff?text=Sildenafil" 
               tag="Discreet"
               onBuy={() => onBuy('price_placeholder_sildenafil')}
            />
            <ShopItem 
               title="Tadalafil 20mg" 
               category="Men's Health" 
               price="$69" 
               img="https://placehold.co/400x400/1e293b/ffffff?text=Tadalafil" 
               tag="Daily Dose"
               onBuy={() => onBuy('price_placeholder_tadalafil')}
            />
            <ShopItem 
               title="Tirzepatide 10mg" 
               category="Weight Loss" 
               price="$279" 
               img="https://placehold.co/400x400/14b8a6/ffffff?text=Tirzepatide" 
               tag="Advanced GLP-1"
               isPopular
               onBuy={() => onBuy('price_placeholder_tirzepatide')}
            />
         </div>
      </div>
   )
}

function ShopItem({ title, category, price, img, tag, isPopular, onBuy }: { title: string, category: string, price: string, img: string, tag: string, isPopular?: boolean, onBuy: () => void }) {
   return (
      <div className={cn(
         "group bg-white rounded-3xl overflow-hidden border transition-all cursor-pointer relative",
         isPopular ? "border-primary shadow-xl shadow-teal-500/10" : "border-slate-100 hover:border-slate-300"
      )}>
         {isPopular && <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full z-10 uppercase tracking-widest">Best Value</div>}
         <div className="aspect-square overflow-hidden bg-slate-50">
            <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
         </div>
         <div className="p-6">
            <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{category}</span>
               <span className="text-[10px] font-bold text-primary bg-teal-50 px-2 py-0.5 rounded-lg uppercase">{tag}</span>
            </div>
            <h4 className="text-xl font-bold text-secondary mb-4">{title}</h4>
            <div className="flex items-center justify-between">
               <div className="text-2xl font-serif font-bold text-secondary">{price}<span className="text-xs text-slate-400 font-sans ml-1">/ mo</span></div>
               <button onClick={onBuy} className="p-3 bg-slate-50 hover:bg-primary hover:text-white rounded-2xl transition-colors">
                  <Plus className="w-5 h-5" />
               </button>
            </div>
         </div>
      </div>
   )
}

function StatusCard({ title, value, icon, desc }: { title: string, value: string, icon: React.ReactNode, desc: string }) {
  return (
    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition group">
       <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</span>
          <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-teal-50 transition-colors">{icon}</div>
       </div>
       <div className="text-2xl font-serif font-bold text-secondary mb-1">{value}</div>
       <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  )
}