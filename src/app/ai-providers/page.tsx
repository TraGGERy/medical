'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Clock, MessageCircle, Filter, Search, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

interface AiProvider {
  id: string;
  name: string;
  specialty: string;
  subSpecialty?: string;
  bio: string;
  profileImageUrl?: string;
  yearsOfExperience: number;
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

interface ApiResponse {
  providers: AiProvider[];
  specialties: string[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export default function AiProvidersPage() {
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, [selectedSpecialty, searchTerm]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedSpecialty && selectedSpecialty !== 'all') {
        params.append('specialty', selectedSpecialty);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      params.append('isActive', 'true');
      params.append('isAvailable', 'true');
      
      const response = await fetch(`/api/ai-providers?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch AI providers');
      }
      
      const data: ApiResponse = await response.json();
      setProviders(data.providers);
      setSpecialties(data.specialties);
    } catch (error) {
      console.error('Error fetching AI providers:', error);
      toast.error('Failed to load AI providers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleSpecialtyChange = (value: string) => {
    setSelectedSpecialty(value);
  };

  const formatResponseTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    return `${Math.floor(seconds / 60)}m`;
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI Medical Specialists</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl">
          Connect with our AI-powered medical specialists for instant consultations. 
          Get expert medical guidance 24/7 from specialized AI doctors trained in various medical fields.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name or specialty..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedSpecialty} onValueChange={handleSpecialtyChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Specialties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {specialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full sm:w-auto"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          {providers.length} AI specialist{providers.length !== 1 ? 's' : ''} available
          {selectedSpecialty && selectedSpecialty !== 'all' && (
            <span> in {selectedSpecialty}</span>
          )}
        </p>
      </div>

      {/* Providers Grid */}
      {providers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <MessageCircle className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No AI specialists found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or browse all available specialists.
          </p>
          <Button onClick={() => {
            setSearchTerm('');
            setSelectedSpecialty('all');
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <Card key={provider.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Image
                      src={provider.profileImageUrl || '/placeholder-doctor.jpg'}
                      alt={provider.name}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                      {provider.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      {provider.specialty}
                      {provider.subSpecialty && (
                        <span className="block text-xs text-gray-500">
                          {provider.subSpecialty}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Rating and Experience */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{provider.rating}</span>
                    <span className="text-gray-500">({provider.totalConsultations})</span>
                  </div>
                  <div className="text-gray-600">
                    {provider.yearsOfExperience} years exp.
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-gray-600 line-clamp-3">
                  {provider.bio}
                </p>

                {/* Specializations */}
                <div className="flex flex-wrap gap-1">
                  {provider.specializations.slice(0, 3).map((spec, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                  {provider.specializations.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{provider.specializations.length - 3} more
                    </Badge>
                  )}
                </div>

                {/* Languages */}
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Languages: </span>
                  {provider.languages.join(', ')}
                </div>

                {/* Response Time and Fee */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <Clock className="h-4 w-4" />
                    <span>Responds in {formatResponseTime(provider.responseTimeSeconds)}</span>
                  </div>
                  <div className="font-semibold text-gray-900">
                    ${provider.consultationFee}
                  </div>
                </div>

                {/* Action Button */}
                <Link href={`/ai-providers/${provider.id}`} className="block">
                  <Button className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start Consultation
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load More Button (if needed for pagination) */}
      {providers.length > 0 && providers.length % 20 === 0 && (
        <div className="text-center mt-8">
          <Button variant="outline" onClick={fetchProviders}>
            Load More Specialists
          </Button>
        </div>
      )}
    </div>
  );
}