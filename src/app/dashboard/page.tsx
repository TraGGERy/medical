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
  Clock,
  CreditCard,
  DollarSign,
  Sparkles
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Button from '@/components/Button';
import { cn } from '@/lib/utils';

// Mock components for different tabs
import ChatPage from '@/components/chat/ChatPage';
import HealthCheckHistory from '@/components/dashboard/HealthCheckHistory';
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
        return <DashboardOverview onStartQuiz={() => window.location.href = '/health-check'} onTabChange={setActiveTab} onBuy={handleBuy} />;
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
        return <DashboardOverview onStartQuiz={() => window.location.href = '/health-check'} onTabChange={setActiveTab} onBuy={handleBuy} />;
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

function DashboardOverview({ onStartQuiz, onTabChange, onBuy }: { onStartQuiz: () => void, onTabChange: (tab: string) => void, onBuy: (id: string) => void }) {
  const { user } = useUser();
  const userName = user?.firstName || 'User';

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Premium Membership Bar - "Price Up There" */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/5 rounded-full flex items-center justify-center text-primary">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Active Membership</p>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-secondary leading-tight">Advanced Wellness Plan</h3>
          </div>
        </div>
        <div className="flex items-center space-x-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-50">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Monthly Investment</p>
            <p className="text-xl sm:text-2xl font-bold font-serif text-primary">$49.00<span className="text-xs text-slate-300 font-sans ml-1 text-nowrap">/ month</span></p>
          </div>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-primary transition-colors h-auto py-1">
            Manage <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </motion.div>

      {/* Hero Section - Phone Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-12 text-white relative overflow-hidden shadow-2xl"
      >
        <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 backdrop-blur-sm">Exclusive Portal</span>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold mb-4 leading-tight">Welcome back,<br className="sm:hidden" /> {userName}</h1>
            <p className="text-teal-50 opacity-90 max-w-sm text-sm sm:text-lg mb-8">Access your personalized protocols and track your diagnostic reports in real-time.</p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
               <button 
                onClick={onStartQuiz}
                className="bg-white text-primary font-bold px-8 py-4 rounded-xl sm:rounded-2xl shadow-xl hover:scale-[1.02] transition active:scale-[0.98] flex items-center justify-center"
               >
                  <Plus className="w-5 h-5 mr-2" />
                  New Clinical Evaluation
               </button>
               <button 
                onClick={() => onTabChange('chat')}
                className="bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-4 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center transition"
               >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Medical Assistant
               </button>
            </div>
        </div>
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-[80px] sm:blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      </motion.div>

      {/* Quick Status Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
         <SmallStats title="Protocols" value="0" status="active" />
         <SmallStats title="Diagnostics" value="Ready" status="available" />
         <SmallStats title="Orders" value="None" status="transit" />
         <SmallStats title="Doctor Note" value="Verified" status="check" />
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Health History */}
         <div className="lg:col-span-2 bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                        <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="font-serif font-bold text-xl sm:text-2xl text-secondary">Diagnostic History</h3>
               </div>
               <Button variant="ghost" size="sm" onClick={() => onTabChange('report-viewer')} className="text-slate-400">View History</Button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                    <Activity className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-400 text-sm font-medium">No diagnostic reports found.</p>
                <button onClick={onStartQuiz} className="mt-4 text-primary font-bold text-xs hover:underline decoration-2 underline-offset-4 transition">Start your first evaluation</button>
            </div>
         </div>

         {/* Products / Treatments Side Block */}
         <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="font-serif font-bold text-xl text-secondary">Recommended</h3>
               <div className="w-8 h-8 bg-primary/5 rounded-full flex items-center justify-center text-primary">
                    <Sparkles className="w-4 h-4" />
               </div>
            </div>
            
            <div className="space-y-4">
               <ProductMiniCard 
                title="Semaglutide GLP-1" 
                price="$179/mo" 
                color="primary" 
                onClick={() => onTabChange('shop')}
                icon={<Zap className="w-4 h-4" />}
               />
               <ProductMiniCard 
                title="Sexual Wellness" 
                price="From $49/mo" 
                color="pink" 
                onClick={() => onTabChange('shop')}
                icon={<Heart className="w-4 h-4" />}
               />
               <div className="pt-4 mt-4 border-t border-slate-50">
                    <button onClick={() => onTabChange('shop')} className="w-full py-4 text-sm font-bold text-slate-400 hover:text-primary transition flex items-center justify-center">
                        Visit Member Shop <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function SmallStats({ title, value, status }: { title: string, value: string, status: string }) {
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group hover:border-primary transition duration-300">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <div className="flex items-center justify-between">
                <span className="text-base sm:text-lg font-serif font-bold text-secondary leading-tight">{value}</span>
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    status === 'active' ? "bg-primary animate-pulse" : status === 'available' ? "bg-teal-400" : "bg-slate-200"
                )} />
            </div>
        </div>
    )
}

function ProductMiniCard({ title, price, color, onClick, icon }: { title: string, price: string, color: 'primary' | 'pink', onClick: () => void, icon: React.ReactNode }) {
    return (
        <div 
            onClick={onClick}
            className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 bg-slate-50/50 hover:bg-white hover:border-slate-100 hover:shadow-md transition cursor-pointer group"
        >
            <div className="flex items-center space-x-3">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
                    color === 'primary' ? "bg-primary" : "bg-pink-600"
                )}>
                    {icon}
                </div>
                <div>
                    <h4 className="text-xs font-bold text-secondary leading-none mb-1">{title}</h4>
                    <p className="text-[10px] text-slate-400">{price}</p>
                </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-primary transition" />
        </div>
    )
}

function MemberShop({ onBuy }: { onBuy: (id: string) => void }) {
   return (
      <div className="space-y-8 pb-20">
         <div className="flex items-center justify-between flex-wrap gap-4 px-2">
            <div>
               <h2 className="text-3xl sm:text-4xl font-serif font-bold text-secondary mb-2">Member <span className="text-primary italic">Shop</span></h2>
               <p className="text-sm text-slate-500 max-w-lg">Clinically-formulated wellness protocols. All orders require doctor review and an active evaluation.</p>
            </div>
            <div className="bg-white p-1.5 rounded-[1.25rem] border border-slate-100 flex items-center order-first sm:order-last">
               <div className="px-4 py-2 bg-primary/5 rounded-xl text-primary font-bold text-xs flex items-center">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Pharmacy Inventory
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <ShopItem 
               title="Semaglutide 5mg" 
               category="Weight Loss" 
               price="$179" 
               img="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&h=400&auto=format&fit=crop" 
               tag="GLP-1 Preferred"
               onBuy={() => onBuy('price_placeholder_semaglutide')}
            />
            <ShopItem 
               title="Sildenafil 50mg" 
               category="Men's Health" 
               price="$49" 
               img="https://plus.unsplash.com/premium_photo-1673324177263-6c703a45c361?q=80&w=400&h=400&auto=format&fit=crop" 
               tag="Doctor Approved"
               onBuy={() => onBuy('price_placeholder_sildenafil')}
            />
            <ShopItem 
               title="Tadalafil 20mg" 
               category="Men's Health" 
               price="$69" 
               img="https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?q=80&w=400&h=400&auto=format&fit=crop" 
               tag="Popular Choice"
               onBuy={() => onBuy('price_placeholder_tadalafil')}
            />
            <ShopItem 
               title="Tirzepatide 10mg" 
               category="Weight Loss" 
               price="$279" 
               img="https://images.unsplash.com/photo-1550572017-ed200fce049c?q=80&w=400&h=400&auto=format&fit=crop" 
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
      <motion.div 
        whileHover={{ y: -5 }}
        className={cn(
         "group bg-white rounded-3xl overflow-hidden border transition-all cursor-pointer relative",
         isPopular ? "border-primary shadow-xl shadow-teal-900/5" : "border-slate-100 hover:border-slate-300"
      )}>
         {isPopular && <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full z-10 uppercase tracking-widest">Recommended</div>}
         <div className="aspect-[4/3] overflow-hidden bg-slate-50 relative">
            <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/40 transition-all duration-300"></div>
         </div>
         <div className="p-6">
            <div className="flex items-center justify-between mb-3">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{category}</span>
               <span className={cn(
                    "text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider",
                    isPopular ? "text-primary bg-primary/5" : "text-slate-400 bg-slate-50"
               )}>{tag}</span>
            </div>
            <h4 className="text-xl font-bold text-secondary mb-6 group-hover:text-primary transition-colors">{title}</h4>
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
               <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Monthly Cost</span>
                    <div className="text-2xl font-serif font-bold text-secondary leading-none">{price}</div>
               </div>
               <button onClick={(e) => { e.stopPropagation(); onBuy(); }} className="h-12 w-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-[1.1] hover:bg-secondary transition active:scale-[0.95] shadow-lg shadow-primary/20">
                  <ArrowRight className="w-5 h-5" />
               </button>
            </div>
         </div>
      </motion.div>
   )
}