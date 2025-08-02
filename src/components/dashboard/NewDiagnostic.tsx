'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HealthAnalysisResponse, FullDiagnosticResponse } from '@/lib/services/geminiService';

interface NewDiagnosticProps {
  onComplete: () => void;
}

interface BasicAnalysisData {
  analysis: HealthAnalysisResponse;
}

interface FullDiagnosticData {
  analysis: FullDiagnosticResponse;
}

export default function NewDiagnostic({ onComplete }: NewDiagnosticProps) {
  const router = useRouter();
  const [diagnosticType, setDiagnosticType] = useState<'basic' | 'full'>('basic');
  const [aiModel, setAiModel] = useState<'gemini' | 'o3'>('gemini');
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    
    try {
      // Prepare symptoms array from the text input
      const symptomsArray = symptoms.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      if (diagnosticType === 'full') {
        // Handle full diagnostic with file uploads
        const formData = new FormData();
        formData.append('symptoms', symptoms);
        formData.append('duration', duration);
        formData.append('severity', severity);
        formData.append('additionalInfo', additionalInfo);
        formData.append('aiModel', aiModel);
        
        // Add uploaded files
        uploadedFiles.forEach(file => {
          formData.append('files', file);
        });

        const response = await fetch('/api/ai/full-diagnostic', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to perform full diagnostic analysis');
        }

        const data = await response.json();
        await displayFullDiagnosticResults(data);
      } else {
        // Handle basic diagnostic (existing logic)
        const analysisRequest = {
          symptoms: symptomsArray,
          duration,
          severity,
          additionalInfo,
          aiModel
        };

        const apiEndpoint = aiModel === 'o3' 
          ? '/api/ai/analyze-symptoms-o3' 
          : '/api/ai/analyze-symptoms';

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(analysisRequest),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze symptoms');
        }

        const data = await response.json();
        await displayBasicResults(data);
      }
      
      onComplete();
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      const modelName = aiModel === 'o3' ? 'OpenAI O3' : 'Gemini';
      alert(`Failed to analyze symptoms with ${modelName}. Please check that your API key is configured and try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveReportAndRedirect = async (analysisData: HealthAnalysisResponse | FullDiagnosticResponse, diagnosticType: 'basic' | 'full') => {
    setIsSavingReport(true);
    try {
      // Handle different response types
      const isFullDiagnostic = 'redFlags' in analysisData;
      
      const reportData = {
        title: `${diagnosticType === 'basic' ? 'Basic' : 'Comprehensive'} Health Analysis - ${new Date().toLocaleDateString()}`,
        symptoms: symptoms.split(',').map(s => s.trim()).filter(s => s.length > 0),
        aiAnalysis: {
          analysis: analysisData.analysis,
          possibleConditions: analysisData.possibleConditions,
          redFlags: isFullDiagnostic ? (analysisData as FullDiagnosticResponse).redFlags : '',
          documentAnalysis: isFullDiagnostic ? (analysisData as FullDiagnosticResponse).documentAnalysis : '',
          negligenceAssessment: isFullDiagnostic ? (analysisData as FullDiagnosticResponse).negligenceAssessment : null,
          disclaimer: analysisData.disclaimer,
          diagnosticType: diagnosticType
        },
        urgencyLevel: analysisData.urgencyLevel,
        confidence: 85, // Default confidence since it's not in the response interfaces
        recommendations: analysisData.recommendations || [],
        followUpRequired: analysisData.urgencyLevel === 'high' || analysisData.urgencyLevel === 'emergency',
        doctorRecommended: analysisData.urgencyLevel === 'emergency'
      };

      console.log('Sending report data:', reportData);

      const response = await fetch('/api/health-reports/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to save report');
      }

      const result = await response.json();
      console.log('Save result:', result);
      
      // Redirect to the new report page
      router.push(`/reports/${result.reportId}`);
      
    } catch (error) {
      console.error('Error saving report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Analysis completed but failed to save report. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSavingReport(false);
    }
  };

  const displayBasicResults = async (data: BasicAnalysisData) => {
    const analysisResult = data.analysis;
    await saveReportAndRedirect(analysisResult, 'basic');
  };

  const displayFullDiagnosticResults = async (data: FullDiagnosticData) => {
    const analysis = data.analysis;
    await saveReportAndRedirect(analysis, 'full');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">New Health Diagnostic</h1>
        <p className="text-gray-600">Get AI-powered insights about your symptoms</p>
      </div>

      {/* Diagnostic Type Selection */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Choose Diagnostic Type</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div 
            onClick={() => setDiagnosticType('basic')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              diagnosticType === 'basic' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-600 text-sm">⚡</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-sm">Basic Check</h3>
                <p className="text-xs text-gray-600">Quick analysis • 2 minutes • Free</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setDiagnosticType('full')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              diagnosticType === 'full' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-purple-600 text-sm">🔍</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-sm">Full Diagnostic</h3>
                <p className="text-xs text-gray-600">Comprehensive • Lab reports • Detailed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Symptom Input Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6 space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Describe Your Symptoms</h2>
        
        {/* AI Model Selection (for Basic Check only) */}
        {diagnosticType === 'basic' && (
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              AI Model
            </label>
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value as 'gemini' | 'o3')}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
            >
              <option value="gemini">🧠 Gemini 2.5 Pro - Comprehensive medical analysis</option>
              <option value="o3">🚀 OpenAI O3 - Advanced reasoning & quick checks</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {aiModel === 'gemini' 
                ? 'Google\'s proven AI with extensive medical knowledge base' 
                : 'OpenAI\'s latest model with advanced reasoning capabilities'
              }
            </p>
          </div>
        )}
        
        {/* Main Symptoms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What symptoms are you experiencing? *
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            required
            placeholder="Please describe your symptoms in detail..."
            className="w-full h-32 p-4 border border-gray-300 text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Duration and Severity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How long have you had these symptoms?
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full text-black p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select duration</option>
              <option value="less-than-day">Less than a day</option>
              <option value="1-3-days">1-3 days</option>
              <option value="1-week">About a week</option>
              <option value="1-month">About a month</option>
              <option value="more-than-month">More than a month</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How severe are your symptoms?
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full text-black p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select severity</option>
              <option value="mild">Mild - Barely noticeable</option>
              <option value="moderate">Moderate - Noticeable but manageable</option>
              <option value="severe">Severe - Significantly affecting daily life</option>
              <option value="extreme">Extreme - Unbearable</option>
            </select>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Additional Information (Optional)
          </label>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="Any other relevant information, triggers, or patterns you've noticed..."
            className="w-full h-24 p-4  text-black border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* File Upload (for Full Diagnostic) */}
        {diagnosticType === 'full' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Lab Reports or Medical Documents (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-4xl mb-2">📁</div>
                <p className="text-gray-600 mb-2">Click to upload files or drag and drop</p>
                <p className="text-sm text-gray-500">PDF, JPG, PNG, DOC up to 10MB each</p>
              </label>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-blue-600 mr-2">📄</span>
                      <span className="text-sm text-gray-700">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col gap-3 sm:gap-4 pt-4">
          <button
            type="submit"
            disabled={!symptoms.trim() || isAnalyzing || isSavingReport}
            className={`w-full py-3 px-4 sm:px-6 rounded-xl font-semibold transition-all text-sm sm:text-base ${
              !symptoms.trim() || isAnalyzing || isSavingReport
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-teal-500 text-white hover:shadow-lg hover:scale-105'
            }`}
          >
            {isAnalyzing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                Analyzing Symptoms...
              </div>
            ) : isSavingReport ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                Saving Report...
              </div>
            ) : (
              `🚀 Start ${diagnosticType === 'basic' ? 'Basic' : 'Full'} Analysis`
            )}
          </button>
          
          <button
            type="button"
            onClick={onComplete}
            className="w-full px-4 sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
        <div className="flex items-start">
          <span className="text-yellow-600 text-xl mr-3">⚠️</span>
          <div>
            <h3 className="font-semibold text-yellow-800 mb-1">Medical Disclaimer</h3>
            <p className="text-sm text-yellow-700">
              This AI diagnostic tool is for informational purposes only and should not replace professional medical advice. 
              Always consult with a healthcare provider for medical concerns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}