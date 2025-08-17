import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle } from 'lucide-react';

interface QuickResponseConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDecline: () => void;
  message: string;
  responseTime: number; // in milliseconds
}

export function QuickResponseConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  onDecline,
  message,
  responseTime
}: QuickResponseConfirmDialogProps) {
  const formatResponseTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Quick Response Detected
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm">
                  You responded very quickly ({formatResponseTime(responseTime)}). 
                  This might indicate you're providing additional thoughts or corrections.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Your message:</p>
              <p className="text-sm text-gray-600 italic">"{message}"</p>
            </div>
            
            <p className="text-sm text-gray-600">
              Would you like to include this information in your diagnostic data collection?
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onDecline}
            className="w-full sm:w-auto"
          >
            No, Skip This Message
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            Yes, Add to Diagnostic Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}