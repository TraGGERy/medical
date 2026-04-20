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
  Sparkles,
  Zap,
  Heart,
  ChevronRight,
  Info,
  Calendar,
  AlertTriangle,
  User,
  Venus,
  Mars
} from 'lucide-react';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { cn } from '@/lib/utils';
import { SelectCard, MultiSelectGroup, QuestionWrapper } from '@/components/consultation/QuizComponents';

export default function HealthCheckPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();
  const [currentStep, setCurrentStep] = useState(0); // 0 = Selector, 1-5 = Quiz Parts
  const [track, setTrack] = useState<'' | 'weight' | 'sexual'>('');
  
  const [quizData, setQuizData] = useState({
    // Global / Personal
    gender: '' as 'male' | 'female' | '',
    dob_month: '',
    dob_day: '',
    dob_year: '',
    email: '',
    phone: '',

    // Weight Loss Track
    height_ft: '',
    height_in: '',
    weight_lbs: '',
    goal_weight_lbs: '',
    primary_reason: '',
    experienced_issues: [] as string[],
    priority: '',
    high_risk_conditions: [] as string[],
    other_conditions: [] as string[],
    weight_loss_pace: '',
    sleep_quality: '',
    sleep_hours: '',
    taken_meds_last_month: '',
    last_med_dose: '',
    last_med_duration: '',
    taken_opiates: '',
    prior_surgeries: '',
    tried_weight_programs: '',
    willing_to_reduce_calories: '',
    willing_to_increase_activity: '',
    weight_change_last_year: '',
    primary_importance: '',
    rhr_category: '',
    motivation_level: '',
    additional_benefits: [] as string[],

    // Sexual Wellness Track
    sexual_primary_goal: '',
    sexual_concerns: [] as string[],
    // Male-specific
    ed_frequency: '',
    morning_erections: '',
    med_success: '',
    nitrate_use: '',
    // Female-specific
    libido_change: '',
    menopause_status: '',
    cycle_regularity: '',
    dryness_concerns: '',
    
    // Shared Medical for Sexual Health
    blood_pressure_category: '',
    heart_health_history: '',
    current_meds: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-up');
    } else if (isLoaded && user) {
        setQuizData(prev => ({ ...prev, email: user.primaryEmailAddress?.emailAddress || '' }));
    }
  }, [isSignedIn, isLoaded, user, router]);

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/dashboard');
    }, 2500);
  };

  const steps = [
    { number: 1, title: 'Basics', icon: User },
    { number: 2, title: 'Concerns', icon: Sparkles },
    { number: 3, title: 'Medical', icon: Activity },
    { number: 4, title: 'Lifestyle', icon: ClipboardList },
    { number: 5, title: 'Eligibility', icon: ShieldCheck }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans mb-20 sm:mb-0">
      <Header />
      
      <div className="flex-1 py-4 sm:py-12 px-3 sm:px-6">
        <div className="max-w-2xl mx-auto">
          
          {/* Progress Header */}
          {currentStep > 0 && (
            <div className="mb-6 sm:mb-12">
              <div className="flex items-center justify-between px-1 sm:px-2">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.number;
                  const isDone = currentStep > step.number;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 relative">
                       <div className={cn(
                         "w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all z-10",
                         isActive ? "bg-primary text-white shadow-lg ring-2 sm:ring-4 ring-teal-100" : isDone ? "bg-teal-100 text-primary" : "bg-white text-slate-300 border border-slate-200"
                       )}>
                         {isDone ? <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" /> : <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />}
                       </div>
                       <span className={cn(
                           "text-[7px] sm:text-[10px] mt-1.5 sm:mt-2 font-bold uppercase tracking-tight text-center px-0.5",
                           isActive ? "text-primary" : "text-slate-400"
                       )}>
                          {step.title}
                       </span>
                       {/* Connector for desktop */}
                       {idx < steps.length - 1 && (
                         <div className="hidden sm:block absolute top-[14px] sm:top-5 left-[50%] w-full h-[2px] bg-slate-200 -z-0" />
                       )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quiz Content Container */}
          <motion.div
            key={`${track}-${currentStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl sm:rounded-3xl shadow-xl shadow-slate-200/50 p-5 sm:p-12 border border-slate-100"
          >
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <div className="space-y-6 sm:space-y-10">
                   <div className="text-center">
                      <h2 className="text-2xl sm:text-4xl font-serif font-bold text-secondary mb-2 sm:mb-3">Start Your <span className="text-primary italic">Transformation</span></h2>
                      <p className="text-slate-500 text-xs sm:text-base px-2 sm:px-4 leading-relaxed">Select your clinical path for personalized medical evaluation.</p>
                   </div>
                   <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {/* Weight Loss Button */}
                      <button 
                        onClick={() => { setTrack('weight'); setCurrentStep(1); }}
                        className="flex items-center justify-between p-4 sm:p-6 rounded-xl sm:rounded-3xl border-2 border-slate-100 hover:border-primary hover:bg-teal-50 transition-all group"
                      >
                         <div className="flex items-center space-x-3 sm:space-x-6">
                            <div className="w-10 h-10 sm:w-16 sm:h-16 bg-teal-100 rounded-lg sm:rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                               <Zap className="w-5 h-5 sm:w-8 sm:h-8" />
                            </div>
                            <div className="text-left">
                               <h3 className="text-base sm:text-xl font-bold text-secondary leading-tight">Medical Weight Loss</h3>
                               <p className="text-[10px] sm:text-sm text-slate-500 mt-0.5">GLP-1 Weight Management Protocols</p>
                            </div>
                         </div>
                         <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-slate-300 group-hover:text-primary transition-colors" />
                      </button>

                      {/* Sexual Wellness Button */}
                      <button 
                        onClick={() => { setTrack('sexual'); setCurrentStep(1); }}
                        className="flex items-center justify-between p-4 sm:p-6 rounded-xl sm:rounded-3xl border-2 border-slate-100 hover:border-primary hover:bg-teal-50 transition-all group"
                      >
                         <div className="flex items-center space-x-3 sm:space-x-6">
                            <div className="w-10 h-10 sm:w-16 sm:h-16 bg-pink-50 rounded-lg sm:rounded-2xl flex items-center justify-center text-pink-600 group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                               <Heart className="w-5 h-5 sm:w-8 sm:h-8" />
                            </div>
                            <div className="text-left">
                               <h3 className="text-base sm:text-xl font-bold text-secondary leading-tight">Sexual Wellness</h3>
                               <p className="text-[10px] sm:text-sm text-slate-500 mt-0.5">Personalized performance & libido optimization</p>
                            </div>
                         </div>
                         <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-slate-300 group-hover:text-primary transition-colors" />
                      </button>
                   </div>
                </div>
              )}

              {/* SHARED STEP 1: BASICS / GENDER */}
              {currentStep === 1 && (
                <div className="space-y-10">
                   <QuestionWrapper 
                        title="Tell us about yourself"
                        description="Select your biological gender and provide basic measurements."
                    >
                        <div className="space-y-8">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Gender Identification</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => setQuizData({...quizData, gender: 'male'})}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 transition-all group",
                                            quizData.gender === 'male' ? "border-primary bg-teal-50 text-primary" : "border-slate-100 hover:border-slate-200"
                                        )}
                                    >
                                        <Mars className={cn("w-8 h-8 sm:w-10 sm:h-10 mb-2", quizData.gender === 'male' ? "text-primary" : "text-slate-300 group-hover:text-slate-400")} />
                                        <span className="font-bold">Male</span>
                                    </button>
                                    <button 
                                        onClick={() => setQuizData({...quizData, gender: 'female'})}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 transition-all group",
                                            quizData.gender === 'female' ? "border-primary bg-teal-50 text-primary" : "border-slate-100 hover:border-slate-200"
                                        )}
                                    >
                                        <Venus className={cn("w-8 h-8 sm:w-10 sm:h-10 mb-2", quizData.gender === 'female' ? "text-primary" : "text-slate-300 group-hover:text-slate-400")} />
                                        <span className="font-bold">Female</span>
                                    </button>
                                </div>
                            </div>

                            {track === 'weight' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500">HEIGHT (FT)</label>
                                            <input type="number" placeholder="5" value={quizData.height_ft} onChange={(e) => setQuizData({...quizData, height_ft: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500">INCHES</label>
                                            <input type="number" placeholder="10" value={quizData.height_in} onChange={(e) => setQuizData({...quizData, height_in: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Weight (lbs)</label>
                                            <input type="number" placeholder="185" value={quizData.weight_lbs} onChange={(e) => setQuizData({...quizData, weight_lbs: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Goal Weight (lbs)</label>
                                            <input type="number" placeholder="150" value={quizData.goal_weight_lbs} onChange={(e) => setQuizData({...quizData, goal_weight_lbs: e.target.value})} className="w-full p-4 rounded-xl border border-primary/20 text-primary font-bold" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                   </QuestionWrapper>
                </div>
              )}

              {/* STEP 2: CONCERNS & GOALS */}
              {currentStep === 2 && (
                <div className="space-y-10">
                   {track === 'weight' ? (
                     <>
                        <QuestionWrapper title="Primary reason for weight loss?">
                            <SelectCard 
                                options={[
                                    { label: 'Live longer', value: 'live' },
                                    { label: 'Feel and look better', value: 'look' },
                                    { label: 'Reduce current health issues', value: 'health' },
                                    { label: 'All of these', value: 'all' },
                                ]}
                                selectedValue={quizData.primary_reason}
                                onChange={(v) => setQuizData({...quizData, primary_reason: v})}
                            />
                        </QuestionWrapper>
                        <QuestionWrapper title="Do you experience any of these?">
                            <MultiSelectGroup 
                                options={[
                                    { label: 'Low Libido', value: 'libido' },
                                    { label: 'Hair Loss', value: 'hair' },
                                    { label: 'Skin Issues', value: 'skin' },
                                    { label: 'Cognition Issues', value: 'focus' },
                                    { label: 'None', value: 'none' },
                                ]}
                                selectedValues={quizData.experienced_issues}
                                onChange={(v) => setQuizData({...quizData, experienced_issues: v})}
                            />
                        </QuestionWrapper>
                     </>
                   ) : (
                     <>
                        <QuestionWrapper 
                            title={quizData.gender === 'female' ? "Sexual Wellness Goals" : "Performance Goals"}
                            description="Select what you'd like to improve."
                        >
                            <MultiSelectGroup 
                                options={quizData.gender === 'female' ? [
                                    { label: 'Increased desire/libido', value: 'libido_f' },
                                    { label: 'Better overall satisfaction', value: 'satisfaction' },
                                    { label: 'Reduced vaginal dryness', value: 'dryness' },
                                    { label: 'Improved energy & mood', value: 'energy_f' },
                                    { label: 'Hormonal balance support', value: 'balance' },
                                ] : [
                                    { label: 'Harder, firmer erections', value: 'firmness' },
                                    { label: 'Lasting longer during sex', value: 'stamina' },
                                    { label: 'Increasing sex drive/libido', value: 'libido_m' },
                                    { label: 'Performance confidence', value: 'confidence' },
                                    { label: 'Faster recovery window', value: 'recovery' },
                                ]}
                                selectedValues={quizData.sexual_concerns}
                                onChange={(v) => setQuizData({...quizData, sexual_concerns: v})}
                            />
                        </QuestionWrapper>

                        {quizData.gender === 'male' && (
                            <QuestionWrapper title="How often do you have trouble maintaining an erection?">
                                <SelectCard 
                                    options={[
                                        { label: 'Never or rarely', value: 'never' },
                                        { label: 'Sometimes', value: 'sometimes' },
                                        { label: 'Most of the time', value: 'mostly' },
                                        { label: 'Always', value: 'always' },
                                    ]}
                                    selectedValue={quizData.ed_frequency}
                                    onChange={(v) => setQuizData({...quizData, ed_frequency: v})}
                                />
                            </QuestionWrapper>
                        )}
                        
                        {quizData.gender === 'female' && (
                            <QuestionWrapper title="Has your level of desire decreased recently?">
                                <SelectCard 
                                    options={[
                                        { label: 'Significantly decreased', value: 'severe' },
                                        { label: 'Somewhat decreased', value: 'moderate' },
                                        { label: 'Has not changed much', value: 'stable' },
                                        { label: 'I want to optimize higher', value: 'optim' },
                                    ]}
                                    selectedValue={quizData.libido_change}
                                    onChange={(v) => setQuizData({...quizData, libido_change: v})}
                                />
                            </QuestionWrapper>
                        )}
                     </>
                   )}
                </div>
              )}

              {/* STEP 3: MEDICAL REVIEW */}
              {currentStep === 3 && (
                <div className="space-y-10">
                   {track === 'weight' ? (
                     <>
                        <QuestionWrapper title="High-Risk Review">
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start space-x-3 mb-4">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] sm:text-xs text-amber-900 leading-relaxed font-medium">
                                    Kidney/Liver disease, active cancer, organ transplant, or severe GI disorders.
                                </p>
                            </div>
                            <SelectCard 
                                options={[
                                    { label: 'None apply', value: 'none' },
                                    { label: 'One or more apply', value: 'yes' },
                                ]}
                                selectedValue={quizData.high_risk_conditions.includes('yes') ? 'yes' : 'none'}
                                onChange={(v) => setQuizData({...quizData, high_risk_conditions: [v]})}
                            />
                        </QuestionWrapper>

                        <QuestionWrapper title="Other Health Conditions">
                            <MultiSelectGroup 
                                options={[
                                    { label: 'Gallbladder Disease', value: 'gall' },
                                    { label: 'Hypertension', value: 'htn' },
                                    { label: 'Sleep Apnea', value: 'sleep' },
                                    { label: 'Type 1/2 Diabetes', value: 'diab' },
                                    { label: 'Pancreatitis history', value: 'panc' },
                                    { label: 'Thyroid Carcinoma', value: 'thyroid' },
                                    { label: 'Depression', value: 'depr' },
                                ]}
                                selectedValues={quizData.other_conditions}
                                onChange={(v) => setQuizData({...quizData, other_conditions: v})}
                            />
                        </QuestionWrapper>
                     </>
                   ) : (
                     <>
                        <QuestionWrapper 
                            title="Medical Safety Screen"
                            description="Required for sexual health performance protocols."
                        >
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <p className="text-sm font-bold text-slate-700">Do you take any nitrate medications for chest pain? (e.g., Nitroglycerin)</p>
                                    <div className="flex space-x-3">
                                        <button onClick={() => setQuizData({...quizData, nitrate_use: 'yes'})} className={cn("flex-1 py-4 font-bold rounded-xl border-2 transition", quizData.nitrate_use === 'yes' ? "border-red-500 bg-red-50 text-red-600" : "border-slate-100")}>Yes</button>
                                        <button onClick={() => setQuizData({...quizData, nitrate_use: 'no'})} className={cn("flex-1 py-4 font-bold rounded-xl border-2 transition", quizData.nitrate_use === 'no' ? "border-primary bg-teal-50 text-primary" : "border-slate-100")}>No</button>
                                    </div>
                                </div>

                                <QuestionWrapper title="What is your average blood pressure?">
                                    <SelectCard 
                                        options={[
                                            { label: 'Low (< 90/60)', value: 'low' },
                                            { label: 'Normal (120/80)', value: 'normal' },
                                            { label: 'Elevated (130/80)', value: 'elevated' },
                                            { label: 'High (> 140/90)', value: 'high' },
                                            { label: 'I am not sure', value: 'unsure' },
                                        ]}
                                        selectedValue={quizData.blood_pressure_category}
                                        onChange={(v) => setQuizData({...quizData, blood_pressure_category: v})}
                                    />
                                </QuestionWrapper>

                                <QuestionWrapper title="Historical Heart Health">
                                    <p className="text-xs text-slate-500 mb-3">Any history of heart attack, stroke, or heart rhythm issues?</p>
                                    <div className="flex space-x-3">
                                        <button onClick={() => setQuizData({...quizData, heart_health_history: 'yes'})} className={cn("flex-1 py-4 font-bold rounded-xl border-2 transition", quizData.heart_health_history === 'yes' ? "border-red-500 bg-red-50 text-red-600" : "border-slate-100")}>Yes</button>
                                        <button onClick={() => setQuizData({...quizData, heart_health_history: 'no'})} className={cn("flex-1 py-4 font-bold rounded-xl border-2 transition", quizData.heart_health_history === 'no' ? "border-primary bg-teal-50 text-primary" : "border-slate-100")}>No</button>
                                    </div>
                                </QuestionWrapper>
                            </div>
                        </QuestionWrapper>
                     </>
                   )}
                </div>
              )}

              {/* STEP 4: LIFESTYLE & DETAILS */}
              {currentStep === 4 && (
                <div className="space-y-10">
                   {track === 'weight' ? (
                     <>
                        <QuestionWrapper title="Pace Preference">
                            <SelectCard 
                                options={[
                                    { label: '3.9 - 4.3 lbs/week (Standard)', value: 'standard' },
                                    { label: 'I want it faster', value: 'fast' },
                                    { label: 'That is too fast for me', value: 'slow' },
                                ]}
                                selectedValue={quizData.weight_loss_pace}
                                onChange={(v) => setQuizData({...quizData, weight_loss_pace: v})}
                            />
                        </QuestionWrapper>
                        <QuestionWrapper title="Priority Benefit">
                            <SelectCard 
                                options={[
                                    { label: 'Affordability', value: 'afford' },
                                    { label: 'Potency / Results', value: 'potent' },
                                ]}
                                selectedValue={quizData.primary_importance}
                                onChange={(v) => setQuizData({...quizData, primary_importance: v})}
                                columns={2}
                            />
                        </QuestionWrapper>
                     </>
                   ) : (
                     <>
                        {quizData.gender === 'female' && (
                            <QuestionWrapper title="Hormonal Milestone">
                                <SelectCard 
                                    options={[
                                        { label: 'Pre-menopause', value: 'pre' },
                                        { label: 'Peri-menopause', value: 'peri' },
                                        { label: 'Post-menopause', value: 'post' },
                                        { label: 'I have regular cycles', value: 'regular' },
                                    ]}
                                    selectedValue={quizData.menopause_status}
                                    onChange={(v) => setQuizData({...quizData, menopause_status: v})}
                                />
                            </QuestionWrapper>
                        )}
                        
                        <QuestionWrapper title="Current Medications">
                            <p className="text-sm text-slate-500 mb-3">List any medications or supplements you take daily.</p>
                            <textarea 
                                placeholder="e.g. Lisinopril, Multi-vitamin, etc."
                                value={quizData.current_meds}
                                onChange={(e) => setQuizData({...quizData, current_meds: e.target.value})}
                                className="w-full p-4 rounded-xl border border-slate-200 h-32 focus:ring-2 focus:ring-primary outline-none transition"
                            />
                        </QuestionWrapper>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <QuestionWrapper title="Motivation">
                                <SelectCard 
                                    options={[
                                        { label: 'I’m Ready!', value: 'ready' },
                                        { label: 'Feeling hopeful', value: 'hope' },
                                        { label: 'I am cautious', value: 'cautious' },
                                    ]}
                                    selectedValue={quizData.motivation_level}
                                    onChange={(v) => setQuizData({...quizData, motivation_level: v})}
                                />
                            </QuestionWrapper>
                            <QuestionWrapper title="Activity Level">
                                <SelectCard 
                                    options={[
                                        { label: 'Sedentary', value: 'low' },
                                        { label: 'Active', value: 'high' },
                                    ]}
                                    selectedValue={quizData.willing_to_increase_activity}
                                    onChange={(v) => setQuizData({...quizData, willing_to_increase_activity: v})}
                                />
                            </QuestionWrapper>
                        </div>
                     </>
                   )}
                </div>
              )}

              {/* STEP 5: ELIGIBILITY & SUBMISSION */}
              {currentStep === 5 && (
                <div className="space-y-10">
                   <div className="text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-secondary mb-2">Almost Done!</h2>
                      <p className="text-sm sm:text-base text-slate-500">Securely finalize your medical intake for provider review.</p>
                   </div>

                   <div className="space-y-8">
                        <QuestionWrapper title="Date of Birth">
                            <div className="grid grid-cols-3 gap-3">
                                <div><input type="number" placeholder="MM" value={quizData.dob_month} onChange={(e) => setQuizData({...quizData, dob_month: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 text-center" /></div>
                                <div><input type="number" placeholder="DD" value={quizData.dob_day} onChange={(e) => setQuizData({...quizData, dob_day: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 text-center" /></div>
                                <div><input type="number" placeholder="YYYY" value={quizData.dob_year} onChange={(e) => setQuizData({...quizData, dob_year: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 text-center" /></div>
                            </div>
                        </QuestionWrapper>
                        
                        <QuestionWrapper title="Contact Information">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">Secure Email</label>
                                    <input type="email" readOnly value={quizData.email} className="w-full p-4 rounded-xl border border-slate-100 bg-slate-100 text-slate-400" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500">Phone Number</label>
                                    <input type="tel" placeholder="(555) 000-0000" value={quizData.phone} onChange={(e) => setQuizData({...quizData, phone: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                            </div>
                        </QuestionWrapper>
                   </div>

                   <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-start space-x-3 text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 shrink-0 mt-0.5" />
                            <p>
                                By submitting this intake, you authorize our medical providers to review your health information for clinical appropriateness. All data is encrypted and HIPAA-compliant.
                            </p>
                        </div>
                   </div>
                </div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            {currentStep > 0 && (
              <div className="mt-8 sm:mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
                <button onClick={handlePrevious} className="flex items-center space-x-2 text-slate-400 font-bold hover:text-secondary p-2 transition">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                
                {currentStep < 5 ? (
                  <Button onClick={handleNext} className="px-8 sm:px-12 py-3.5 sm:py-5 h-auto text-sm sm:text-base">
                     Next step
                     <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting} 
                    className="px-10 sm:px-14 py-3.5 sm:py-5 h-auto bg-primary hover:bg-teal-400 shadow-lg shadow-teal-100"
                  >
                    {isSubmitting ? "Submitting Intake..." : "Finish My Evaluation"}
                  </Button>
                )}
              </div>
            )}
          </motion.div>
          {/* Mobile Spacer */}
          <div className="h-10 sm:hidden" />
        </div>
      </div>
    </div>
  );
}