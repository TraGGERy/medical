'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/Card';
import { CheckCircle, AlertCircle, FileText, Download } from 'lucide-react';
import { DiagnosticTriggerResult } from '@/lib/services/diagnosticCompletenessDetector';

interface DiagnosticConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  triggerResult: DiagnosticTriggerResult;
  isGenerating: boolean;
  generationProgress?: {
    step: string;
    progress: number;
  };
  generatedReport?: {
    id: string;
    downloadUrl: string;
    viewUrl: string;
  };
}

export default function DiagnosticConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  triggerResult,
  isGenerating,
  generationProgress,
  generatedReport
}: DiagnosticConfirmationDialogProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const renderConfirmationContent = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Generate Full Diagnostic Report
        </DialogTitle>
        <DialogDescription>
          We have collected enough information to generate your comprehensive diagnostic report.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Confidence Indicator */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Data Completeness</span>
              <Badge className={getConfidenceColor(triggerResult.confidence)}>
                {getConfidenceText(triggerResult.confidence)} ({Math.round(triggerResult.confidence * 100)}%)
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${triggerResult.completeness.completenessScore}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Completeness: {triggerResult.completeness.completenessScore}%</span>
              <span>Confidence: {Math.round(triggerResult.confidence * 100)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Collected Information Summary */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Collected Information</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center gap-2">
                {triggerResult.completeness.hasSymptoms ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">Symptoms</span>
              </div>
              <div className="flex items-center gap-2">
                {triggerResult.completeness.hasDuration ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">Duration</span>
              </div>
              <div className="flex items-center gap-2">
                {triggerResult.completeness.hasSeverity ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">Severity</span>
              </div>
              <div className="flex items-center gap-2">
                {triggerResult.completeness.hasAdditionalInfo ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">Additional Info</span>
              </div>
            </div>

            {showDetails && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {triggerResult.summary}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Missing Information Warning */}
        {triggerResult.missingCriticalFields.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Optional Information Missing</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    The following information could improve the report quality: {triggerResult.missingCriticalFields.join(', ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isGenerating}>
          Continue Conversation
        </Button>
        <Button onClick={onConfirm} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </Button>
      </DialogFooter>
    </>
  );

  const renderProgressContent = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
          Generating Diagnostic Report
        </DialogTitle>
        <DialogDescription>
          Please wait while we analyze your information and generate your comprehensive diagnostic report.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {generationProgress && (
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {generationProgress.step}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(generationProgress.progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${generationProgress.progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-pulse">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            </div>
            <p className="text-sm text-gray-600">
              This may take a moment...
            </p>
          </div>
        </div>
      </div>
    </>
  );

  const renderCompletedContent = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Diagnostic Report Generated
        </DialogTitle>
        <DialogDescription>
          Your comprehensive diagnostic report has been successfully generated and is ready for review.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium text-green-800">Report Ready</h3>
                <p className="text-sm text-green-700">
                  Your diagnostic report has been saved to your health records.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {generatedReport && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.open(generatedReport.viewUrl, '_blank')}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Report
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.open(generatedReport.downloadUrl, '_blank')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button onClick={onClose} className="w-full">
          Continue Conversation
        </Button>
      </DialogFooter>
    </>
  );

  const renderContent = () => {
    if (generatedReport) {
      return renderCompletedContent();
    }
    if (isGenerating) {
      return renderProgressContent();
    }
    return renderConfirmationContent();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}