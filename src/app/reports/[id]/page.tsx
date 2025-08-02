'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle,
  Download,
  Share2,
  User,
  Activity,
  FileText,
  Heart,
  Brain,
  Stethoscope
} from 'lucide-react';
import { generateHealthReportPDF } from '@/lib/utils/pdfGenerator';

interface DetailedHealthReport {
  id: string;
  title: string;
  date: string;
  time: string;
  status: 'Normal' | 'Attention' | 'Urgent';
  riskLevel: 'Low' | 'Medium' | 'High';
  confidence: number;
  urgencyLevel: number;
  followUpRequired: boolean;
  doctorRecommended: boolean;
  symptoms: Array<string | { name: string; [key: string]: unknown }>;
  aiAnalysis: {
    analysis?: string;
    diagnosis?: string;
    summary?: string;
    negligenceAssessment?: string;
    [key: string]: unknown;
  } | string;
  recommendations: string[];
  createdAt: string;
  updatedAt: string;
}

const ReportViewPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  
  const [report, setReport] = useState<DetailedHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/health-reports/${reportId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Report not found');
          }
          throw new Error('Failed to fetch report');
        }

        const data = await response.json();
        setReport(data.report);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Normal': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Attention': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'Urgent': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

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
      case 'Low': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'High': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    try {
      // Convert the detailed report to the format expected by the PDF generator
      const pdfReport = {
        id: report.id,
        condition: report.title,
        date: report.date,
        time: report.time,
        status: report.status,
        riskLevel: report.riskLevel,
        confidence: report.confidence,
        summary: `Risk Level: ${report.riskLevel} | Follow-up Required: ${report.followUpRequired ? 'Yes' : 'No'} | Doctor Recommended: ${report.doctorRecommended ? 'Yes' : 'No'}`,
        symptoms: Array.isArray(report.symptoms) 
          ? report.symptoms.map((symptom: string | { name: string; [key: string]: unknown }) => typeof symptom === 'string' ? symptom : symptom.name || 'Unknown symptom').join(', ')
          : report.symptoms,
        aiAnalysis: typeof report.aiAnalysis === 'object' ? JSON.stringify(report.aiAnalysis, null, 2) : report.aiAnalysis,
        recommendations: Array.isArray(report.recommendations) 
          ? report.recommendations.join('\n• ')
          : report.recommendations,
        urgencyLevel: report.urgencyLevel,
        createdAt: report.createdAt
      };
      
      generateHealthReportPDF(pdfReport);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const shareReport = async () => {
    if (!report) return;
    
    setIsSharing(true);
    
    try {
      // Get the current URL
      const reportUrl = window.location.href;
      const shareTitle = `Health Report - ${report.title}`;
      const shareText = `Check out this health report: ${report.title}\nDate: ${report.date}\nStatus: ${report.status}\nRisk Level: ${report.riskLevel}`;
      
      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: reportUrl
        });
      } else {
        // Fallback to copying URL to clipboard
        await navigator.clipboard.writeText(reportUrl);
        
        // Show success message
        const originalText = document.querySelector('[data-share-button]')?.textContent;
        const shareButton = document.querySelector('[data-share-button]');
        if (shareButton) {
          shareButton.textContent = 'URL Copied!';
          setTimeout(() => {
            shareButton.textContent = originalText || 'Share';
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      // Show error message
      alert('Failed to share report. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Report</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Report Not Found</h1>
          <p className="text-gray-600 mb-4">The requested report could not be found.</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to History
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{report.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{report.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{report.time}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={shareReport}
                disabled={isSharing}
                data-share-button
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSharing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Share
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(report.status)}
              <h3 className="font-semibold text-gray-800">Status</h3>
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(report.status)}`}>
              {report.status}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Risk Level</h3>
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(report.riskLevel)}`}>
              {report.riskLevel}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-800">AI Confidence</h3>
            </div>
            <div className="text-2xl font-bold text-gray-800">{report.confidence}%</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Symptoms */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <Stethoscope className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-800">Reported Symptoms</h2>
            </div>
            <div className="space-y-2">
              {report.symptoms.length > 0 ? (
                report.symptoms.map((symptom: string | { name: string; [key: string]: unknown }, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-700">
                      {typeof symptom === 'string' ? symptom : symptom.name || 'Unknown symptom'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No symptoms recorded</p>
              )}
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-800">AI Analysis</h2>
            </div>
            <div className="prose prose-sm max-w-none">
              {typeof report.aiAnalysis === 'object' && report.aiAnalysis ? (
                <div className="space-y-3">
                  {report.aiAnalysis.analysis && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-1">Analysis:</h4>
                      <p className="text-gray-600">{report.aiAnalysis.analysis}</p>
                    </div>
                  )}
                  {report.aiAnalysis.diagnosis && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-1">Diagnosis:</h4>
                      <p className="text-gray-600">{report.aiAnalysis.diagnosis}</p>
                    </div>
                  )}
                  {report.aiAnalysis.summary && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-1">Summary:</h4>
                      <p className="text-gray-600">{report.aiAnalysis.summary}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No detailed analysis available</p>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-800">Recommendations</h2>
          </div>
          <div className="space-y-3">
            {report.recommendations.length > 0 ? (
              report.recommendations.map((recommendation: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">{recommendation}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No specific recommendations provided</p>
            )}
          </div>
        </div>

        {/* Negligence Assessment */}
        {typeof report.aiAnalysis === 'object' && report.aiAnalysis && 'negligenceAssessment' in report.aiAnalysis && report.aiAnalysis.negligenceAssessment && (
          <div className="mt-8 bg-red-50 rounded-lg p-6 shadow-sm border border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-semibold text-red-800">Medical Negligence Assessment</h2>
            </div>
            
            <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700 mb-2">
                <strong>Important Legal Disclaimer:</strong>
              </p>
              <p className="text-sm text-red-700 mb-4">
                This assessment is based on uploaded medical reports and identifies potential areas of concern in previous medical care. 
                This analysis is for educational purposes only and should not be considered legal advice.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <h4 className="font-medium text-gray-800 mb-3">Assessment Details:</h4>
              <div className="prose prose-sm max-w-none text-gray-700">
                {(report.aiAnalysis as any).negligenceAssessment.split('\n').map((paragraph: string, index: number) => (
                  paragraph.trim() && (
                    <p key={index} className="mb-2 leading-relaxed">
                      {paragraph.trim()}
                    </p>
                  )
                ))}
              </div>
            </div>
            
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium">
                📞 Find Legal Consultation
              </button>
              <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                🩺 Get Second Medical Opinion
              </button>
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-800 mb-3">Follow-up Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Follow-up Required:</span>
                <span className={`font-medium ${report.followUpRequired ? 'text-orange-600' : 'text-green-600'}`}>
                  {report.followUpRequired ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Doctor Recommended:</span>
                <span className={`font-medium ${report.doctorRecommended ? 'text-red-600' : 'text-green-600'}`}>
                  {report.doctorRecommended ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Urgency Level:</span>
                <span className="font-medium text-gray-800">{report.urgencyLevel}/5</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-800 mb-3">Report Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Report ID:</span>
                <span className="font-mono text-gray-800">{report.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-800">{new Date(report.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="text-gray-800">{new Date(report.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportViewPage;