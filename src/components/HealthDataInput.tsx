'use client';

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  Thermometer, 
  Activity, 
  Droplets, 
  Scale, 
  Moon, 
  Footprints,
  Zap,
  Plus,
  Save,
  AlertCircle,
  CheckCircle,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Inline UI Components
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    }
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    }
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

interface HealthDataEntry {
  id?: string;
  dataType: string;
  value: number;
  unit: string;
  source: string;
  notes?: string;
  timestamp?: string;
  success?: boolean;
}

interface HealthDataInputProps {
  onDataSubmitted?: (data: HealthDataEntry[]) => void;
  className?: string;
}

const HEALTH_DATA_TYPES = {
  heart_rate: {
    icon: Heart,
    label: 'Heart Rate',
    unit: 'bpm',
    color: 'text-red-500',
    placeholder: 'e.g., 72',
    normalRange: '60-100 bpm',
  },
  blood_pressure: {
    icon: Droplets,
    label: 'Blood Pressure',
    unit: 'mmHg',
    color: 'text-purple-500',
    placeholder: 'e.g., 120 (systolic)',
    normalRange: '90-140 mmHg',
  },
  temperature: {
    icon: Thermometer,
    label: 'Body Temperature',
    unit: '°C',
    color: 'text-orange-500',
    placeholder: 'e.g., 36.5',
    normalRange: '36.1-37.2°C',
  },
  oxygen_saturation: {
    icon: Activity,
    label: 'Oxygen Saturation',
    unit: '%',
    color: 'text-blue-500',
    placeholder: 'e.g., 98',
    normalRange: '95-100%',
  },
  weight: {
    icon: Scale,
    label: 'Weight',
    unit: 'kg',
    color: 'text-green-500',
    placeholder: 'e.g., 70.5',
    normalRange: 'Varies by individual',
  },
  steps: {
    icon: Footprints,
    label: 'Daily Steps',
    unit: 'steps',
    color: 'text-indigo-500',
    placeholder: 'e.g., 8500',
    normalRange: '8000-10000 steps',
  },
  sleep: {
    icon: Moon,
    label: 'Sleep Duration',
    unit: 'hours',
    color: 'text-purple-600',
    placeholder: 'e.g., 7.5',
    normalRange: '7-9 hours',
  },
  glucose: {
    icon: Zap,
    label: 'Blood Glucose',
    unit: 'mg/dL',
    color: 'text-yellow-500',
    placeholder: 'e.g., 95',
    normalRange: '70-140 mg/dL',
  },
};

const DATA_SOURCES = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'fitbit', label: 'Fitbit' },
  { value: 'apple_health', label: 'Apple Health' },
  { value: 'google_fit', label: 'Google Fit' },
  { value: 'garmin', label: 'Garmin' },
  { value: 'samsung_health', label: 'Samsung Health' },
  { value: 'medical_device', label: 'Medical Device' },
  { value: 'other', label: 'Other' },
];

export default function HealthDataInput({ onDataSubmitted, className }: HealthDataInputProps) {
  const [selectedDataType, setSelectedDataType] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [source, setSource] = useState<string>('manual');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkData, setBulkData] = useState<string>('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [recentEntries, setRecentEntries] = useState<HealthDataEntry[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDataType || !value) {
      toast.error('Please select a data type and enter a value');
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      toast.error('Please enter a valid numeric value');
      return;
    }

    setIsSubmitting(true);

    try {
      const dataType = HEALTH_DATA_TYPES[selectedDataType as keyof typeof HEALTH_DATA_TYPES];
      const healthData = {
        dataType: selectedDataType,
        value: numericValue,
        unit: dataType.unit,
        source,
        timestamp: new Date().toISOString(),
        metadata: notes ? { notes } : undefined,
      };

      const response = await fetch('/api/realtime/health-data?action=store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(healthData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${dataType.label} recorded successfully`);
        
        // Add to recent entries
        setRecentEntries(prev => [{
          ...healthData,
          id: result.data?.id || Date.now().toString(),
          label: dataType.label,
        }, ...prev.slice(0, 4)]);
        
        // Reset form
        setValue('');
        setNotes('');
        
        // Notify parent component
        onDataSubmitted?.(result.data);
      } else {
        toast.error(result.error || 'Failed to record health data');
      }
    } catch (error: unknown) {
      console.error('Error submitting health data:', error);
      toast.error('Failed to record health data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkData.trim()) {
      toast.error('Please enter bulk data');
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse CSV-like format: dataType,value,unit,source
      const lines = bulkData.trim().split('\n');
      const data = lines.map(line => {
        const [dataType, value, unit, source = 'manual'] = line.split(',').map(s => s.trim());
        return {
          dataType,
          value: parseFloat(value),
          unit: unit || HEALTH_DATA_TYPES[dataType as keyof typeof HEALTH_DATA_TYPES]?.unit || '',
          source,
          timestamp: new Date().toISOString(),
        };
      }).filter(item => item.dataType && !isNaN(item.value));

      if (data.length === 0) {
        toast.error('No valid data found. Use format: dataType,value,unit,source');
        return;
      }

      const response = await fetch('/api/realtime/health-data?action=bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      const result = await response.json();

      if (result.success) {
        const successCount = result.results?.filter((r: HealthDataEntry) => r.success).length || 0;
        toast.success(`Successfully recorded ${successCount} of ${data.length} data points`);
        setBulkData('');
        setShowBulkInput(false);
        onDataSubmitted?.(result.results);
      } else {
        toast.error(result.error || 'Failed to record bulk data');
      }
    } catch (error: unknown) {
      console.error('Error submitting bulk data:', error);
      toast.error('Failed to record bulk data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = selectedDataType ? HEALTH_DATA_TYPES[selectedDataType as keyof typeof HEALTH_DATA_TYPES] : null;
  const Icon = selectedType?.icon || Plus;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Icon className={cn('w-5 h-5', selectedType?.color || 'text-gray-500')} />
            <span>Record Health Data</span>
          </CardTitle>
          <CardDescription>
            Manually enter health measurements or import from connected devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Data Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="dataType">Health Metric</Label>
              <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a health metric to record" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(HEALTH_DATA_TYPES).map(([key, type]) => {
                    const TypeIcon = type.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center space-x-2">
                          <TypeIcon className={cn('w-4 h-4', type.color)} />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedType && (
                <div className="text-sm text-gray-600">
                  Normal range: {selectedType.normalRange}
                </div>
              )}
            </div>

            {/* Value Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <div className="relative">
                  <Input
                    id="value"
                    type="number"
                    step="0.1"
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
                    placeholder={selectedType?.placeholder || 'Enter value'}
                    className="pr-12"
                  />
                  {selectedType && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      {selectedType.unit}
                    </div>
                  )}
                </div>
              </div>

              {/* Source Selection */}
              <div className="space-y-2">
                <Label htmlFor="source">Data Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_SOURCES.map((src) => (
                      <SelectItem key={src.value} value={src.value}>
                        {src.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this measurement..."
                rows={2}
              />
            </div>

            {/* Submit Button */}
            <div className="flex space-x-2">
              <Button type="submit" disabled={isSubmitting || !selectedDataType || !value}>
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="ml-2">Record Data</span>
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowBulkInput(!showBulkInput)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bulk Data Input */}
      {showBulkInput && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Data Import</CardTitle>
            <CardDescription>
              Import multiple data points at once. Format: dataType,value,unit,source (one per line)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulkData">Bulk Data</Label>
              <Textarea
                id="bulkData"
                value={bulkData}
                onChange={(e) => setBulkData(e.target.value)}
                placeholder={`heart_rate,72,bpm,fitbit\ntemperature,36.5,°C,manual\nweight,70.2,kg,scale`}
                rows={6}
                className="font-mono text-sm"
              />
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Format: dataType,value,unit,source (one measurement per line)
                <br />Example: heart_rate,72,bpm,fitbit
              </AlertDescription>
            </Alert>
            
            <div className="flex space-x-2">
              <Button onClick={handleBulkSubmit} disabled={isSubmitting || !bulkData.trim()}>
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span className="ml-2">Import Data</span>
              </Button>
              
              <Button variant="outline" onClick={() => setShowBulkInput(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
            <CardDescription>
              Your latest health data recordings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentEntries.map((entry, index) => {
                const type = HEALTH_DATA_TYPES[entry.dataType as keyof typeof HEALTH_DATA_TYPES];
                const EntryIcon = type?.icon || Activity;
                
                return (
                  <div key={entry.id || index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <EntryIcon className={cn('w-4 h-4', type?.color || 'text-gray-500')} />
                      <div>
                        <div className="font-medium text-sm">
                          {type?.label || entry.dataType}: {entry.value} {entry.unit}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(entry.timestamp || Date.now()).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {entry.source}
                      </Badge>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}