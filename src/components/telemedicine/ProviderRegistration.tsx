"use client";

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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