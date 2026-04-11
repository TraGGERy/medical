'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft,
  Scale,
  Activity,
  ShieldCheck,
  ClipboardList,
  User,
  Heart,
  Zap,
  ChevronRight
} from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { cn } from '@/lib/utils';

export default function HealthCheckPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [currentStep, setCurrentStep] = useState(0); // 0 = Selector
  const [track, setTrack] = useState<'' | 'weight' | 'sexual'>('');
  const [quizData, setQuizData] = useState({
    weight: '',
    height: '',
    age: '',
    gender: '',
    goal: '',
    healthIssues: [] as string[],
    concerns: '',
    currentMedications: '',
    isDiabetic: null as boolean | null,
    hasPancreatitisHistory: null as boolean | null,
    hasThyroidCancerHistory: null as boolean | null,
    allergies: '',
    bloodPressure: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-up');
    }
  }, [isSignedIn, isLoaded, router]);

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/dashboard');
    }, 2500);
  };

  const steps = [
    { number: 1, title: 'Basics', icon: Scale },
    { number: 2, title: 'Health', icon: Activity },
    { number: 3, title: 'Medical', icon: ClipboardList },
    { number: 4, title: 'Review', icon: ShieldCheck }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      
      <div className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          
          {/* Progress Header (Only if track is selected) */}
          {currentStep > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.number;
                  const isDone = currentStep > step.number;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 relative">
                       <div className={cn(
                         "w-10 h-10 rounded-full flex items-center justify-center transition-all z-10",
                         isActive ? "bg-primary text-white shadow-lg" : isDone ? "bg-teal-100 text-primary" : "bg-white text-slate-300 border border-slate-200"
                       )}>
                         {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                       </div>
                       <span className={cn("text-[10px] mt-2 font-bold uppercase tracking-tight", isActive ? "text-primary" : "text-slate-400")}>
                          {step.title}
                       </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quiz Content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 sm:p-12 border border-slate-100"
          >
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <div className="space-y-10">
                   <div className="text-center">
                      <h2 className="text-4xl font-serif font-bold text-secondary mb-4">Start Your <span className="text-primary italic">Transformation</span></h2>
                      <p className="text-slate-500">Pick the path that&apos;s right for you today.</p>
                   </div>
                   <div className="grid grid-cols-1 gap-4">
                      <button 
                        onClick={() => { setTrack('weight'); setCurrentStep(1); }}
                        className="flex items-center justify-between p-6 rounded-3xl border-2 border-slate-100 hover:border-primary hover:bg-teal-50 transition-all group"
                      >
                         <div className="flex items-center space-x-6">
                            <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                               <Zap className="w-8 h-8" />
                            </div>
                            <div className="text-left">
                               <h3 className="text-xl font-bold text-secondary">Medical Weight Loss</h3>
                               <p className="text-sm text-slate-500">Semaglutide & Tirzepatide protocols.</p>
                            </div>
                         </div>
                         <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-primary transition-colors" />
                      </button>

                      <button 
                        onClick={() => { setTrack('sexual'); setCurrentStep(1); }}
                        className="flex items-center justify-between p-6 rounded-3xl border-2 border-slate-100 hover:border-primary hover:bg-teal-50 transition-all group"
                      >
                         <div className="flex items-center space-x-6">
                            <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 group-hover:bg-primary group-hover:text-white transition-colors">
                               <Heart className="w-8 h-8" />
                            </div>
                            <div className="text-left">
                               <h3 className="text-xl font-bold text-secondary">Sexual Wellness</h3>
                               <p className="text-sm text-slate-500">Men&apos;s ED &amp; Women&apos;s Libido care.</p>
                            </div>
                         </div>
                         <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-primary transition-colors" />
                      </button>
                   </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-serif font-bold text-secondary mb-2">The Basics</h2>
                    <p className="text-slate-500">Essential information for medical review.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {track === 'weight' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Weight (lbs)</label>
                          <input 
                            type="number" 
                            placeholder="180" 
                            value={quizData.weight}
                            onChange={(e) => setQuizData({ ...quizData, weight: e.target.value })}
                            className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Height (in)</label>
                          <input 
                            type="number" 
                            placeholder="68" 
                            value={quizData.height}
                            onChange={(e) => setQuizData({ ...quizData, height: e.target.value })}
                            className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition" 
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Age</label>
                      <input 
                        type="number" 
                        placeholder="35" 
                        value={quizData.age}
                        onChange={(e) => setQuizData({ ...quizData, age: e.target.value })}
                        className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Gender</label>
                      <select 
                        value={quizData.gender}
                        onChange={(e) => setQuizData({ ...quizData, gender: e.target.value })}
                        className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition bg-white"
                      >
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8">
                   <div>
                    <h2 className="text-3xl font-serif font-bold text-secondary mb-2">Specific Concerns</h2>
                    <p className="text-slate-500">{track === 'weight' ? 'What are your primary goals?' : 'Tell us about your wellness needs.'}</p>
                  </div>
                  {track === 'weight' ? (
                     <div className="space-y-4">
                        {[
                          { label: 'Lose 10-20 lbs', val: 'lose_10_20' },
                          { label: 'Lose 20-50 lbs', val: 'lose_20_50' },
                          { label: 'Lose 50+ lbs', val: 'lose_50_plus' },
                          { label: 'Metabolic Optimization', val: 'metabolic' }
                        ].map((option) => (
                          <button 
                            key={option.val} 
                            onClick={() => { setQuizData({...quizData, goal: option.val}); handleNext(); }}
                            className={cn("w-full text-left px-6 py-5 rounded-2xl border transition-all font-bold", quizData.goal === option.val ? "border-primary bg-teal-50 text-primary" : "border-slate-100 hover:border-slate-300 text-slate-700")}
                          >
                            {option.label}
                          </button>
                        ))}
                     </div>
                  ) : (
                    <div className="space-y-6">
                       <div className="space-y-4">
                          <label className="text-sm font-bold text-slate-700">Which of these applies to you? (Select all that apply)</label>
                          <div className="grid grid-cols-1 gap-3">
                             {['Decreased Energy', 'Hair Loss/Thinning', 'Low Libido', 'Focus & Mental Clarity'].map(issue => (
                               <button 
                                 key={issue}
                                 onClick={() => {
                                   const newIssues = quizData.healthIssues.includes(issue) 
                                     ? quizData.healthIssues.filter(i => i !== issue)
                                     : [...quizData.healthIssues, issue];
                                   setQuizData({...quizData, healthIssues: newIssues});
                                 }}
                                 className={cn("px-6 py-4 rounded-xl border-2 text-left font-bold transition", quizData.healthIssues.includes(issue) ? "border-primary bg-teal-50 text-primary" : "border-slate-100 text-slate-600")}
                               >
                                 {issue}
                               </button>
                             ))}
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Additional Details</label>
                          <textarea 
                             value={quizData.concerns}
                             onChange={(e) => setQuizData({...quizData, concerns: e.target.value})}
                             placeholder="Please describe your symptoms or goals..."
                             className="w-full h-32 p-6 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition resize-none"
                          />
                       </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                 <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-serif font-bold text-secondary mb-2">Medical History</h2>
                      <p className="text-slate-500">Crucial for clinical safety and eligibility.</p>
                    </div>
                    
                    <div className="space-y-6">
                       {track === 'weight' && (
                         <>
                           <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                             <p className="text-sm font-bold text-slate-700 mb-4">Have you or any family member ever been diagnosed with Medullary Thyroid Cancer or Multiple Endocrine Neoplasia syndrome type 2 (MEN 2)?</p>
                             <div className="flex space-x-3">
                                <button 
                                  onClick={() => setQuizData({...quizData, hasThyroidCancerHistory: true})}
                                  className={cn("flex-1 py-3 rounded-xl border-2 font-bold transition", quizData.hasThyroidCancerHistory === true ? "border-red-500 bg-red-50 text-red-600" : "border-slate-100 hover:border-slate-300")}
                                >Yes</button>
                                <button 
                                  onClick={() => setQuizData({...quizData, hasThyroidCancerHistory: false})}
                                  className={cn("flex-1 py-3 rounded-xl border-2 font-bold transition", quizData.hasThyroidCancerHistory === false ? "border-primary bg-teal-50 text-primary" : "border-slate-100 hover:border-slate-300")}
                                >No</button>
                             </div>
                           </div>

                           <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                             <p className="text-sm font-bold text-slate-700 mb-4">Have you ever had Pancreatitis?</p>
                             <div className="flex space-x-3">
                                <button 
                                  onClick={() => setQuizData({...quizData, hasPancreatitisHistory: true})}
                                  className={cn("flex-1 py-3 rounded-xl border-2 font-bold transition", quizData.hasPancreatitisHistory === true ? "border-red-500 bg-red-50 text-red-600" : "border-slate-100 hover:border-slate-300")}
                                >Yes</button>
                                <button 
                                  onClick={() => setQuizData({...quizData, hasPancreatitisHistory: false})}
                                  className={cn("flex-1 py-3 rounded-xl border-2 font-bold transition", quizData.hasPancreatitisHistory === false ? "border-primary bg-teal-50 text-primary" : "border-slate-100 hover:border-slate-300")}
                                >No</button>
                             </div>
                           </div>
                         </>
                       )}

                       <div className="space-y-4">
                          <label className="text-sm font-bold text-slate-700">Are you currently taking any other medications? (Include vitamins & supplements)</label>
                          <textarea 
                            value={quizData.currentMedications}
                            onChange={(e) => setQuizData({...quizData, currentMedications: e.target.value})}
                            placeholder="List all medications..." 
                            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition h-24" 
                          />
                       </div>

                       <div className="space-y-4">
                          <label className="text-sm font-bold text-slate-700">Do you have any known allergies to medications?</label>
                          <textarea 
                            value={quizData.allergies}
                            onChange={(e) => setQuizData({...quizData, allergies: e.target.value})}
                            placeholder="List any allergies (e.g., Penicillin)..." 
                            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition h-24" 
                          />
                       </div>

                       {track === 'sexual' && (
                         <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-700">What is your typical Blood Pressure? (If known)</label>
                            <input 
                              type="text" 
                              value={quizData.bloodPressure}
                              onChange={(e) => setQuizData({...quizData, bloodPressure: e.target.value})}
                              placeholder="e.g. 120/80" 
                              className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition" 
                            />
                         </div>
                       )}
                    </div>
                 </div>
              )}

              {currentStep === 4 && (
                 <div className="space-y-8">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-10 h-10 text-primary" />
                      </div>
                      <h2 className="text-3xl font-serif font-bold text-secondary mb-2">Review Your Information</h2>
                      <p className="text-slate-500">Please verify your details before submitting for doctor review.</p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 space-y-4 text-sm">
                       <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-slate-500">Track</span>
                          <span className="font-bold text-secondary capitalize">{track === 'weight' ? 'Medical Weight Loss' : 'Sexual Wellness'}</span>
                       </div>
                       <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span className="text-slate-500">Age / Gender</span>
                          <span className="font-bold text-secondary">{quizData.age} / {quizData.gender}</span>
                       </div>
                       {track === 'weight' && (
                         <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-500">Weight / Height</span>
                            <span className="font-bold text-secondary">{quizData.weight} lbs / {quizData.height} in</span>
                         </div>
                       )}
                       <div className="flex flex-col space-y-1">
                          <span className="text-slate-500">Medications</span>
                          <span className="font-bold text-secondary">{quizData.currentMedications || 'None listing'}</span>
                       </div>
                       <div className="flex flex-col space-y-1">
                          <span className="text-slate-500">Allergies</span>
                          <span className="font-bold text-secondary">{quizData.allergies || 'None reported'}</span>
                       </div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 flex items-start space-x-3">
                       <Activity className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                       <p className="text-[11px] text-yellow-800 leading-relaxed font-medium">
                          By submitting, you confirm that the information provided is accurate. This evaluation is the first step in your doctor-led treatment plan.
                       </p>
                    </div>
                 </div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            {currentStep > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
                <button onClick={handlePrevious} className="flex items-center space-x-2 text-slate-400 font-bold hover:text-slate-600 transition">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                
                {currentStep < 4 ? (
                  <Button onClick={handleNext} className="px-8">
                     Next step
                     <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="px-12 bg-primary hover:bg-teal-400">
                    {isSubmitting ? "Submitting..." : "Finish My Evaluation"}
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}