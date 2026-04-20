'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Truck, 
  Stethoscope, 
  ArrowRight, 
  CheckCircle2,
  Activity,
  Zap,
  Star,
  Heart,
  User,
  Sparkles,
  Lock,
  Package,
  ChevronRight,
  Play
} from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import PricingCard from '@/components/PricingCard';
import Testimonial from '@/components/Testimonial';
import ProcessStep from '@/components/ProcessStep';
import { cn } from '@/lib/utils';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-slate-100 selection:text-primary">
      <Header />
      
      <main>
        {/* ACT I: THE NEW STANDARD (Hero) */}
        <section className="relative pt-20 sm:pt-32 pb-20 sm:pb-40 overflow-hidden bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-20"
              >
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-slate-200 mb-8 shadow-sm">
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scientific Health Optimization</span>
                </div>
                <h1 className="text-5xl sm:text-7xl lg:text-8xl font-serif font-bold text-secondary leading-[1.1] mb-8">
                  The Science of <br />
                  <span className="text-primary italic">Better</span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-500 mb-10 leading-relaxed max-w-lg">
                  Advanced metabolic and performance protocols. Clinical-grade GLP-1 treatments, doctor-prescribed and delivered with absolute discretion.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                  <Button 
                    size="lg" 
                    className="px-12 py-5 sm:py-7 text-lg rounded-2xl bg-primary hover:bg-secondary shadow-2xl shadow-primary/20 transition-all border-0 h-auto"
                    onClick={() => window.location.href = '/health-check'}
                  >
                    Start My Evaluation
                    <ArrowRight className="ml-2 w-6 h-6 border-l border-white/20 pl-2" />
                  </Button>
                </div>
                <div className="mt-12 flex items-center space-x-6">
                    <div className="flex -space-x-3">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?u=${i}`} alt="Patient" />
                            </div>
                        ))}
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Trusted by 50,000+ Patients
                    </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="mt-16 lg:mt-0 relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
              >
                <div className="relative aspect-square sm:aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white group">
                    <img 
                      src="/images/Gemini_Generated_Image_obhg9fobhg9fobhg.png" 
                      alt="Mediscope GLP-1" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 via-transparent to-transparent pointer-events-none" />
                </div>
                {/* Floating Aesthetic Stats */}
                <div className="absolute -bottom-10 -left-6 sm:-left-10 bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-slate-50 max-w-[220px]">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Primary Goal</p>
                   <p className="text-4xl font-serif font-bold text-secondary mb-1">15-22%</p>
                   <p className="text-xs text-primary font-bold">Reduction in Body Weight</p>
                </div>
              </motion.div>
            </div>
          </div>
          {/* Background Decorative Element */}
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        </section>

        {/* ACT II: THE PHYSICIAN BRIDGE (Evaluation) */}
        <section className="py-24 sm:py-32 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-2 gap-16 sm:gap-24 items-center">
                    <div className="order-2 lg:order-1 relative">
                        <div className="relative aspect-[9/16] max-w-[320px] mx-auto sm:mx-0 bg-slate-50 rounded-[3rem] border-[12px] border-slate-900 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden">
                            <img src="/images/mediscope.png" alt="App interface" className="w-full h-full object-cover" />
                        </div>
                        {/* Status Bubbles */}
                        <motion.div 
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-6 -right-4 sm:-right-8 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center space-x-3"
                        >
                            <div className="w-3 h-3 bg-teal-400 rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-secondary">Physician Reviewing</span>
                        </motion.div>
                    </div>

                    <div className="order-1 lg:order-2 mt-16 sm:mt-0">
                        <h2 className="text-3xl sm:text-5xl font-serif font-bold text-secondary mb-8 leading-[1.2]">
                           Healthcare, <br />
                           <span className="text-primary italic">Reimagined</span>
                        </h2>
                        <div className="space-y-10">
                            <StoryPoint 
                                title="5-Minute Digital Intake"
                                desc="Our evaluation was designed by clinicians to capture your biology, goals, and history in record time."
                                num="01"
                            />
                            <StoryPoint 
                                title="Licensed Provider Audit"
                                desc="Your intake isn't just an algorithm. A licensed U.S. physician reviews every answer to ensure safety."
                                num="02"
                            />
                            <StoryPoint 
                                title="Seamless Authorization"
                                desc="Approvals happen in parallel with your routine. No waiting rooms, no clipboards, no friction."
                                num="03"
                            />
                        </div>
                        <div className="mt-12">
                            <Button onClick={() => window.location.href='/health-check'} variant="outline" className="rounded-full px-8 border-slate-200 text-secondary font-bold hover:bg-slate-50">
                                See How It Works
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* ACT III: PRECISION COMPOUNDS (Gallery/Science) */}
        <section className="py-24 sm:py-32 bg-slate-50 border-y border-slate-100">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 sm:mb-24">
                 <h2 className="text-4xl sm:text-6xl font-serif font-bold text-secondary mb-6">Advanced <span className="text-primary italic">Protocols</span></h2>
                 <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-lg">Exclusively compounded by our pharmacy partners using the purest active ingredients.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                 {/* Product Card 1 */}
                 <div className="group bg-white rounded-[3rem] p-1 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2">
                    <div className="aspect-[4/3] rounded-[2.8rem] overflow-hidden bg-slate-100 mb-8 relative">
                        <img src="/images/Gemini_Generated_Image_7ant5a7ant5a7ant (1).png" alt="GLP-1 Compound" className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 hover:scale-110" />
                        <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-bold text-primary border border-primary/10 tracking-widest uppercase">Precision GLP-1</div>
                    </div>
                    <div className="px-8 pb-10">
                        <h3 className="text-2xl sm:text-3xl font-serif font-bold text-secondary mb-4">Mediscope GLP-1</h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-8">Specialized receptor agonist injectable designed for significant metabolic resetting and weight management.</p>
                        <ul className="space-y-3">
                            <li className="flex items-center text-xs font-bold text-secondary tracking-tight">
                                <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                                PHARMACY COMPOUNDED
                            </li>
                            <li className="flex items-center text-xs font-bold text-secondary tracking-tight">
                                <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                                PHYSICIAN AUTHORIZED
                            </li>
                        </ul>
                    </div>
                 </div>

                 {/* Product Card 2 */}
                 <div className="group bg-white rounded-[3rem] p-1 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2">
                    <div className="aspect-[4/3] rounded-[2.8rem] overflow-hidden bg-slate-100 mb-8 relative">
                        <img src="/images/Gemini_Generated_Image_obhg9fobhg9fobhg (1).png" alt="GLP-GIP Compound" className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 hover:scale-110" />
                        <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-bold text-primary border border-primary/10 tracking-widest uppercase">Dual-Action GIP</div>
                    </div>
                    <div className="px-8 pb-10">
                        <h3 className="text-2xl sm:text-3xl font-serif font-bold text-secondary mb-4">Mediscope GLP-GIP</h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-8">Enhanced dual-action medication targets two distinct pathways for superior glycemic and weight results.</p>
                        <ul className="space-y-3">
                            <li className="flex items-center text-xs font-bold text-secondary tracking-tight">
                                <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                                1:1 METABOLIC RATIO
                            </li>
                            <li className="flex items-center text-xs font-bold text-secondary tracking-tight">
                                <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                                PRIORITY DELIVERY
                            </li>
                        </ul>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* ACT IV: THE CARE EXPERIENCE (The Arrival) */}
        <section className="py-24 sm:py-48 relative overflow-hidden bg-secondary text-white">
            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1540340334550-824701fc6347?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center grayscale mix-blend-overlay"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="lg:grid lg:grid-cols-5 gap-16 items-center">
                    <div className="lg:col-span-3">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/20 mb-8 backdrop-blur-sm">
                            <Truck className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Doorstep Delivery</span>
                        </div>
                        <h2 className="text-4xl sm:text-7xl font-serif font-bold mb-10 leading-[1.1]">
                            The Arrival of <br />
                            <span className="text-primary italic">Better Health</span>
                        </h2>
                        <p className="text-lg sm:text-xl text-teal-100/60 mb-12 max-w-xl leading-relaxed">
                            No pharmacies, no lines, no awkward conversations. Your personalized protocol arrives in discreet, temperature-controlled packaging everywhere you are.
                        </p>
                        <div className="grid grid-cols-2 gap-8 mb-12 border-t border-white/10 pt-10">
                            <div>
                                <h4 className="text-blue-400 font-bold uppercase tracking-widest text-[10px] mb-2">Arrival Speed</h4>
                                <p className="text-2xl font-serif font-bold uppercase">24-48 Hours</p>
                            </div>
                            <div>
                                <h4 className="text-blue-400 font-bold uppercase tracking-widest text-[10px] mb-2">Package Style</h4>
                                <p className="text-2xl font-serif font-bold uppercase">100% Discreet</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-2 mt-16 lg:mt-0">
                        <div className="relative group cursor-pointer aspect-square rounded-[3rem] overflow-hidden border-[1px] border-white/10 shadow-2xl">
                           <video 
                                src="/images/shoot_0 (1).mp4" 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                                className="w-full h-full object-cover"
                           />
                           <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition duration-500"></div>
                           <div className="absolute bottom-10 left-10 right-10 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-widest">Unboxing Experience</span>
                                    <div className="w-8 h-8 rounded-full bg-white text-secondary flex items-center justify-center">
                                        <Play className="w-3 h-3 fill-current ml-0.5" />
                                    </div>
                                </div>
                           </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Background Accent */}
            <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] translate-x-1/2 translate-y-1/2"></div>
        </section>

        {/* PRICING (Closing Argument) */}
        <section id="pricing" className="py-24 sm:py-32 bg-white">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16 sm:mb-24">
                 <h2 className="text-4xl sm:text-6xl font-serif font-bold text-secondary mb-6 leading-tight">One Price, <br className="sm:hidden" /> <span className="text-primary">Total Care</span></h2>
                 <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-lg px-4">Your doctor review, medication, and shipping—all included in a single monthly investment.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 <PricingCard 
                    title="GLP-1 Weight Loss"
                    price="From $179"
                    features={['Semaglutide or Tirzepatide', 'Doctor Consultation', 'Overnight Cold Shipping', 'Support Community']}
                    buttonText="Get Started"
                    onButtonClick={() => window.location.href = '/health-check'}
                 />
                 <PricingCard 
                    title="Men's Sexual Health"
                    price="From $49"
                    features={['Sildenafil or Tadalafil', 'Personalized Dosages', 'Discreet Packaging', 'Pharmacy Processing']}
                    isPopular={true}
                    buttonText="Get Started"
                    onButtonClick={() => window.location.href = '/health-check'}
                 />
                 <PricingCard 
                    title="Women's Wellness"
                    price="From $79"
                    features={['Desire & Metabolic Support', 'Clinical Optimization', 'Ongoing Expert Support', 'Subscription Refills']}
                    buttonText="Get Started"
                    onButtonClick={() => window.location.href = '/health-check'}
                 />
              </div>
           </div>
        </section>

        {/* CTA Banner */}
        <section className="py-24 px-4">
           <div className="max-w-5xl mx-auto bg-primary rounded-[3rem] sm:rounded-[4rem] p-10 sm:p-20 text-white text-center shadow-[0_50px_100px_-20px_rgba(29,62,94,0.4)] relative overflow-hidden">
               <div className="relative z-10">
                    <h2 className="text-4xl sm:text-7xl font-serif font-bold mb-8">Ready to <span className="italic opacity-80">Reset?</span></h2>
                    <p className="text-teal-50/70 text-lg sm:text-xl mb-12 max-w-xl mx-auto">Join thousands of patients who have transformed their baseline with MediScope.</p>
                    <Button 
                        size="lg" 
                        variant="secondary"
                        className="px-16 py-6 sm:py-8 text-xl rounded-2xl bg-white text-primary font-serif font-bold border-0 shadow-2xl hover:scale-105 transition active:scale-95 h-auto group"
                        onClick={() => window.location.href = '/health-check'}
                    >
                        Start Evaluation
                        <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </Button>
               </div>
               {/* Decorative Background */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
           </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-100 py-24">
         <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 sm:gap-24">
            <div className="col-span-1 md:col-span-2">
               <div className="flex items-center space-x-2 mb-6">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white italic font-bold">M</div>
                    <span className="text-2xl font-serif font-bold text-secondary tracking-tight">MediScope</span>
               </div>
               <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-8">The digital gateway to personal health optimization. Advanced medicine, doctor-prescribed, made accessible through AI-driven evaluation.</p>
               <div className="flex items-center space-x-4 opacity-30 grayscale saturate-0 hover:grayscale-0 transition group">
                    <ShieldCheck className="w-6 h-6" />
                    <Star className="w-6 h-6" />
                    <Heart className="w-6 h-6" />
               </div>
            </div>
            <div>
               <h5 className="font-bold text-secondary mb-6 uppercase tracking-widest text-[10px]">Medical Services</h5>
               <ul className="space-y-4 text-xs font-bold text-slate-400">
                  <li><a href="/health-check" className="hover:text-primary transition">GLP-1 Weight Loss</a></li>
                  <li><a href="/health-check" className="hover:text-primary transition">Sexual Performance</a></li>
                  <li><a href="/health-check" className="hover:text-primary transition">Metabolic Health</a></li>
                  <li><a href="/health-check" className="hover:text-primary transition">Wellness Protocols</a></li>
               </ul>
            </div>
            <div>
               <h5 className="font-bold text-secondary mb-6 uppercase tracking-widest text-[10px]">Patient Portal</h5>
               <ul className="space-y-4 text-xs font-bold text-slate-400">
                  <li><a href="/sign-in" className="hover:text-primary transition">Member Login</a></li>
                  <li><a href="/dashboard" className="hover:text-primary transition">My Account</a></li>
                  <li><a href="/support" className="hover:text-primary transition">Help Center</a></li>
                  <li><a href="/legal" className="hover:text-primary transition">Privacy & Safety</a></li>
               </ul>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-4 mt-24 pt-12 border-t border-slate-100">
            <p className="text-[10px] text-slate-300 leading-relaxed max-w-4xl mx-auto text-center font-bold tracking-tight">
               MEDISCOPE AI IS A TECHNOLOGY PLATFORM, NOT A DIRECT HEALTHCARE PROVIDER. ALL MEDICAL SERVICES ARE PROVIDED BY LICENSED INDEPENDENT PHYSICIANS. PRESCRIPTIONS ARE SUBJECT TO MEDICAL EVALUATION AND PROVIDER APPROVAL. DISCOUNTS AND RESULTS VARY BY INDIVIDUAL. CONSULT YOUR DOCTOR BEFORE STARTING ANY NEW MEDICATED PROTOCOL.
            </p>
            <p className="text-[9px] text-slate-200 mt-6 text-center tracking-[0.2em] font-serif font-black uppercase">
               &copy; 2026 MEDISCOPE PHARMACEUTICAL TECHNOLOGIES. ALL RIGHTS RESERVED.
            </p>
         </div>
      </footer>
    </div>
  );
}

function StoryPoint({ title, desc, num }: { title: string, desc: string, num: string }) {
    return (
        <div className="flex items-start space-x-6 group">
            <div className="text-4xl font-serif font-black text-slate-100 group-hover:text-primary transition duration-500 select-none">{num}</div>
            <div className="pt-2">
                <h4 className="text-xl font-bold text-secondary mb-2">{title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}
