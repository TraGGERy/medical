'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  Users, 
  DollarSign, 
  Clock, 
  Filter,
  MoreHorizontal,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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