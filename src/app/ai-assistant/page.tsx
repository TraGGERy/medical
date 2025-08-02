'use client';

import { useState } from 'react';

export default function AIHealthAssistant() {
  const [activeTab, setActiveTab] = useState<'analyze' | 'report'>('analyze');
  const [symptoms, setSymptoms] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [healthReport, setHealthReport] = useState('');

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const symptomsArray = symptoms.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      const response = await fetch('/api/ai/analyze-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: symptomsArray,
          additionalInfo: 'User requested analysis from AI Health Assistant'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze symptoms');
      }

      const data = await response.json();
      setAnalysisResult(data.analysis);
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      alert('Failed to analyze symptoms. Please check your API configuration.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateHealthReport = async () => {
    if (!analysisResult) return;
    
    setIsGeneratingReport(true);
    try {
      const response = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: symptoms.split(',').map(s => s.trim()).filter(s => s.length > 0),
          medicalHistory: 'User medical history from profile',
          analysisResults: JSON.stringify(analysisResult)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setHealthReport(data.report);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate health report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'emergency': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            AI Health Assistant
          </h1>
          <p className="text-gray-600 text-lg">
            Powered by Gemini 2.5 Pro - Your intelligent health companion
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border mb-6">
          <div className="flex flex-wrap border-b border-gray-200">
            <button
              onClick={() => setActiveTab('analyze')}
              className={`px-6 py-4 font-medium text-sm sm:text-base transition-colors ${
                activeTab === 'analyze'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🔍 Symptom Analysis
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-6 py-4 font-medium text-sm sm:text-base transition-colors ${
                activeTab === 'report'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📋 Health Reports
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'analyze' && (
          <div className="space-y-6">
            {/* Symptom Input */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Symptom Analysis
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your symptoms (separate with commas)
                  </label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g., headache, fever, fatigue, nausea"
                    className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <button
                  onClick={analyzeSymptoms}
                  disabled={!symptoms.trim() || isAnalyzing}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                    !symptoms.trim() || isAnalyzing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-teal-500 text-white hover:shadow-lg hover:scale-105'
                  }`}
                >
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing with Gemini AI...
                    </div>
                  ) : (
                    '🚀 Analyze Symptoms'
                  )}
                </button>
              </div>
            </div>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Analysis Results</h3>
                
                {/* Urgency Level */}
                <div className={`p-4 rounded-xl border mb-4 ${getUrgencyColor(analysisResult.urgencyLevel)}`}>
                  <div className="font-semibold mb-1">
                    Urgency Level: {analysisResult.urgencyLevel.toUpperCase()}
                  </div>
                </div>

                {/* Analysis */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-2">Analysis:</h4>
                  <p className="text-gray-700 whitespace-pre-line">{analysisResult.analysis}</p>
                </div>

                {/* Possible Conditions */}
                {analysisResult.possibleConditions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-2">Possible Conditions:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analysisResult.possibleConditions.map((condition: string, index: number) => (
                        <li key={index} className="text-gray-700">{condition}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {analysisResult.recommendations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-2">Recommendations:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analysisResult.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-gray-700">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800">{analysisResult.disclaimer}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-6">
            {/* Generate Report */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Generate Health Report
              </h2>
              <p className="text-gray-600 mb-4">
                Generate a comprehensive health report based on your symptom analysis.
              </p>
              <button
                onClick={generateHealthReport}
                disabled={!analysisResult || isGeneratingReport}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                  !analysisResult || isGeneratingReport
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:shadow-lg hover:scale-105'
                }`}
              >
                {isGeneratingReport ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating Report...
                  </div>
                ) : (
                  '📋 Generate Health Report'
                )}
              </button>
              {!analysisResult && (
                <p className="text-sm text-gray-500 mt-2">
                  Please analyze symptoms first to generate a report.
                </p>
              )}
            </div>

            {/* Health Report */}
            {healthReport && (
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Health Report</h3>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                    {healthReport}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      const blob = new Blob([healthReport], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `health-report-${new Date().toISOString().split('T')[0]}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    📥 Download Report
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Features Overview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">AI-Powered Chat</h3>
            <p className="text-sm text-gray-600">
              Get instant answers about your health with our Gemini 2.5 Pro powered assistant
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Symptom Analysis</h3>
            <p className="text-sm text-gray-600">
              Advanced AI analysis of your symptoms with urgency assessment and recommendations
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Health Reports</h3>
            <p className="text-sm text-gray-600">
              Generate comprehensive health reports based on your symptoms and medical history
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}