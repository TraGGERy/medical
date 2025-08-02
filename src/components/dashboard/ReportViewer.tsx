'use client';

import React, { useState } from 'react';
import { generateHealthReportPDF } from '@/lib/utils/pdfGenerator';

interface Report {
  id: string;
  date: string;
  time: string;
  condition: string;
  status: 'Normal' | 'Attention' | 'Urgent';
  riskLevel: 'Low' | 'Medium' | 'High';
  summary: string;
  confidence: number;
  negligenceAssessment?: string | null;
}

interface ReportViewerProps {
  report: Report | null;
  onBack: () => void;
}

export default function ReportViewer({ report, onBack }: ReportViewerProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!report) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No report selected</h3>
        <button onClick={onBack} className="text-blue-600 hover:text-blue-700">
          Go back to history
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal': return 'bg-green-100 text-green-800 border-green-200';
      case 'Attention': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'High': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const downloadPDF = () => {
    try {
      generateHealthReportPDF(report);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const shareWithDoctor = () => {
    const emailBody = `Health Report Summary:\n\nCondition: ${report.condition}\nDate: ${report.date}\nStatus: ${report.status}\nRisk Level: ${report.riskLevel}\nConfidence: ${report.confidence}%\n\nSummary: ${report.summary}`;
    const mailtoLink = `mailto:?subject=Health Report - ${report.condition}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{report.condition}</h1>
            <p className="text-gray-600">{report.date} at {report.time}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={downloadPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            📥 Download PDF
          </button>
          <button
            onClick={shareWithDoctor}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            📤 Share with Doctor
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`inline-flex px-4 py-2 rounded-full border font-medium ${getStatusColor(report.status)}`}>
              {report.status}
            </div>
            <p className="text-sm text-gray-600 mt-2">Overall Status</p>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getRiskColor(report.riskLevel)}`}>
              {report.riskLevel}
            </div>
            <p className="text-sm text-gray-600 mt-2">Risk Level</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {report.confidence}%
            </div>
            <p className="text-sm text-gray-600 mt-2">AI Confidence</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto px-4 sm:px-6">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'analysis', label: 'Analysis', icon: '🔍' },
              { id: 'recommendations', label: 'Recommendations', icon: '💡' },
              ...(report.negligenceAssessment ? [{ id: 'negligence', label: 'Negligence Assessment', icon: '⚖️' }] : []),
              { id: 'charts', label: 'Charts', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-1 sm:mr-2">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Summary</h3>
                <p className="text-gray-700 leading-relaxed">{report.summary}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Findings</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">✓</span>
                    <span className="text-gray-700">No immediate life-threatening conditions detected</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-1">ℹ️</span>
                    <span className="text-gray-700">Symptoms align with common stress-related conditions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-500 mr-2 mt-1">⚠️</span>
                    <span className="text-gray-700">Monitor symptoms for any changes or worsening</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Symptom Analysis</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Primary Symptoms</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Headache (tension-type)</li>
                        <li>• Mild fatigue</li>
                        <li>• Stress indicators</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Contributing Factors</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Work-related stress</li>
                        <li>• Poor sleep patterns</li>
                        <li>• Dehydration possible</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Differential Diagnosis</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-gray-800">Tension Headache</span>
                    <span className="text-green-600 font-semibold">85% Match</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="font-medium text-gray-800">Stress-related Fatigue</span>
                    <span className="text-yellow-600 font-semibold">72% Match</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-800">Dehydration</span>
                    <span className="text-gray-600 font-semibold">45% Match</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Immediate Actions</h3>
                <div className="space-y-3">
                  <div className="flex items-start p-4 bg-blue-50 rounded-xl">
                    <span className="text-blue-600 text-xl mr-3">💧</span>
                    <div>
                      <h4 className="font-medium text-gray-800">Stay Hydrated</h4>
                      <p className="text-sm text-gray-600">Drink plenty of water throughout the day</p>
                    </div>
                  </div>
                  <div className="flex items-start p-4 bg-green-50 rounded-xl">
                    <span className="text-green-600 text-xl mr-3">😴</span>
                    <div>
                      <h4 className="font-medium text-gray-800">Rest and Relaxation</h4>
                      <p className="text-sm text-gray-600">Take breaks and ensure adequate sleep</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">When to Seek Medical Care</h3>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h4 className="font-medium text-red-800 mb-2">Contact a doctor if:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Headache becomes severe or sudden</li>
                    <li>• Symptoms worsen or persist beyond 48 hours</li>
                    <li>• New symptoms develop</li>
                    <li>• You experience fever, vision changes, or confusion</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'negligence' && report.negligenceAssessment && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xl">⚖️</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Medical Negligence Assessment</h3>
                    <p className="text-sm text-red-700 mb-4">
                      This assessment is based on uploaded medical reports and identifies potential areas of concern in previous medical care. 
                      This analysis is for educational purposes only and should not be considered legal advice.
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <h4 className="font-medium text-gray-800 mb-3">Assessment Details:</h4>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    {report.negligenceAssessment.split('\n').map((paragraph, index) => (
                      paragraph.trim() && (
                        <p key={index} className="mb-2 leading-relaxed">
                          {paragraph.trim()}
                        </p>
                      )
                    ))}
                  </div>
                </div>

                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-600 text-lg">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium text-yellow-800 mb-2">Important Legal Notice</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• This assessment is for educational and informational purposes only</li>
                        <li>• It does not constitute legal advice or a formal medical opinion</li>
                        <li>• If you suspect medical negligence, consult with a qualified medical malpractice attorney</li>
                        <li>• Consider obtaining an independent medical expert review</li>
                        <li>• Be aware of statute of limitations for medical malpractice claims in your jurisdiction</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium">
                    📞 Find Legal Consultation
                  </button>
                  <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    🏥 Get Second Medical Opinion
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'charts' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Risk Assessment</h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Overall Risk</span>
                        <span className="text-sm text-gray-600">Low (15%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Urgency Level</span>
                        <span className="text-sm text-gray-600">Low (20%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">AI Confidence</span>
                        <span className="text-sm text-gray-600">High ({report.confidence}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${report.confidence}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Symptom Severity Timeline</h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📈</div>
                    <p>Interactive charts would be displayed here</p>
                    <p className="text-sm">Showing symptom progression over time</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}