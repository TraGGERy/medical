'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Stethoscope, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Shield,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function HealthCheckPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [additionalInfo, setAdditionalInfo] = useState({
    duration: '',
    severity: '',
    previousConditions: ''
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-up');
    }
  }, [isSignedIn, isLoaded, router]);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      alert('Analysis complete! Your report is being generated...');
    }, 3000);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    { number: 1, title: 'Symptoms', icon: Stethoscope },
    { number: 2, title: 'Details', icon: AlertCircle },
    { number: 3, title: 'Analysis', icon: Brain }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            AI Health Check
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get instant AI-powered insights about your symptoms with our advanced diagnostic assistant
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300',
                      isActive && 'bg-blue-600 text-white shadow-lg scale-110',
                      isCompleted && 'bg-green-600 text-white',
                      !isActive && !isCompleted && 'bg-gray-200 text-gray-500'
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={cn(
                      'text-sm font-medium mt-2 transition-colors',
                      isActive && 'text-blue-600',
                      isCompleted && 'text-green-600',
                      !isActive && !isCompleted && 'text-gray-500'
                    )}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      'w-16 h-0.5 mx-4 transition-colors',
                      currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                    )}></div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="backdrop-blur-xl border-white/20 bg-white/80">
            <div className="p-8">
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                      <Stethoscope className="w-6 h-6 mr-2 text-blue-600" />
                      Describe Your Symptoms
                    </h2>
                    <p className="text-gray-600">Please provide a detailed description of what you&apos;re experiencing</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Symptoms *
                      </label>
                      <textarea
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        placeholder="Describe your symptoms in detail (e.g., headache, fever, fatigue, pain location, etc.)"
                        className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-white/50 backdrop-blur-sm"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                      <AlertCircle className="w-6 h-6 mr-2 text-blue-600" />
                      Additional Information
                    </h2>
                    <p className="text-gray-600">Help us provide more accurate insights</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration
                      </label>
                      <div className="relative">
                        <Clock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                          value={additionalInfo.duration}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdditionalInfo({...additionalInfo, duration: e.target.value})}
                          placeholder="How long have you had these symptoms?"
                          className="pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Severity Level
                      </label>
                      <select
                        value={additionalInfo.severity}
                        onChange={(e) => setAdditionalInfo({...additionalInfo, severity: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                      >
                        <option value="">Select severity</option>
                        <option value="mild">Mild (1-3)</option>
                        <option value="moderate">Moderate (4-6)</option>
                        <option value="severe">Severe (7-10)</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Previous Medical Conditions
                      </label>
                      <textarea
                        value={additionalInfo.previousConditions}
                        onChange={(e) => setAdditionalInfo({...additionalInfo, previousConditions: e.target.value})}
                        placeholder="Any relevant medical history or current medications?"
                        className="w-full h-24 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white/50 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-center">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                        <Brain className="w-6 h-6 mr-2 text-blue-600" />
                        AI Analysis
                      </h2>
                      <p className="text-gray-600">Ready to analyze your symptoms with advanced AI</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                      <div className="flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
                      <div className="text-left space-y-2 text-sm text-gray-700">
                        <p><strong>Symptoms:</strong> {symptoms || 'Not specified'}</p>
                        <p><strong>Duration:</strong> {additionalInfo.duration || 'Not specified'}</p>
                        <p><strong>Severity:</strong> {additionalInfo.severity || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleAnalyze}
                      size="lg"
                      disabled={isAnalyzing || !symptoms.trim()}
                      className="w-full md:w-auto"
                    >
                      {isAnalyzing ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Analyzing with AI...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Brain className="w-5 h-5 mr-2" />
                          Start AI Analysis
                        </div>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className={currentStep === 1 ? 'invisible' : ''}
                >
                  Previous
                </Button>
                
                {currentStep < 3 && (
                  <Button
                    onClick={handleNext}
                    disabled={currentStep === 1 && !symptoms.trim()}
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Disclaimer */}
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="bg-amber-50 border-amber-200 shadow-lg">
            <div className="p-4 flex items-start space-x-3">
              <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1">Medical Disclaimer</h4>
                <p className="text-sm text-amber-700">
                  This AI analysis is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for medical concerns.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}