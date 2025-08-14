'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Share2, 
  Eye, 
  Calendar, 
  Clock, 
  User, 
  Bot,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ConsultationReport {
  id: string;
  patientId: string;
  aiProviderId: string;
  status: 'active' | 'completed' | 'cancelled';
  reasonForVisit: string;
  symptoms: string[];
  urgencyLevel: number;
  patientAge?: number;
  patientGender?: string;
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  aiAssessment?: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    assessment: string;
    recommendations: string[];
    followUpInstructions: string[];
    redFlags: string[];
    consultationSummary: {
      duration: string;
      aiProvider: string;
      specialty: string;
      startTime: string;
      endTime: string;
    };
  };
  messageCount: number;
  totalCost: string;
  durationMinutes?: number;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  aiProvider: {
    id: string;
    name: string;
    specialty: string;
    profileImageUrl?: string;
    rating: string;
  };
}

interface ConsultationHistoryProps {
  onViewReport?: (reportId: string) => void;
  onResumeChat?: (consultationId: string) => void;
}

const ConsultationHistory: React.FC<ConsultationHistoryProps> = ({ onViewReport, onResumeChat }) => {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [consultations, setConsultations] = useState<ConsultationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0
  });
  const reportsPerPage = 5;

  // Handle view report
  const handleViewReport = async (reportId: string) => {
    setViewingReportId(reportId);
    
    try {
      if (onViewReport) {
        onViewReport(reportId);
      } else {
        router.push(`/ai-consultations/${reportId}`);
      }
    } catch (error) {
      console.error('Error navigating to report:', error);
      setViewingReportId(null);
    }
  };

  // Handle resume chat
  const handleResumeChat = (consultationId: string) => {
    if (onResumeChat) {
      onResumeChat(consultationId);
    } else {
      router.push(`/ai-consultations/${consultationId}`);
    }
  };

  // Fetch consultation reports from API
  const fetchConsultations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: reportsPerPage.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const token = await getToken();
      const response = await fetch(`/api/ai-consultations?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch consultation reports');
      }

      const data = await response.json();
      setConsultations(data.consultations || []);
      setPagination(data.pagination || {
        page: 1,
        limit: reportsPerPage,
        total: 0,
        totalPages: 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consultation reports');
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm, reportsPerPage]);

  // Load consultations on component mount and when filters change
  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  // Reset viewing state when component unmounts
  useEffect(() => {
    return () => {
      setViewingReportId(null);
    };
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchConsultations();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchConsultations]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (level: number) => {
    switch (level) {
      case 1: return 'text-green-600';
      case 2: return 'text-yellow-600';
      case 3: return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getUrgencyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Low';
      case 2: return 'Medium';
      case 3: return 'High';
      default: return 'Unknown';
    }
  };

  const downloadReport = async (consultation: ConsultationReport) => {
    try {
      if (!consultation.aiAssessment) {
        toast.error('No report available for this consultation');
        return;
      }

      // Generate a simple text report
      const reportContent = `
AI CONSULTATION REPORT
======================

Consultation ID: ${consultation.id}
Date: ${new Date(consultation.createdAt).toLocaleDateString()}
AI Provider: ${consultation.aiProvider.name}
Specialty: ${consultation.aiProvider.specialty}

CHIEF COMPLAINT
${consultation.aiAssessment.chiefComplaint}

HISTORY OF PRESENT ILLNESS
${consultation.aiAssessment.historyOfPresentIllness}

ASSESSMENT
${consultation.aiAssessment.assessment}

RECOMMENDATIONS
${consultation.aiAssessment.recommendations.map(r => `• ${r}`).join('\n')}

FOLLOW-UP INSTRUCTIONS
${consultation.aiAssessment.followUpInstructions.map(i => `• ${i}`).join('\n')}

RED FLAGS
${consultation.aiAssessment.redFlags.map(f => `• ${f}`).join('\n')}

CONSULTATION SUMMARY
Duration: ${consultation.aiAssessment.consultationSummary.duration}
Start Time: ${new Date(consultation.aiAssessment.consultationSummary.startTime).toLocaleString()}
End Time: ${new Date(consultation.aiAssessment.consultationSummary.endTime).toLocaleString()}
      `;

      // Create and download the file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consultation-report-${consultation.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const shareReport = (consultation: ConsultationReport) => {
    const shareText = `AI Consultation Report - ${consultation.reasonForVisit}\nProvider: ${consultation.aiProvider.name}\nDate: ${new Date(consultation.createdAt).toLocaleDateString()}`;
    
    if (navigator.share) {
      navigator.share({
        title: `AI Consultation Report - ${consultation.reasonForVisit}`,
        text: shareText,
        url: window.location.href
      });
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(shareText);
      toast.success('Report details copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">AI Consultation History</h1>
          <p className="text-gray-600">View and manage your AI consultation reports</p>
        </div>
        <div className="text-sm text-gray-500">
          Total Consultations: {pagination.total || consultations.length}
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search consultations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Consultation Reports List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading consultations...</span>
            </div>
          </Card>
        ) : error ? (
          <Card className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button 
                onClick={fetchConsultations} 
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </Card>
        ) : consultations.length === 0 ? (
          <Card className="p-6">
            <div className="text-center text-gray-500">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No AI consultations found</p>
              <p>Start your first AI consultation to see reports here.</p>
            </div>
          </Card>
        ) : (
          consultations.map((consultation) => (
            <Card key={consultation.id} className="p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Bot className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{consultation.aiProvider.name}</h3>
                        <p className="text-sm text-gray-600">{consultation.aiProvider.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(consultation.status)}>
                        {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" className={getUrgencyColor(consultation.urgencyLevel)}>
                        {getUrgencyLabel(consultation.urgencyLevel)} Priority
                      </Badge>
                    </div>
                  </div>

                  {/* Consultation Details */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Reason for Visit:</span>
                      <p className="text-sm text-gray-600 mt-1">{consultation.reasonForVisit}</p>
                    </div>
                    
                    {consultation.symptoms.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Symptoms:</span>
                        <p className="text-sm text-gray-600 mt-1">{consultation.symptoms.join(', ')}</p>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(consultation.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(consultation.createdAt), { addSuffix: true })}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {consultation.messageCount} messages
                    </div>
                    {consultation.durationMinutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {consultation.durationMinutes} min
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {consultation.status === 'active' ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleResumeChat(consultation.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Bot className="h-4 w-4 mr-1" />
                      Resume Chat
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(consultation.id)}
                      disabled={viewingReportId === consultation.id}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Report
                    </Button>
                  )}
                  
                  {consultation.status === 'completed' && consultation.aiAssessment && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReport(consultation)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareReport(consultation)}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} consultations
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ConsultationHistory;