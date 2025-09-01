'use client';

 
import { Heart, Thermometer, Activity, Droplets, Scale, Moon, Footprints, Zap, Plus, Save, AlertCircle, CheckCircle, Upload, Info, AlertTriangle, X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, AnimatePresence, type HTMLMotionProps } from 'framer-motion';
import { Slot } from '@radix-ui/react-slot';

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
  const [selectedDataType, setSelectedDataType] = React.useState<string>('');
  const [value, setValue] = React.useState<string>('');
  const [source, setSource] = React.useState<string>('manual');
  const [notes, setNotes] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [bulkData, setBulkData] = React.useState<string>('');
  const [showBulkInput, setShowBulkInput] = React.useState(false);
  const [recentEntries, setRecentEntries] = React.useState<HealthDataEntry[]>([]);

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

// Embedded Label
const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-gray-700',
        error: 'text-red-600',
        success: 'text-green-600',
        muted: 'text-gray-500',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  required?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, variant, size, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants({ variant, size }), className)}
        {...props}
      >
        {children}
        {required && (
          <span className="ml-1 text-red-500" aria-label="required">
            *
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = 'Label';

// Embedded Textarea
const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-sm transition-all duration-300 placeholder:text-gray-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20',
        error: 'border-red-500 focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/20',
        success: 'border-green-500 focus-visible:border-green-500 focus-visible:ring-2 focus-visible:ring-green-500/20',
      },
      size: {
        sm: 'min-h-[60px] px-2 py-1 text-xs',
        md: 'min-h-[80px] px-3 py-2 text-sm',
        lg: 'min-h-[120px] px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  error?: string;
  success?: string;
  floating?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant, 
    size, 
    label, 
    error, 
    success, 
    floating = true, 
    maxLength,
    showCount = false,
    value,
    onChange,
    ...props 
  }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const [currentLength, setCurrentLength] = React.useState(
      typeof value === 'string' ? value.length : 0
    );
    
    const hasValue = value || props.defaultValue;
    const isFloating = floating && label;
    const textareaVariant = error ? 'error' : success ? 'success' : variant;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCurrentLength(e.target.value.length);
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="relative w-full">
        <div className="relative">
          <textarea
            className={cn(
              textareaVariants({ variant: textareaVariant, size, className }),
              isFloating && 'placeholder-transparent'
            )}
            ref={ref}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={isFloating ? ' ' : props.placeholder}
            maxLength={maxLength}
            value={value}
            onChange={handleChange}
            {...props}
          />

          {(error || success) && (
            <div className="absolute right-3 top-3">
              {error && <AlertCircle className="h-4 w-4 text-red-500" />}
              {success && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
          )}
        </div>

        {isFloating && (
          <motion.label
            className={cn(
              'absolute left-3 top-3 text-gray-500 transition-all duration-300 pointer-events-none',
              (focused || hasValue) && 'top-0 left-3 -translate-y-1/2 text-xs bg-white px-1',
              error && 'text-red-500',
              success && 'text-green-500',
              focused && !error && !success && 'text-blue-500'
            )}
            initial={false}
            animate={{
              scale: focused || hasValue ? 0.85 : 1,
              y: focused || hasValue ? -12 : 0,
            }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {label}
          </motion.label>
        )}

        {!isFloating && label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        {(showCount || maxLength) && (
          <div className="mt-1 text-right">
            <span className={cn(
              'text-xs',
              maxLength && currentLength > maxLength * 0.9 ? 'text-red-500' : 'text-gray-500'
            )}>
              {showCount && `${currentLength}`}
              {maxLength && ` / ${maxLength}`}
            </span>
          </div>
        )}

        <AnimatePresence>
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-1"
            >
              {error && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </p>
              )}
              {success && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {success}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Embedded Select

const selectVariants = cva(
  'flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
        error: 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20',
        success: 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SelectProps extends VariantProps<typeof selectVariants> {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  placeholder?: string;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

const Select: React.FC<SelectProps> = ({ 
  value, 
  onValueChange, 
  placeholder, 
  children, 
  className
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, placeholder }}>
      <div ref={selectRef} className={cn('relative w-full', className)}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof selectVariants>
>(({ className, variant, children, ...props }, ref) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);

  return (
    <button
      ref={ref}
      type="button"
      className={cn(selectVariants({ variant }), className)}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      {children}
      <ChevronDown 
        className={cn(
          'h-4 w-4 transition-transform duration-200',
          isOpen && 'rotate-180'
        )} 
      />
    </button>
  );
});

SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder: propPlaceholder, ...props }, ref) => {
  const { value, placeholder: contextPlaceholder } = React.useContext(SelectContext);
  const displayPlaceholder = propPlaceholder || contextPlaceholder;

  return (
    <span
      ref={ref}
      className={cn(
        'block truncate',
        !value && 'text-gray-400',
        className
      )}
      {...props}
    >
      {value || displayPlaceholder}
    </span>
  );
});

SelectValue.displayName = 'SelectValue';

interface SelectContentProps extends Omit<HTMLMotionProps<'div'>, 'ref' | 'children'> {
  children: React.ReactNode;
}

const SelectContent = React.forwardRef<
  HTMLDivElement,
  SelectContentProps
>(({ className, children, ...props }, ref) => {
  const { isOpen } = React.useContext(SelectContext);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          className={cn(
            'absolute top-full left-0 z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden',
            className
          )}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          {...props}
        >
          <div className="max-h-60 overflow-auto py-1">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef<
  HTMLDivElement,
  SelectItemProps & React.HTMLAttributes<HTMLDivElement>
>(({ className, value, children, disabled, ...props }, ref) => {
  const { value: selectedValue, onValueChange, setIsOpen } = React.useContext(SelectContext);
  const isSelected = value === selectedValue;

  const handleClick = () => {
    if (!disabled && onValueChange) {
      onValueChange(value);
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none transition-colors',
        disabled
          ? 'pointer-events-none opacity-50'
          : 'hover:bg-gray-100 focus:bg-gray-100',
        isSelected && 'bg-blue-50 text-blue-600',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  );
});

SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };

// Embedded Badge
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

// Embedded Alert

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-blue-50 border-blue-200 text-blue-800 [&>svg]:text-blue-600',
        destructive: 'bg-red-50 border-red-200 text-red-800 [&>svg]:text-red-600',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 [&>svg]:text-yellow-600',
        success: 'bg-green-50 border-green-200 text-green-800 [&>svg]:text-green-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const iconMap = {
  default: Info,
  destructive: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
};

export interface AlertProps
  extends Omit<HTMLMotionProps<'div'>, 'ref' | 'children'>,
    VariantProps<typeof alertVariants> {
  dismissible?: boolean;
  onDismiss?: () => void;
  children: React.ReactNode;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', dismissible, onDismiss, children, ...props }, ref) => {
    const IconComponent = iconMap[variant || 'default'];

    return (
      <motion.div
        ref={ref}
        className={cn(alertVariants({ variant }), className)}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        <IconComponent className="h-4 w-4" />
        <div className="flex-1">{children}</div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="absolute right-2 top-2 rounded-md p-1 hover:bg-black/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    );
  }
);

Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));

AlertTitle.displayName = 'AlertTitle';

import * as React from 'react';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));

AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };