'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Heart, Zap, Moon, AlertCircle, Pill, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

interface DailyCheckinFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  existingCheckin?: DailyCheckin | null;
  onSubmitSuccess?: () => void;
}

interface DailyCheckin {
  id?: string;
  date: string;
  mood: number;
  energy: number;
  sleepQuality: number;
  sleepHours?: number;
  symptoms: string[];
  medications: string[];
  notes?: string;
}

interface SymptomOption {
  id: string;
  name: string;
  category: string;
}

interface MedicationOption {
  id: string;
  name: string;
  dosage?: string;
}

const DailyCheckinForm: React.FC<DailyCheckinFormProps> = ({
  isOpen,
  onClose,
  selectedDate = new Date(),
  existingCheckin,
  onSubmitSuccess
}) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<DailyCheckin>({
    date: format(selectedDate, 'yyyy-MM-dd'),
    mood: 5,
    energy: 5,
    sleepQuality: 5,
    sleepHours: 8,
    symptoms: [],
    medications: [],
    notes: ''
  });

  // Available options
  const [availableSymptoms, setAvailableSymptoms] = useState<SymptomOption[]>([]);
  const [availableMedications, setAvailableMedications] = useState<MedicationOption[]>([]);
  
  // UI state
  const [customSymptom, setCustomSymptom] = useState('');
  const [customMedication, setCustomMedication] = useState('');
  const [showCustomSymptom, setShowCustomSymptom] = useState(false);
  const [showCustomMedication, setShowCustomMedication] = useState(false);

  // Load existing data when component mounts or existing checkin changes
  useEffect(() => {
    if (existingCheckin) {
      setFormData({
        ...existingCheckin,
        symptoms: existingCheckin.symptoms || [],
        medications: existingCheckin.medications || []
      });
    } else {
      setFormData({
        date: format(selectedDate, 'yyyy-MM-dd'),
        mood: 5,
        energy: 5,
        sleepQuality: 5,
        sleepHours: 8,
        symptoms: [],
        medications: [],
        notes: ''
      });
    }
  }, [existingCheckin, selectedDate]);

  // Load available symptoms and medications
  useEffect(() => {
    if (isOpen && user) {
      loadAvailableOptions();
    }
  }, [isOpen, user]);

  const loadAvailableOptions = async () => {
    try {
      setLoading(true);
      
      // Load common symptoms
      const symptomsResponse = await fetch('/api/health-calendar/symptoms');
      if (symptomsResponse.ok) {
        const symptomsData = await symptomsResponse.json();
        setAvailableSymptoms(symptomsData.symptoms || []);
      }

      // Load user's medications
      const medicationsResponse = await fetch('/api/health-calendar/medications');
      if (medicationsResponse.ok) {
        const medicationsData = await medicationsResponse.json();
        setAvailableMedications(medicationsData.medications || []);
      }
    } catch (error) {
      console.error('Error loading options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (field: 'mood' | 'energy' | 'sleepQuality', value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSleepHoursChange = (value: number) => {
    setFormData(prev => ({ ...prev, sleepHours: Math.max(0, Math.min(24, value)) }));
  };

  const toggleSymptom = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const toggleMedication = (medication: string) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.includes(medication)
        ? prev.medications.filter(m => m !== medication)
        : [...prev.medications, medication]
    }));
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !formData.symptoms.includes(customSymptom.trim())) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, customSymptom.trim()]
      }));
      setCustomSymptom('');
      setShowCustomSymptom(false);
    }
  };

  const addCustomMedication = () => {
    if (customMedication.trim() && !formData.medications.includes(customMedication.trim())) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, customMedication.trim()]
      }));
      setCustomMedication('');
      setShowCustomMedication(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to save your check-in');
      return;
    }

    try {
      setSubmitting(true);
      
      const method = existingCheckin ? 'PUT' : 'POST';
      const url = existingCheckin 
        ? `/api/health-calendar/daily-checkins/${existingCheckin.id}`
        : '/api/health-calendar/daily-checkins';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save check-in');
      }

      await response.json();
      
      toast.success(existingCheckin ? 'Check-in updated successfully!' : 'Check-in saved successfully!');
      
      // Update streak if this is a new check-in
      if (!existingCheckin) {
        try {
          await fetch('/api/health-calendar/streaks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              streakType: 'daily_checkin',
              date: formData.date
            })
          });
        } catch (streakError) {
          console.error('Error updating streak:', streakError);
        }
      }
      
      onSubmitSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving check-in:', error);
      toast.error('Failed to save check-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSliderColor = (value: number): string => {
    if (value >= 8) return 'bg-green-500';
    if (value >= 6) return 'bg-yellow-500';
    if (value >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSliderEmoji = (field: string, value: number): string => {
    const emojis = {
      mood: ['😢', '😟', '😐', '😊', '😄'],
      energy: ['😴', '😪', '😐', '⚡', '🔥'],
      sleepQuality: ['😵', '😴', '😐', '😌', '😇']
    };
    
    const emojiSet = emojis[field as keyof typeof emojis] || emojis.mood;
    const index = Math.min(Math.floor((value - 1) / 2), emojiSet.length - 1);
    return emojiSet[Math.max(0, index)];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {existingCheckin ? 'Update' : 'Daily'} Check-in
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Mood, Energy, Sleep Quality Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Mood */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                  <label className="font-medium text-gray-900 text-sm sm:text-base">Mood</label>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl mb-2">
                    {getSliderEmoji('mood', formData.mood)}
                  </div>
                  <div className="text-base sm:text-lg font-semibold text-gray-700">
                    {formData.mood}/10
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.mood}
                  onChange={(e) => handleSliderChange('mood', parseInt(e.target.value))}
                  className="w-full h-3 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider touch-manipulation"
                  style={{
                    background: `linear-gradient(to right, ${getSliderColor(formData.mood)} 0%, ${getSliderColor(formData.mood)} ${(formData.mood - 1) * 11.11}%, #e5e7eb ${(formData.mood - 1) * 11.11}%, #e5e7eb 100%)`
                  }}
                />
              </div>

              {/* Energy */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  <label className="font-medium text-gray-900 text-sm sm:text-base">Energy</label>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl mb-2">
                    {getSliderEmoji('energy', formData.energy)}
                  </div>
                  <div className="text-base sm:text-lg font-semibold text-gray-700">
                    {formData.energy}/10
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.energy}
                  onChange={(e) => handleSliderChange('energy', parseInt(e.target.value))}
                  className="w-full h-3 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider touch-manipulation"
                  style={{
                    background: `linear-gradient(to right, ${getSliderColor(formData.energy)} 0%, ${getSliderColor(formData.energy)} ${(formData.energy - 1) * 11.11}%, #e5e7eb ${(formData.energy - 1) * 11.11}%, #e5e7eb 100%)`
                  }}
                />
              </div>

              {/* Sleep Quality */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  <label className="font-medium text-gray-900 text-sm sm:text-base">Sleep Quality</label>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl mb-2">
                    {getSliderEmoji('sleepQuality', formData.sleepQuality)}
                  </div>
                  <div className="text-base sm:text-lg font-semibold text-gray-700">
                    {formData.sleepQuality}/10
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.sleepQuality}
                  onChange={(e) => handleSliderChange('sleepQuality', parseInt(e.target.value))}
                  className="w-full h-3 sm:h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider touch-manipulation"
                  style={{
                    background: `linear-gradient(to right, ${getSliderColor(formData.sleepQuality)} 0%, ${getSliderColor(formData.sleepQuality)} ${(formData.sleepQuality - 1) * 11.11}%, #e5e7eb ${(formData.sleepQuality - 1) * 11.11}%, #e5e7eb 100%)`
                  }}
                />
              </div>
            </div>

            {/* Sleep Hours */}
            <div className="space-y-3">
              <label className="font-medium text-gray-900 text-sm sm:text-base">Hours of Sleep</label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleSleepHoursChange((formData.sleepHours || 8) - 0.5)}
                  className="p-3 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-50 touch-manipulation"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-xl sm:text-2xl font-semibold">{formData.sleepHours || 8}</span>
                  <span className="text-gray-600 ml-1 text-sm sm:text-base">hours</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSleepHoursChange((formData.sleepHours || 8) + 0.5)}
                  className="p-3 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-50 touch-manipulation"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Symptoms */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  <label className="font-medium text-gray-900 text-sm sm:text-base">Symptoms</label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomSymptom(!showCustomSymptom)}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded touch-manipulation"
                >
                  Add Custom
                </button>
              </div>
              
              {showCustomSymptom && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                    placeholder="Enter custom symptom"
                    className="flex-1 px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    onKeyPress={(e) => e.key === 'Enter' && addCustomSymptom()}
                  />
                  <button
                    type="button"
                    onClick={addCustomSymptom}
                    className="px-4 py-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base touch-manipulation"
                  >
                    Add
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {availableSymptoms.map(symptom => (
                  <button
                    key={symptom.id}
                    type="button"
                    onClick={() => toggleSymptom(symptom.name)}
                    className={`p-3 sm:p-2 text-xs sm:text-sm rounded-lg border transition-colors touch-manipulation ${
                      formData.symptoms.includes(symptom.name)
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {symptom.name}
                  </button>
                ))}
                
                {formData.symptoms.filter(s => !availableSymptoms.some(as => as.name === s)).map(symptom => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => toggleSymptom(symptom)}
                    className="p-3 text-sm rounded-lg border bg-red-50 border-red-300 text-red-700"
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            {/* Medications */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  <label className="font-medium text-gray-900 text-sm sm:text-base">Medications Taken</label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomMedication(!showCustomMedication)}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded touch-manipulation"
                >
                  Add Custom
                </button>
              </div>
              
              {showCustomMedication && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customMedication}
                    onChange={(e) => setCustomMedication(e.target.value)}
                    placeholder="Enter medication name"
                    className="flex-1 px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    onKeyPress={(e) => e.key === 'Enter' && addCustomMedication()}
                  />
                  <button
                    type="button"
                    onClick={addCustomMedication}
                    className="px-4 py-3 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base touch-manipulation"
                  >
                    Add
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {availableMedications.map(medication => (
                  <button
                    key={medication.id}
                    type="button"
                    onClick={() => toggleMedication(medication.name)}
                    className={`p-3 sm:p-2 text-xs sm:text-sm rounded-lg border transition-colors touch-manipulation ${
                      formData.medications.includes(medication.name)
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div>{medication.name}</div>
                    {medication.dosage && (
                      <div className="text-xs text-gray-500">{medication.dosage}</div>
                    )}
                  </button>
                ))}
                
                {formData.medications.filter(m => !availableMedications.some(am => am.name === m)).map(medication => (
                  <button
                    key={medication}
                    type="button"
                    onClick={() => toggleMedication(medication)}
                    className="p-3 text-sm rounded-lg border bg-blue-50 border-blue-300 text-blue-700"
                  >
                    {medication}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <label className="font-medium text-gray-900 text-sm sm:text-base">Additional Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes about your day, how you&apos;re feeling, or observations..."
                rows={4}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
              />
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base touch-manipulation"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {submitting ? 'Saving...' : (existingCheckin ? 'Update Check-in' : 'Save Check-in')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DailyCheckinForm;