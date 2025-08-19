'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertTriangle, Pill, Stethoscope, Activity, Save, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

interface HealthEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  existingEvent?: HealthEvent | null;
  onSubmitSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

interface HealthEvent {
  id?: string;
  date: string;
  time?: string;
  type: 'symptom' | 'medication' | 'appointment' | 'measurement' | 'other';
  title: string;
  description?: string;
  severity?: number;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

const HealthEventModal: React.FC<HealthEventModalProps> = ({
  isOpen,
  onClose,
  selectedDate = new Date(),
  existingEvent,
  onSubmitSuccess,
  onDeleteSuccess
}) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<HealthEvent>({
    date: format(selectedDate, 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    type: 'symptom',
    title: '',
    description: '',
    severity: 5,
    category: '',
    tags: [],
    metadata: {}
  });

  // UI state
  const [newTag, setNewTag] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Event type configurations
  const eventTypes = [
    {
      value: 'symptom',
      label: 'Symptom',
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      value: 'medication',
      label: 'Medication',
      icon: Pill,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      value: 'appointment',
      label: 'Appointment',
      icon: Stethoscope,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      value: 'measurement',
      label: 'Measurement',
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      value: 'other',
      label: 'Other',
      icon: Calendar,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  ];

  // Load existing data when component mounts or existing event changes
  useEffect(() => {
    if (existingEvent) {
      setFormData({
        ...existingEvent,
        tags: existingEvent.tags || [],
        metadata: existingEvent.metadata || {}
      });
      setShowAdvanced(!!existingEvent.category || !!existingEvent.tags?.length);
    } else {
      setFormData({
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        type: 'symptom',
        title: '',
        description: '',
        severity: 5,
        category: '',
        tags: [],
        metadata: {}
      });
      setShowAdvanced(false);
    }
  }, [existingEvent, selectedDate]);

  const handleInputChange = (field: keyof HealthEvent, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMetadataChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value
      }
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to save health events');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title for the health event');
      return;
    }

    try {
      setSubmitting(true);
      
      const method = existingEvent ? 'PUT' : 'POST';
      const url = existingEvent 
        ? `/api/health-calendar/health-events/${existingEvent.id}`
        : '/api/health-calendar/health-events';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          title: formData.title.trim(),
          description: formData.description?.trim() || null,
          category: formData.category?.trim() || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save health event');
      }

      const result = await response.json();
      
      toast.success(existingEvent ? 'Health event updated successfully!' : 'Health event saved successfully!');
      
      onSubmitSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving health event:', error);
      toast.error('Failed to save health event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingEvent?.id) return;
    
    if (!confirm('Are you sure you want to delete this health event? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      
      const response = await fetch(`/api/health-calendar/health-events/${existingEvent.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete health event');
      }
      
      toast.success('Health event deleted successfully!');
      
      onDeleteSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error deleting health event:', error);
      toast.error('Failed to delete health event. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const getSeverityColor = (severity: number): string => {
    if (severity >= 8) return 'bg-red-500';
    if (severity >= 6) return 'bg-orange-500';
    if (severity >= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSeverityLabel = (severity: number): string => {
    if (severity >= 8) return 'Severe';
    if (severity >= 6) return 'Moderate';
    if (severity >= 4) return 'Mild';
    return 'Minimal';
  };

  const currentEventType = eventTypes.find(type => type.value === formData.type) || eventTypes[0];
  const IconComponent = currentEventType.icon;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div className="flex items-center gap-3">
            <div className={`p-2 sm:p-2 rounded-lg ${currentEventType.bgColor} ${currentEventType.borderColor} border`}>
              <IconComponent className={`w-5 h-5 sm:w-5 sm:h-5 ${currentEventType.color}`} />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                {existingEvent ? 'Edit' : 'Add'} Health Event
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {existingEvent && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-3 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
                title="Delete event"
              >
                {deleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-3 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Event Type */}
          <div className="space-y-3">
            <label className="text-sm sm:text-base font-medium text-gray-900">Event Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {eventTypes.map(type => {
                const TypeIcon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('type', type.value)}
                    className={`p-3 sm:p-3 rounded-lg border transition-colors touch-manipulation ${
                      formData.type === type.value
                        ? `${type.bgColor} ${type.borderColor} ${type.color}`
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <TypeIcon className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" />
                    <div className="text-xs sm:text-xs font-medium">{type.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm sm:text-base font-medium text-gray-900">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm sm:text-base font-medium text-gray-900">Time (Optional)</label>
              <input
                type="time"
                value={formData.time || ''}
                onChange={(e) => handleInputChange('time', e.target.value)}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm sm:text-base font-medium text-gray-900">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={`Enter ${currentEventType.label.toLowerCase()} name or description`}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
              required
            />
          </div>

          {/* Severity (for symptoms and some other types) */}
          {(formData.type === 'symptom' || formData.type === 'other') && (
            <div className="space-y-3">
              <label className="text-sm sm:text-base font-medium text-gray-900">Severity</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                  <span>Minimal</span>
                  <span className="font-medium">{getSeverityLabel(formData.severity || 5)}</span>
                  <span>Severe</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.severity || 5}
                  onChange={(e) => handleInputChange('severity', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${getSeverityColor(formData.severity || 5)} 0%, ${getSeverityColor(formData.severity || 5)} ${((formData.severity || 5) - 1) * 11.11}%, #e5e7eb ${((formData.severity || 5) - 1) * 11.11}%, #e5e7eb 100%)`
                  }}
                />
                <div className="text-center">
                  <span className="text-base sm:text-lg font-semibold">{formData.severity || 5}/10</span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm sm:text-base font-medium text-gray-900">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Additional details, notes, or observations..."
              rows={3}
              className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none touch-manipulation"
            />
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-700 text-sm sm:text-sm font-medium touch-manipulation py-2"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm sm:text-base font-medium text-gray-900">Category</label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="e.g., Respiratory, Cardiovascular, Mental Health"
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                />
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="text-sm sm:text-base font-medium text-gray-900">Tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    className="flex-1 px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 touch-manipulation text-sm sm:text-base"
                  >
                    Add
                  </button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-2 sm:py-1 bg-blue-100 text-blue-800 rounded-full text-sm touch-manipulation"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-blue-600 touch-manipulation p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Type-specific metadata */}
              {formData.type === 'medication' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm sm:text-base font-medium text-gray-900">Dosage</label>
                    <input
                      type="text"
                      value={formData.metadata?.dosage || ''}
                      onChange={(e) => handleMetadataChange('dosage', e.target.value)}
                      placeholder="e.g., 10mg, 2 tablets"
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm sm:text-base font-medium text-gray-900">Route</label>
                    <select
                      value={formData.metadata?.route || ''}
                      onChange={(e) => handleMetadataChange('route', e.target.value)}
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                    >
                      <option value="">Select route</option>
                      <option value="oral">Oral</option>
                      <option value="topical">Topical</option>
                      <option value="injection">Injection</option>
                      <option value="inhalation">Inhalation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              )}

              {formData.type === 'measurement' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm sm:text-base font-medium text-gray-900">Value</label>
                    <input
                      type="text"
                      value={formData.metadata?.value || ''}
                      onChange={(e) => handleMetadataChange('value', e.target.value)}
                      placeholder="e.g., 120/80, 98.6°F, 150 lbs"
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm sm:text-base font-medium text-gray-900">Unit</label>
                    <input
                      type="text"
                      value={formData.metadata?.unit || ''}
                      onChange={(e) => handleMetadataChange('unit', e.target.value)}
                      placeholder="e.g., mmHg, °F, lbs"
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-4 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation text-base sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.title.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-4 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base sm:text-base"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {submitting ? 'Saving...' : (existingEvent ? 'Update Event' : 'Save Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HealthEventModal;