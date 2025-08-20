'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
// Inline UI Components
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className = '' }: CardProps) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: CardProps) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: CardProps) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }: CardProps) => (
  <p className={`text-sm text-muted-foreground ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }: CardProps) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

const Button = ({ children, onClick, disabled = false, variant = 'default', size = 'default', className = '' }: ButtonProps) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  };
  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border border-input'
  };
  
  return (
    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

interface TextareaProps {
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const Textarea = ({ id, value, onChange, placeholder, className = '', disabled = false }: TextareaProps) => (
  <textarea
    id={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  />
);

interface InputProps {
  id?: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const Input = ({ id, type = 'text', value, onChange, placeholder, className = '', disabled = false }: InputProps) => (
  <input
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  />
);

interface LabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

const Label = ({ htmlFor, children, className = '' }: LabelProps) => (
  <label
    htmlFor={htmlFor}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
  >
    {children}
  </label>
);

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

const Select = ({ value, onValueChange, children }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            value,
            onValueChange,
            isOpen,
            setIsOpen
          });
        }
        return child;
      })}
    </div>
  );
};

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
  value?: string;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

const SelectTrigger = ({ children, className = '', value, isOpen, setIsOpen }: SelectTriggerProps) => (
  <button
    type="button"
    onClick={() => setIsOpen?.(!isOpen)}
    className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  >
    {children}
    <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>
);

const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <span className="text-muted-foreground">{placeholder}</span>
);

interface SelectContentProps {
  children: React.ReactNode;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  onValueChange?: (value: string) => void;
}

const SelectContent = ({ children, isOpen, setIsOpen, onValueChange }: SelectContentProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute top-full left-0 z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
      <div className="p-1">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onValueChange,
              setIsOpen
            });
          }
          return child;
        })}
      </div>
    </div>
  );
};

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  setIsOpen?: (open: boolean) => void;
}

const SelectItem = ({ value, children, onValueChange, setIsOpen }: SelectItemProps) => (
  <div
    onClick={() => {
      onValueChange?.(value);
      setIsOpen?.(false);
    }}
    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer"
  >
    {children}
  </div>
);

const Separator = ({ className = '' }: { className?: string }) => (
  <div className={`shrink-0 bg-border h-[1px] w-full ${className}`} />
);
import { 
  Star, 
  Clock, 
  MessageCircle, 
  Award, 
  Globe, 
  DollarSign,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

interface AiProvider {
  id: string;
  name: string;
  specialty: string;
  subSpecialty?: string;
  bio: string;
  profileImageUrl?: string;
  yearsOfExperience: number;
  education: Array<{
    degree: string;
    institution: string;
    year: number;
  }>;
  certifications?: string[];
  languages: string[];
  consultationFee: string;
  currency: string;
  rating: string;
  totalConsultations: number;
  responseTimeSeconds: number;
  personalityTraits: string[];
  specializations: string[];
  consultationStyle: string;
  isActive: boolean;
  isAvailable: boolean;
}

interface ConsultationForm {
  reasonForVisit: string;
  symptoms: string;
  urgencyLevel: number;
  patientAge?: number;
  patientGender?: string;
  medicalHistory?: string;
  currentMedications?: string;
  allergies?: string;
}

export default function AiProviderProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, userId } = useAuth();
  const [provider, setProvider] = useState<AiProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [consultationForm, setConsultationForm] = useState<ConsultationForm>({
    reasonForVisit: '',
    symptoms: '',
    urgencyLevel: 1,
    patientAge: undefined,
    patientGender: '',
    medicalHistory: '',
    currentMedications: '',
    allergies: ''
  });

  useEffect(() => {
    if (params.id) {
      fetchProvider(params.id as string);
    }
  }, [params.id]);

  const fetchProvider = async (providerId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai-providers/${providerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch AI provider');
      }
      
      const data = await response.json();
      setProvider(data);
    } catch (error) {
      console.error('Error fetching AI provider:', error);
      toast.error('Failed to load AI provider profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBookConsultation = async () => {
    if (!isSignedIn) {
      toast.error('Please sign in to book a consultation');
      router.push('/sign-in');
      return;
    }

    if (!consultationForm.reasonForVisit.trim()) {
      toast.error('Please provide a reason for your visit');
      return;
    }

    try {
      setBookingLoading(true);
      
      const consultationData = {
        aiProviderId: provider!.id,
        reasonForVisit: consultationForm.reasonForVisit,
        symptoms: consultationForm.symptoms ? consultationForm.symptoms.split(',').map(s => s.trim()) : [],
        urgencyLevel: consultationForm.urgencyLevel,
        patientAge: consultationForm.patientAge,
        patientGender: consultationForm.patientGender,
        medicalHistory: consultationForm.medicalHistory ? consultationForm.medicalHistory.split(',').map(s => s.trim()) : [],
        currentMedications: consultationForm.currentMedications ? consultationForm.currentMedications.split(',').map(s => s.trim()) : [],
        allergies: consultationForm.allergies ? consultationForm.allergies.split(',').map(s => s.trim()) : []
      };

      const response = await fetch('/api/ai-consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(consultationData)
      });

      if (!response.ok) {
        throw new Error('Failed to start consultation');
      }

      const result = await response.json();
      toast.success('Consultation started successfully!');
      
      // Redirect to consultation chat
      router.push(`/ai-consultations/${result.consultation.id}`);
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast.error('Failed to start consultation');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatResponseTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    return `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Provider Not Found</h3>
          <p className="text-gray-600 mb-4">The AI provider you&apos;re looking for doesn&apos;t exist or is no longer available.</p>
          <Link href="/ai-providers">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to AI Providers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/ai-providers">
          <Button variant="ghost" className="p-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to AI Providers
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Provider Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-6">
                <div className="relative">
                  <Image
                    src={provider.profileImageUrl || '/placeholder-doctor.jpg'}
                    alt={provider.name}
                    width={120}
                    height={120}
                    className="rounded-full object-cover"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {provider.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-lg text-gray-600 mb-3">
                    {provider.specialty}
                    {provider.subSpecialty && (
                      <span className="block text-sm text-gray-500">
                        Specializing in {provider.subSpecialty}
                      </span>
                    )}
                  </CardDescription>
                  
                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{provider.rating}</span>
                      <span className="text-gray-500">({provider.totalConsultations} consultations)</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <Clock className="h-4 w-4" />
                      <span>Responds in {formatResponseTime(provider.responseTimeSeconds)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-blue-600" />
                      <span>{provider.yearsOfExperience} years experience</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About {provider.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">{provider.bio}</p>
              <p className="text-sm text-gray-600">
                <strong>Consultation Style:</strong> {provider.consultationStyle}
              </p>
            </CardContent>
          </Card>

          {/* Specializations */}
          <Card>
            <CardHeader>
              <CardTitle>Specializations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {provider.specializations.map((spec, index) => (
                  <Badge key={index} variant="secondary">
                    {spec}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Education & Certifications */}
          <Card>
            <CardHeader>
              <CardTitle>Education & Certifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Education</h4>
                <div className="space-y-2">
                  {provider.education.map((edu, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{edu.degree}</div>
                      <div className="text-gray-600">{edu.institution} • {edu.year}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {provider.certifications && provider.certifications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Certifications</h4>
                  <div className="space-y-1">
                    {provider.certifications.map((cert, index) => (
                      <div key={index} className="text-sm text-gray-700 flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {cert}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personality Traits */}
          <Card>
            <CardHeader>
              <CardTitle>Personality Traits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {provider.personalityTraits.map((trait, index) => (
                  <Badge key={index} variant="outline">
                    {trait}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Consultation Fee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                ${provider.consultationFee}
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Per consultation • Instant response
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span>Languages: {provider.languages.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Available 24/7</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Start Consultation</CardTitle>
              <CardDescription>
                Begin your consultation with {provider.name} right now
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showBookingForm ? (
                <Button 
                  onClick={() => setShowBookingForm(true)}
                  className="w-full"
                  size="lg"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Book Instant Consultation
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reasonForVisit">Reason for Visit *</Label>
                    <Textarea
                      id="reasonForVisit"
                      placeholder="Briefly describe why you're seeking consultation..."
                      value={consultationForm.reasonForVisit}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConsultationForm(prev => ({ ...prev, reasonForVisit: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="symptoms">Current Symptoms</Label>
                    <Textarea
                      id="symptoms"
                      placeholder="List your symptoms (comma-separated)..."
                      value={consultationForm.symptoms}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConsultationForm(prev => ({ ...prev, symptoms: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="patientAge">Age</Label>
                      <Input
                        id="patientAge"
                        type="number"
                        placeholder="Age"
                        value={consultationForm.patientAge || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsultationForm(prev => ({ ...prev, patientAge: e.target.value ? parseInt(e.target.value) : undefined }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="patientGender">Gender</Label>
                      <Select value={consultationForm.patientGender} onValueChange={(value) => setConsultationForm(prev => ({ ...prev, patientGender: value }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="urgencyLevel">Urgency Level</Label>
                    <Select value={consultationForm.urgencyLevel.toString()} onValueChange={(value) => setConsultationForm(prev => ({ ...prev, urgencyLevel: parseInt(value) }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Low - General consultation</SelectItem>
                        <SelectItem value="2">Medium - Concerning symptoms</SelectItem>
                        <SelectItem value="3">High - Urgent symptoms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="medicalHistory">Medical History</Label>
                    <Textarea
                      id="medicalHistory"
                      placeholder="Previous conditions, surgeries, etc. (comma-separated)..."
                      value={consultationForm.medicalHistory}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConsultationForm(prev => ({ ...prev, medicalHistory: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentMedications">Current Medications</Label>
                    <Textarea
                      id="currentMedications"
                      placeholder="List current medications (comma-separated)..."
                      value={consultationForm.currentMedications}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConsultationForm(prev => ({ ...prev, currentMedications: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      placeholder="Known allergies (comma-separated)..."
                      value={consultationForm.allergies}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConsultationForm(prev => ({ ...prev, allergies: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowBookingForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBookConsultation}
                      disabled={bookingLoading || !consultationForm.reasonForVisit.trim()}
                      className="flex-1"
                    >
                      {bookingLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <MessageCircle className="h-4 w-4 mr-2" />
                      )}
                      Start Now
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}