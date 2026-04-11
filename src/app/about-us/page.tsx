'use client';

import Header from '@/components/Header';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-20">
        <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-secondary mb-8">Our Mission</h1>
            <p className="text-xl text-slate-600 mb-6 leading-relaxed">
              At MediScope AI, we believe that medical wellness should be accessible, affordable, and evidence-based. 
            </p>
            <p className="text-lg text-slate-500 mb-8 leading-relaxed">
              We leverage modern medicine and technology to connect patients with specialized care that goes beyond simple dieting. Our doctor-led protocols focus on metabolic health and long-term transformation.
            </p>
            <div className="grid grid-cols-2 gap-8 py-8 border-t border-slate-100">
               <div>
                  <div className="text-3xl font-serif font-bold text-primary">50k+</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Lives Impacted</div>
               </div>
               <div>
                  <div className="text-3xl font-serif font-bold text-primary">100%</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Doctor Reviewed</div>
               </div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 lg:mt-0"
          >
            <div className="aspect-[4/5] bg-slate-100 rounded-[3rem] overflow-hidden relative shadow-2xl">
               <div className="absolute inset-0 bg-gradient-to-tr from-teal-600/20 to-transparent"></div>
               {/* Replace with team photo or abstract med image */}
               <div className="w-full h-full flex items-center justify-center bg-teal-800 text-white p-12 text-center">
                  <div className="max-w-xs">
                     <h3 className="text-2xl font-serif font-bold mb-4 italic">&ldquo;Transforming healthcare through accessibility.&rdquo;</h3>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
