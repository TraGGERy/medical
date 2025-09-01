"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Upload, CheckCircle, AlertCircle, Info, AlertTriangle, X, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';

// Inline UI Components
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

interface ProviderRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  specialty: string;
  experience: string;
  education: string;
  bio: string;
  consultationFee: string;
}

const SPECIALTIES = [
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Urology',
  'Other'
];

export default function ProviderRegistration() {
  const [formData, setFormData] = useState<ProviderRegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    specialty: '',
    experience: '',
    education: '',
    bio: '',
    consultationFee: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof ProviderRegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'License number is required';
    if (!formData.specialty) newErrors.specialty = 'Specialty is required';
    if (!formData.experience.trim()) newErrors.experience = 'Experience is required';
    if (!formData.education.trim()) newErrors.education = 'Education is required';
    if (!formData.consultationFee.trim()) newErrors.consultationFee = 'Consultation fee is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,14}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Fee validation
    if (formData.consultationFee && isNaN(Number(formData.consultationFee))) {
      newErrors.consultationFee = 'Please enter a valid fee amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Add documents
      documents.forEach((file, index) => {
        formDataToSend.append(`document_${index}`, file);
      });

      const response = await fetch('/api/providers/register', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      await response.json();
      toast.success('Registration submitted successfully! We will review your application and contact you soon.');
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        licenseNumber: '',
        specialty: '',
        experience: '',
        education: '',
        bio: '',
        consultationFee: ''
      });
      setDocuments([]);
      
    } catch (error: unknown) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Healthcare Provider Registration</h1>
        <p className="text-gray-600">Join our telemedicine platform and start providing care to patients remotely</p>
      </div>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Your application will be reviewed by our medical team. Verification typically takes 2-3 business days.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Please provide your basic contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('firstName', e.target.value)}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>Please provide your medical credentials and specialization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">Medical License Number *</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('licenseNumber', e.target.value)}
                  className={errors.licenseNumber ? 'border-red-500' : ''}
                />
                {errors.licenseNumber && <p className="text-sm text-red-500">{errors.licenseNumber}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty *</Label>
                <Select value={formData.specialty} onValueChange={(value) => handleInputChange('specialty', value)}>
                  <SelectTrigger className={errors.specialty ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select your specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.specialty && <p className="text-sm text-red-500">{errors.specialty}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience *</Label>
                <Input
                  id="experience"
                  value={formData.experience}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('experience', e.target.value)}
                  placeholder="e.g., 5 years"
                  className={errors.experience ? 'border-red-500' : ''}
                />
                {errors.experience && <p className="text-sm text-red-500">{errors.experience}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="consultationFee">Consultation Fee (USD) *</Label>
                <Input
                  id="consultationFee"
                  type="number"
                  value={formData.consultationFee}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('consultationFee', e.target.value)}
                  placeholder="e.g., 150"
                  className={errors.consultationFee ? 'border-red-500' : ''}
                />
                {errors.consultationFee && <p className="text-sm text-red-500">{errors.consultationFee}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="education">Education & Qualifications *</Label>
              <Textarea
                id="education"
                value={formData.education}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('education', e.target.value)}
                placeholder="e.g., MD from Harvard Medical School, Board Certified in Internal Medicine"
                className={errors.education ? 'border-red-500' : ''}
              />
              {errors.education && <p className="text-sm text-red-500">{errors.education}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('bio', e.target.value)}
                placeholder="Tell patients about your background, approach to care, and areas of expertise..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
            <CardDescription>Please upload your medical license and other relevant certifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="documents">Upload Documents</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="documents" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Click to upload or drag and drop
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      PDF, JPG, PNG up to 10MB each
                    </span>
                  </label>
                  <input
                    id="documents"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            {documents.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Documents</Label>
                <div className="space-y-2">
                  {documents.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto px-8 py-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Application...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </div>
      </form>
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
    const [focused, setFocused] = useState(false);
    const [currentLength, setCurrentLength] = useState(
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

// Embedded Select
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
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

// ... existing code ...