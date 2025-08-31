'use client';

import React, { useState, useEffect } from 'react';
// Inline UI Components
const Card = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string; [key: string]: React.ReactNode | string; }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props}>
    {children}
  </div>
)
Card.displayName = 'Card';

const CardHeader = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string; [key: string]: React.ReactNode | string; }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
    {children}
  </div>
)
CardHeader.displayName = 'CardHeader';

const CardTitle = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string; [key: string]: React.ReactNode | string; }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h3>
)
CardTitle.displayName = 'CardTitle';

const CardContent = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string; [key: string]: React.ReactNode | string; }) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
)
CardContent.displayName = 'CardContent';

const CardDescription = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string; [key: string]: React.ReactNode | string; }) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props}>
    {children}
  </p>
)
CardDescription.displayName = 'CardDescription';

const Button = ({ children, className = '', variant = 'default', size = 'default', disabled = false, onClick, type = 'button', ...props }: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  [key: string]: React.ReactNode | string | boolean | (() => void) | undefined;
}) => {
  const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline'
  }
  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10'
  }
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
Button.displayName = 'Button';

const Input = ({ className = '', type = 'text', ...props }: {
  className?: string;
  type?: string;
  [key: string]: string | undefined;
}) => (
  <input
    type={type}
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
)
Input.displayName = 'Input';

const Badge = ({ children, className = '', variant = 'default', ...props }: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  [key: string]: React.ReactNode | string | undefined;
}) => {
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground'
  }
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  )
}
Badge.displayName = 'Badge';

const Textarea = ({ className = '', ...props }: {
  className?: string;
  [key: string]: string | undefined;
}) => (
  <textarea
    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
)
Textarea.displayName = 'Textarea';

const Label = ({ children, className = '', htmlFor, ...props }: {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
  [key: string]: React.ReactNode | string | undefined;
}) => (
  <label
    htmlFor={htmlFor}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    {...props}
  >
    {children}
  </label>
)
Label.displayName = 'Label';

const Select = ({ children, value, onValueChange, ...props }: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  [key: string]: React.ReactNode | string | ((value: string) => void) | undefined;
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value || '')
  
  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
    setIsOpen(false)
  }
  
  return (
    <div className="relative" {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
            setIsOpen,
            selectedValue,
            onValueChange: handleValueChange
          })
        }
        return child
      })}
    </div>
  )
}
Select.displayName = 'Select';

const SelectTrigger = ({ children, className = '', isOpen, setIsOpen, ...props }: {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  [key: string]: React.ReactNode | string | boolean | ((open: boolean) => void) | undefined;
}) => (
  <button
    type="button"
    className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    onClick={() => setIsOpen?.(!isOpen)}
    {...props}
  >
    {children}
  </button>
)
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = ({ placeholder = '', selectedValue, ...props }: {
  placeholder?: string;
  selectedValue?: string;
  [key: string]: string | undefined;
}) => (
  <span {...props}>
    {selectedValue || placeholder}
  </span>
)
SelectValue.displayName = 'SelectValue';

const SelectContent = ({ children, isOpen, ...props }: {
  children: React.ReactNode;
  isOpen?: boolean;
  [key: string]: React.ReactNode | boolean | undefined;
}) => {
  if (!isOpen) return null
  
  return (
    <div className="absolute top-full left-0 z-50 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md" {...props}>
      <div className="p-1">
        {children}
      </div>
    </div>
  )
}
SelectContent.displayName = 'SelectContent';

const SelectItem = ({ children, value, onValueChange, className = '', ...props }: {
  children: React.ReactNode;
  value: string;
  onValueChange?: (value: string) => void;
  className?: string;
  [key: string]: React.ReactNode | string | ((value: string) => void) | undefined;
}) => (
  <div
    className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${className}`}
    onClick={() => onValueChange?.(value)}
    {...props}
  >
    {children}
  </div>
)
SelectItem.displayName = 'SelectItem';

const Switch = ({ checked, onCheckedChange, className = '', ...props }: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  [key: string]: React.ReactNode | string | boolean | ((checked: boolean) => void) | undefined;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-input'} ${className}`}
    onClick={() => onCheckedChange?.(!checked)}
    {...props}
  >
    <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
)
Switch.displayName = 'Switch';

const Separator = ({ className = '', orientation = 'horizontal', ...props }: {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  [key: string]: string | undefined;
}) => (
  <div
    className={`shrink-0 bg-border ${orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]'} ${className}`}
    {...props}
  />
)
Separator.displayName = 'Separator';

const Dialog = ({ children, open, onOpenChange, ...props }: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  [key: string]: React.ReactNode | boolean | ((open: boolean) => void) | undefined;
}) => {
  const [isOpen, setIsOpen] = useState(open || false)
  
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }
  
  return (
    <div {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isOpen,
            onOpenChange: handleOpenChange
          })
        }
        return child
      })}
    </div>
  )
}

const DialogTrigger = ({ children, isOpen, onOpenChange, ...props }: {
  children: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  [key: string]: React.ReactNode | boolean | ((open: boolean) => void) | undefined;
}) => (
  <div onClick={() => onOpenChange?.(!isOpen)} {...props}>
    {children}
  </div>
)
DialogTrigger.displayName = 'DialogTrigger';

const DialogContent = ({ children, isOpen, onOpenChange, className = '', ...props }: {
  children: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  [key: string]: React.ReactNode | boolean | string | ((open: boolean) => void) | undefined;
}) => {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => onOpenChange?.(false)} />
      <div className={`relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg ${className}`} {...props}>
        {children}
      </div>
    </div>
  )
}
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({ children, className = '', ...props }: {
  children: React.ReactNode;
  className?: string;
  [key: string]: React.ReactNode | string | undefined;
}) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`} {...props}>
    {children}
  </div>
)
DialogHeader.displayName = 'DialogHeader';

const DialogTitle = ({ children, className = '', ...props }: {
  children: React.ReactNode;
  className?: string;
  [key: string]: React.ReactNode | string | undefined;
}) => (
  <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h2>
)
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = ({ children, className = '', ...props }: {
  children: React.ReactNode;
  className?: string;
  [key: string]: React.ReactNode | string | undefined;
}) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props}>
    {children}
  </p>
)
DialogDescription.displayName = 'DialogDescription';

const DialogFooter = ({ children, className = '', ...props }: {
  children: React.ReactNode;
  className?: string;
  [key: string]: React.ReactNode | string | undefined;
}) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`} {...props}>
    {children}
  </div>
)
DialogFooter.displayName = 'DialogFooter';

const Table = ({ children, className = '', ...props }: {
  children: React.ReactNode;
  className?: string;
  [key: string]: React.ReactNode | string | undefined;
}) => (
  <div className="relative w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className}`} {...props}>
      {children}
    </table>
  </div>
)
Table.displayName = 'Table';

const TableHeader = ({ children, className = '', ...props }: {
  children: React.ReactNode;
  className?: string;
  [key: string]: React.ReactNode | string | undefined;
}) => (
  <thead className={`[&_tr]:border-b ${className}`} {...props}>
    {children}
  </thead>
)
TableHeader.displayName = 'TableHeader';

const TableBody = ({ children, className = '', ...props }: {
  children: React.ReactNode;
  className?: string;
  [key: string]: React.ReactNode | string | undefined;
}) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props}>
    {children}
  </tbody>
)
TableBody.displayName = 'TableBody';

const TableRow = ({ children, className = '', ...props }: {
  children: React.ReactNode;
  className?: string;
  [key: string]: React.ReactNode | string | undefined;
}) => (
  <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`} {...props}>
    {children}
  </tr>
)
TableRow.displayName = 'TableRow';

const TableHead = ({ children, className = '', ...props }: {
  children: React.ReactNode;
  className?: string;
  [key: string]: React.ReactNode | string | undefined;
}) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>
    {children}
  </th>
)
TableHead.displayName = 'TableHead';

const TableCell = ({ children, className = '', ...props }: {
  children: React.ReactNode;
  className?: string;
  [key: string]: React.ReactNode | string | undefined;
}) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>
    {children}
  </td>
)
TableCell.displayName = 'TableCell';

const DropdownMenu = ({ children, ...props }: {
  children: React.ReactNode;
  [key: string]: React.ReactNode | undefined;
}) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative" {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isOpen,
            setIsOpen
          })
        }
        return child
      })}
    </div>
  )
}
DropdownMenu.displayName = 'DropdownMenu';

const DropdownMenuTrigger = ({ children, isOpen, setIsOpen, ...props }: {
  children: React.ReactNode;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  [key: string]: React.ReactNode | boolean | ((open: boolean) => void) | undefined;
}) => (
  <div onClick={() => setIsOpen?.(!isOpen)} {...props}>
    {children}
  </div>
)
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

const DropdownMenuContent = ({ children, isOpen, className = '', ...props }: {
  children: React.ReactNode;
  isOpen?: boolean;
  className?: string;
  [key: string]: React.ReactNode | boolean | string | undefined;
}) => {
  if (!isOpen) return null
  
  return (
    <div className={`absolute right-0 top-full z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md ${className}`} {...props}>
      {children}
    </div>
  )
}
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuLabel = ({ children, className = '', ...props }: {
  children: React.ReactNode;
  className?: string;
  [key: string]: React.ReactNode | string | undefined;
}) => (
  <div className={`px-2 py-1.5 text-sm font-semibold ${className}`} {...props}>
    {children}
  </div>
)
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const DropdownMenuItem = ({ children, className = '', onClick, ...props }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  [key: string]: React.ReactNode | string | (() => void) | undefined;
}) => (
  <div
    className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </div>
)
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuSeparator = ({ className = '', ...props }: {
  className?: string;
  [key: string]: string | undefined;
}) => (
  <div className={`-mx-1 my-1 h-px bg-muted ${className}`} {...props} />
)
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Star, 
  Users, 
  Clock, 
  MoreHorizontal,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';


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
  aiModel: string;
  personalityTraits: string[];
  specializations: string[];
  consultationStyle: string;
  isActive: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProviderFormData {
  name: string;
  specialty: string;
  subSpecialty: string;
  bio: string;
  profileImageUrl: string;
  yearsOfExperience: number;
  education: string;
  certifications: string;
  languages: string;
  consultationFee: string;
  currency: string;
  aiModel: string;
  personalityTraits: string;
  specializations: string;
  consultationStyle: string;
  isActive: boolean;
  isAvailable: boolean;
}

const SPECIALTIES = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
  'Neurology', 'Oncology', 'Orthopedics', 'Pediatrics',
  'Psychiatry', 'Pulmonology', 'Radiology', 'Urology', 'Mystic Medicine'
];

const AI_MODELS = [
  'gpt-4', 'gpt-3.5-turbo', 'claude-3', 'gemini-pro'
];

export default function AiProvidersManagementPage() {
  const { isSignedIn } = useAuth();
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AiProvider | null>(null);
  const [formData, setFormData] = useState<ProviderFormData>({
    name: '',
    specialty: '',
    subSpecialty: '',
    bio: '',
    profileImageUrl: '',
    yearsOfExperience: 0,
    education: '',
    certifications: '',
    languages: '',
    consultationFee: '',
    currency: 'USD',
    aiModel: 'gpt-4',
    personalityTraits: '',
    specializations: '',
    consultationStyle: '',
    isActive: true,
    isAvailable: true
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-providers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch AI providers');
      }
      
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Error fetching AI providers:', error);
      toast.error('Failed to load AI providers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async () => {
    try {
      setFormLoading(true);
      
      const providerData = {
        ...formData,
        education: formData.education ? JSON.parse(formData.education) : [],
        certifications: formData.certifications ? formData.certifications.split(',').map(c => c.trim()) : [],
        languages: formData.languages.split(',').map(l => l.trim()),
        personalityTraits: formData.personalityTraits.split(',').map(t => t.trim()),
        specializations: formData.specializations.split(',').map(s => s.trim())
      };

      const response = await fetch('/api/ai-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(providerData)
      });

      if (!response.ok) {
        throw new Error('Failed to create AI provider');
      }

      toast.success('AI provider created successfully');
      setShowCreateDialog(false);
      resetForm();
      fetchProviders();
    } catch (error) {
      console.error('Error creating AI provider:', error);
      toast.error('Failed to create AI provider');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateProvider = async () => {
    if (!editingProvider) return;

    try {
      setFormLoading(true);
      
      const providerData = {
        ...formData,
        education: formData.education ? JSON.parse(formData.education) : [],
        certifications: formData.certifications ? formData.certifications.split(',').map(c => c.trim()) : [],
        languages: formData.languages.split(',').map(l => l.trim()),
        personalityTraits: formData.personalityTraits.split(',').map(t => t.trim()),
        specializations: formData.specializations.split(',').map(s => s.trim())
      };

      const response = await fetch(`/api/ai-providers/${editingProvider.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(providerData)
      });

      if (!response.ok) {
        throw new Error('Failed to update AI provider');
      }

      toast.success('AI provider updated successfully');
      setShowEditDialog(false);
      setEditingProvider(null);
      resetForm();
      fetchProviders();
    } catch (error) {
      console.error('Error updating AI provider:', error);
      toast.error('Failed to update AI provider');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this AI provider?')) {
      return;
    }

    try {
      const response = await fetch(`/api/ai-providers/${providerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete AI provider');
      }

      toast.success('AI provider deleted successfully');
      fetchProviders();
    } catch (error) {
      console.error('Error deleting AI provider:', error);
      toast.error('Failed to delete AI provider');
    }
  };

  const openEditDialog = (provider: AiProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      specialty: provider.specialty,
      subSpecialty: provider.subSpecialty || '',
      bio: provider.bio,
      profileImageUrl: provider.profileImageUrl || '',
      yearsOfExperience: provider.yearsOfExperience,
      education: JSON.stringify(provider.education),
      certifications: provider.certifications?.join(', ') || '',
      languages: provider.languages.join(', '),
      consultationFee: provider.consultationFee,
      currency: provider.currency,
      aiModel: provider.aiModel,
      personalityTraits: provider.personalityTraits.join(', '),
      specializations: provider.specializations.join(', '),
      consultationStyle: provider.consultationStyle,
      isActive: provider.isActive,
      isAvailable: provider.isAvailable
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      specialty: '',
      subSpecialty: '',
      bio: '',
      profileImageUrl: '',
      yearsOfExperience: 0,
      education: '',
      certifications: '',
      languages: '',
      consultationFee: '',
      currency: 'USD',
      aiModel: 'gpt-4',
      personalityTraits: '',
      specializations: '',
      consultationStyle: '',
      isActive: true,
      isAvailable: true
    });
  };

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'all' || provider.specialty === selectedSpecialty;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && provider.isActive) ||
                         (statusFilter === 'inactive' && !provider.isActive) ||
                         (statusFilter === 'available' && provider.isAvailable) ||
                         (statusFilter === 'unavailable' && !provider.isAvailable);
    
    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  const getStatusIcon = (provider: AiProvider) => {
    if (provider.isActive && provider.isAvailable) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (provider.isActive && !provider.isAvailable) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const renderProviderForm = () => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Dr. AI Assistant"
          />
        </div>
        <div>
          <Label htmlFor="specialty">Specialty *</Label>
          <Select value={formData.specialty} onValueChange={(value) => setFormData(prev => ({ ...prev, specialty: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select specialty" />
            </SelectTrigger>
            <SelectContent>
              {SPECIALTIES.map(specialty => (
                <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="subSpecialty">Sub-specialty</Label>
        <Input
          id="subSpecialty"
          value={formData.subSpecialty}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, subSpecialty: e.target.value }))}
          placeholder="e.g., Interventional Cardiology"
        />
      </div>

      <div>
        <Label htmlFor="bio">Bio *</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Brief description of the AI provider..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="profileImageUrl">Profile Image URL</Label>
        <Input
          id="profileImageUrl"
          value={formData.profileImageUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, profileImageUrl: e.target.value }))}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
          <Input
            id="yearsOfExperience"
            type="number"
            value={formData.yearsOfExperience}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) || 0 }))}
            placeholder="10"
          />
        </div>
        <div>
          <Label htmlFor="consultationFee">Consultation Fee *</Label>
          <Input
            id="consultationFee"
            value={formData.consultationFee}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, consultationFee: e.target.value }))}
            placeholder="50.00"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="languages">Languages * (comma-separated)</Label>
        <Input
          id="languages"
          value={formData.languages}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, languages: e.target.value }))}
          placeholder="English, Spanish, French"
        />
      </div>

      <div>
        <Label htmlFor="specializations">Specializations * (comma-separated)</Label>
        <Input
          id="specializations"
          value={formData.specializations}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, specializations: e.target.value }))}
          placeholder="Heart Disease, Hypertension, Arrhythmia"
        />
      </div>

      <div>
        <Label htmlFor="personalityTraits">Personality Traits * (comma-separated)</Label>
        <Input
          id="personalityTraits"
          value={formData.personalityTraits}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, personalityTraits: e.target.value }))}
          placeholder="Empathetic, Professional, Thorough"
        />
      </div>

      <div>
        <Label htmlFor="consultationStyle">Consultation Style *</Label>
        <Textarea
          id="consultationStyle"
          value={formData.consultationStyle}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, consultationStyle: e.target.value }))}
          placeholder="Describe the consultation approach..."
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="aiModel">AI Model *</Label>
        <Select value={formData.aiModel} onValueChange={(value) => setFormData(prev => ({ ...prev, aiModel: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_MODELS.map(model => (
              <SelectItem key={model} value={model}>{model}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="education">Education (JSON format)</Label>
        <Textarea
          id="education"
          value={formData.education}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, education: e.target.value }))}
          placeholder='[{"degree": "MD", "institution": "Harvard Medical School", "year": 2010}]'
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="certifications">Certifications (comma-separated)</Label>
        <Input
          id="certifications"
          value={formData.certifications}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, certifications: e.target.value }))}
          placeholder="Board Certified Cardiologist, ACLS Certified"
        />
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isAvailable"
            checked={formData.isAvailable}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
          />
          <Label htmlFor="isAvailable">Available</Label>
        </div>
      </div>
    </div>
  );

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You need to be signed in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Providers Management</h1>
          <p className="text-gray-600">Manage AI healthcare providers and their configurations</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add AI Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New AI Provider</DialogTitle>
              <DialogDescription>
                Add a new AI healthcare provider to the system
              </DialogDescription>
            </DialogHeader>
            {renderProviderForm()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProvider} disabled={formLoading}>
                {formLoading ? 'Creating...' : 'Create Provider'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.filter(p => p.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Now</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.filter(p => p.isAvailable).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {providers.reduce((sum, p) => sum + p.totalConsultations, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search providers..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {SPECIALTIES.map(specialty => (
                  <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Providers ({filteredProviders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Consultations</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={provider.profileImageUrl || '/placeholder-doctor.jpg'}
                          alt={provider.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-sm text-gray-500">{provider.yearsOfExperience} years exp.</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{provider.specialty}</div>
                        {provider.subSpecialty && (
                          <div className="text-sm text-gray-500">{provider.subSpecialty}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(provider)}
                        <div className="text-sm">
                          <div>{provider.isActive ? 'Active' : 'Inactive'}</div>
                          <div className="text-gray-500">
                            {provider.isAvailable ? 'Available' : 'Unavailable'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{provider.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{provider.totalConsultations}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">${provider.consultationFee}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{provider.aiModel}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditDialog(provider)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProvider(provider.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit AI Provider</DialogTitle>
            <DialogDescription>
              Update the AI provider information
            </DialogDescription>
          </DialogHeader>
          {renderProviderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProvider} disabled={formLoading}>
              {formLoading ? 'Updating...' : 'Update Provider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}