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
  Sparkles
} from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import PricingCard from '@/components/PricingCard';
import Testimonial from '@/components/Testimonial';
import ProcessStep from '@/components/ProcessStep';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-teal-100 selection:text-teal-900">
      <Header />
      
      <main>
        {/* Modern Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,_#f0fdfa_0%,_transparent_50%)] -z-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 mb-6">
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Doctor-Led Personalized Health</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-serif font-bold text-secondary leading-tight mb-6">
                  Total Health <br />
                  <span className="text-primary italic">Optimization</span>
                </h1>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-lg">
                  Advanced medical solutions for Weight Loss, Men's Health, and Women's Wellness. Discreet, doctor-prescribed, and delivered to your door.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                  <Button 
                    size="lg" 
                    className="px-10 py-7 text-lg rounded-2xl shadow-xl shadow-teal-500/20"
                    onClick={() => window.location.href = '/health-check'}
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <div className="flex -space-x-3 items-center">
                     {[1,2,3,4].map(i => (
                       <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200"></div>
                     ))}
                     <div className="pl-6">
                        <div className="flex items-center text-yellow-400">
                           <Star className="w-4 h-4 fill-current" />
                           <Star className="w-4 h-4 fill-current" />
                           <Star className="w-4 h-4 fill-current" />
                           <Star className="w-4 h-4 fill-current" />
                           <Star className="w-4 h-4 fill-current" />
                        </div>
                        <p className="text-xs font-bold text-slate-400">50,000+ Happy Patients</p>
                     </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="mt-16 lg:mt-0 relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
              >
                <div className="aspect-[4/5] bg-slate-100 rounded-[3rem] overflow-hidden relative shadow-2xl">
                   <div className="absolute inset-0 bg-gradient-to-tr from-teal-600/20 to-transparent"></div>
                   <div className="w-full h-full bg-teal-900 group relative">
                      {/* Abstract placeholder that looks premium */}
                      <div className="absolute inset-0 flex items-center justify-center p-12 text-center text-white">
                         <div>
                            <Activity className="w-20 h-20 mx-auto mb-6 text-primary opacity-50" />
                            <h3 className="text-4xl font-serif font-bold mb-4">Precision Medicine</h3>
                            <p className="text-teal-100/70 text-lg">AI-powered analytics meets licensed medical expertise.</p>
                         </div>
                      </div>
                   </div>
                </div>
                {/* Floating Stats */}
                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-2xl border border-slate-50 max-w-[200px]">
                   <p className="text-sm font-bold text-secondary">Average Weight Loss</p>
                   <p className="text-4xl font-serif font-bold text-primary">15-20%</p>
                   <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Body Weight</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-24 bg-slate-50">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                 <h2 className="text-3xl md:text-5xl font-serif font-bold text-secondary mb-4">Specialized <span className="text-primary italic">Treatment Tracks</span></h2>
                 <p className="text-slate-600 max-w-2xl mx-auto text-lg">Tailored medical protocols for your specific goals.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <CategoryCard 
                    title="Medical Weight Loss"
                    desc="Semaglutide & Tirzepatide (GLP-1) treatments to manage hunger and metabolism."
                    icon={<Zap className="w-8 h-8 text-primary" />}
                    link="/health-check"
                 />
                 <CategoryCard 
                    title="Men's Health"
                    desc="Personalized solutions for ED, hair regrowth, and testosterone optimization."
                    icon={<User className="w-8 h-8 text-primary" />}
                    link="/health-check"
                 />
                 <CategoryCard 
                    title="Women's Wellness"
                    desc="Comprehensive care for libido, metabolic health, and dermatological anti-aging."
                    icon={<Heart className="w-8 h-8 text-primary" />}
                    link="/health-check"
                 />
              </div>
           </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
                <div>
                   <h2 className="text-4xl md:text-5xl font-serif font-bold text-secondary mb-8 leading-tight">The MediScope <br /> <span className="text-primary italic">Process</span></h2>
                   <div className="space-y-12">
                      <ProcessStep 
                        step={1} 
                        title="5-Minute Evaluation" 
                        description="Complete our medical quiz. It's comprehensive, HIPAA-compliant, and takes minutes."
                      />
                      <ProcessStep 
                        step={2} 
                        title="Doctor Review" 
                        description="A licensed U.S. physician reviews your records and prescribes the optimal protocol."
                      />
                      <ProcessStep 
                        step={3} 
                        title="Discreet Fast Shipping" 
                        description="Medication is shipped from our certified pharmacies directly to your door."
                      />
                   </div>
                </div>
                <div className="mt-16 lg:mt-0 relative">
                    <div className="bg-teal-50 rounded-[4rem] p-12 relative overflow-hidden h-[500px] flex items-center justify-center">
                        <div className="text-center">
                           <ShieldCheck className="w-32 h-32 text-primary/20 absolute -top-10 -right-10 rotate-12" />
                           <div className="relative z-10">
                              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                                 <Stethoscope className="w-12 h-12 text-primary" />
                              </div>
                              <h4 className="text-2xl font-serif font-bold text-secondary mb-4">100% Doctor Managed</h4>
                              <p className="text-slate-600 max-w-xs mx-auto">Unlike generic apps, our medicine is tailored by actual experts specifically for your unique biology.</p>
                           </div>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </section>

        {/* Pricing/Medications */}
        <section id="pricing" className="py-24 bg-slate-900 text-white rounded-[4rem] mx-4 sm:mx-8 mb-24 overflow-hidden relative">
           <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,_rgba(20,184,166,0.15)_0%,_transparent_50%)]"></div>
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-16">
                 <h2 className="text-3xl md:text-6xl font-serif font-bold mb-4 text-white">Transparent <span className="text-primary">Pricing</span></h2>
                 <p className="text-teal-100/60 max-w-2xl mx-auto text-lg">No insurance needed. One flat monthly fee for your doctor, pharmacy, and support.</p>
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
                    title="Wellness & Anti-Aging"
                    price="From $79"
                    features={['Custom Compounds', 'Dermatologist Review', 'Ongoing Optimization', 'Subscription-based refills']}
                    buttonText="Get Started"
                    onButtonClick={() => window.location.href = '/health-check'}
                 />
              </div>
           </div>
        </section>

        {/* Trust Section */}
        <section className="py-24">
           <div className="max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
                 <div className="flex items-center justify-center font-bold text-slate-400 text-2xl">LEGIT SCRIPT</div>
                 <div className="flex items-center justify-center font-bold text-slate-400 text-2xl">HIPAA SECURE</div>
                 <div className="flex items-center justify-center font-bold text-slate-400 text-2xl">CLIA LABS</div>
                 <div className="flex items-center justify-center font-bold text-slate-400 text-2xl">FDA REGISTERED</div>
              </div>
           </div>
        </section>
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 py-20">
         <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
               <span className="text-2xl font-serif font-bold text-secondary">MediScope <span className="text-primary italic">AI</span></span>
               <p className="mt-4 text-slate-500 max-w-sm">Elevating medical standards for weight loss and sexual wellness through technology and clinical expertise.</p>
            </div>
            <div>
               <h5 className="font-bold text-secondary mb-4 uppercase tracking-widest text-xs">Resources</h5>
               <ul className="space-y-2 text-sm text-slate-500">
                  <li><a href="/treatment" className="hover:text-primary transition">Treatments</a></li>
                  <li><a href="/pricing" className="hover:text-primary transition">Pricing</a></li>
                  <li><a href="/faqs" className="hover:text-primary transition">FAQs</a></li>
               </ul>
            </div>
            <div>
               <h5 className="font-bold text-secondary mb-4 uppercase tracking-widest text-xs">Company</h5>
               <ul className="space-y-2 text-sm text-slate-500">
                  <li><a href="/about-us" className="hover:text-primary transition">About Us</a></li>
                  <li><a href="/privacy" className="hover:text-primary transition">Privacy Policy</a></li>
                  <li><a href="/terms" className="hover:text-primary transition">Terms of Service</a></li>
               </ul>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-slate-200 text-center">
            <p className="text-[10px] text-slate-400 leading-relaxed max-w-4xl mx-auto">
               MediScope AI provides technology services and connects patients with licensed healthcare providers. We do not provide medical services directly. Prescriptions are subject to medical evaluation and provider approval. Medications like Semaglutide and Sildenafil carry risks and side effects; consult with your doctor for full safety information.
            </p>
         </div>
      </footer>
    </div>
  );
}

function CategoryCard({ title, desc, icon, link }: { title: string, desc: string, icon: React.ReactNode, link: string }) {
   return (
      <div 
        onClick={() => window.location.href = link}
        className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer group"
      >
         <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
            {icon}
         </div>
         <h3 className="text-2xl font-serif font-bold text-secondary mb-3">{title}</h3>
         <p className="text-slate-500 text-sm leading-relaxed mb-6">{desc}</p>
         <div className="flex items-center text-primary font-bold text-sm">
            Learn More <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
         </div>
      </div>
   )
}
