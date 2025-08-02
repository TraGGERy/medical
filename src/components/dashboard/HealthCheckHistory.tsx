'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { generateHealthReportPDF } from '@/lib/utils/pdfGenerator';
import { HealthAnalysisResponse, FullDiagnosticResponse } from '@/lib/services/geminiService';

interface AiAnalysis {
  analysis?: string;
  possibleConditions?: string[];
  redFlags?: string;
  documentAnalysis?: string;
  negligenceAssessment?: string | null;
  disclaimer?: string;
  diagnosticType?: 'basic' | 'full';
}

interface HealthReport {
  id: string;
  date: string;
  time: string;
  condition: string;
  status: 'Normal' | 'Attention' | 'Urgent';
  riskLevel: 'Low' | 'Medium' | 'High';
  summary: string;
  confidence: number;
  symptoms?: string[];
  aiAnalysis?: AiAnalysis;
  recommendations?: string[];
  urgencyLevel?: number;
  followUpRequired?: boolean;
  doctorRecommended?: boolean;
  fullReport?: HealthAnalysisResponse | FullDiagnosticResponse;
}

interface HealthCheckHistoryProps {
  onViewReport?: (reportId: string) => void; // Made optional for backward compatibility
}

const HealthCheckHistory: React.FC<HealthCheckHistoryProps> = ({ onViewReport }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0
  });
  const reportsPerPage = 5;

  // Handle view report - use router navigation or fallback to prop
  const handleViewReport = (reportId: string) => {
    if (onViewReport) {
      onViewReport(reportId);
    } else {
      router.push(`/reports/${reportId}`);
    }
  };

  // Fetch reports from API
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: reportsPerPage.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/health-reports?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.reports || []);
      setPagination(data.pagination || {
        page: 1,
        limit: reportsPerPage,
        total: 0,
        totalPages: 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm, reportsPerPage]);

  // Load reports on component mount and when filters change
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchReports();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchReports]);

  // Use only fetched reports from the database
  const displayReports = reports;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal': return 'bg-green-100 text-green-800';
      case 'Attention': return 'bg-yellow-100 text-yellow-800';
      case 'Urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const downloadReport = (report: HealthReport) => {
    try {
      generateHealthReportPDF({
        ...report,
        aiAnalysis: report.aiAnalysis ? {
          ...report.aiAnalysis,
          [report.aiAnalysis.diagnosticType || 'basic']: report.aiAnalysis
        } : undefined
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const shareReport = (report: HealthReport) => {
    if (navigator.share) {
      navigator.share({
        title: `Health Report - ${report.condition}`,
        text: report.summary,
        url: window.location.href
      });
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(`Health Report - ${report.condition}\n${report.summary}`);
      alert('Report details copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Health Check History</h1>
          <p className="text-gray-600">View and manage your diagnostic reports</p>
        </div>
        <div className="text-sm text-gray-500">
          Total Reports: {pagination.total || displayReports.length}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          >
            <option value="all">All Status</option>
            <option value="normal">Normal</option>
            <option value="attention">Attention</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your health reports...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Reports</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Reports List */}
      {!loading && !error && (
        <div className="space-y-3 sm:space-y-4">
          {displayReports.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">{report.condition}</h3>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium self-start ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3 text-sm sm:text-base">{report.summary}</p>
                  
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    <span>📅 {report.date} at {report.time}</span>
                    <span className={`font-medium ${getRiskColor(report.riskLevel)}`}>
                      🎯 {report.riskLevel} Risk
                    </span>
                    <span>🎯 {report.confidence}% Confidence</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleViewReport(report.id)}
                    className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                  >
                    View Report Please
                  </button>
                  <button
                    onClick={() => downloadReport(report)}
                    className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                  >
                    📥 Download
                  </button>
                  <button
                    onClick={() => shareReport(report)}
                    className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                  >
                    📤 Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && displayReports.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No reports found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Start your first health check to see reports here'
            }
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
            disabled={currentPage === pagination.totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default HealthCheckHistory;