'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  height: string;
  weight: string;
  bloodType: string;
  emergencyContact: string;
}

interface MedicalHistory {
  allergies: string[];
  medications: string[];
  conditions: string[];
  surgeries: string[];
  familyHistory: string[];
}

export default function ProfileSettings() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    height: '',
    weight: '',
    bloodType: '',
    emergencyContact: ''
  });

  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory>({
    allergies: [],
    medications: [],
    conditions: [],
    surgeries: [],
    familyHistory: []
  });

  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-sync user with database when component loads
  useEffect(() => {
    const syncUser = async () => {
      if (user) {
        try {
          // Sync user with database
          await fetch('/api/sync-user', {
            method: 'POST',
          });

          // Load user profile data
          await loadUserData();
        } catch (error) {
          console.error('Error syncing user:', error);
        }
      }
    };

    syncUser();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Set basic profile data from Clerk
      setProfile(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.emailAddresses[0]?.emailAddress || '',
      }));

      // Load medical history from database
      const response = await fetch('/api/user/medical-history');
      if (response.ok) {
        const data = await response.json();
        if (data.medicalHistory) {
          const history = data.medicalHistory;
          
          // Update profile with database data
          setProfile(prev => ({
            ...prev,
            phone: history.emergencyContact?.phone || '',
            dateOfBirth: history.dateOfBirth ? new Date(history.dateOfBirth).toISOString().split('T')[0] : '',
            gender: history.gender || '',
            height: history.height || '',
            weight: history.weight || '',
            bloodType: history.bloodType || '',
            emergencyContact: history.emergencyContact?.phone || ''
          }));

          // Update medical history
          setMedicalHistory({
            allergies: history.allergies || [],
            medications: history.medications || [],
            conditions: history.chronicConditions || [],
            surgeries: [],
            familyHistory: history.familyHistory || []
          });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const addItem = (category: keyof MedicalHistory, item: string, setter: (value: string) => void) => {
    if (item.trim()) {
      setMedicalHistory(prev => ({
        ...prev,
        [category]: [...prev[category], item.trim()]
      }));
      setter('');
    }
  };

  const removeItem = (category: keyof MedicalHistory, index: number) => {
    setMedicalHistory(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Prepare medical history data for database
      const medicalData = {
        allergies: medicalHistory.allergies,
        medications: medicalHistory.medications,
        chronicConditions: medicalHistory.conditions,
        familyHistory: medicalHistory.familyHistory,
        emergencyContact: {
          phone: profile.emergencyContact
        },
        bloodType: profile.bloodType,
        height: profile.height ? parseFloat(profile.height) : null,
        weight: profile.weight ? parseFloat(profile.weight) : null,
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
        gender: profile.gender
      };

      const response = await fetch('/api/user/medical-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(medicalData),
      });

      if (response.ok) {
        alert('Profile updated successfully! 🎉');
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Profile & Health Data</h1>
        <p className="text-gray-600">Manage your personal information and medical history</p>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6 text-black">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Personal Information</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={profile.firstName}
              onChange={(e) => handleProfileChange('firstName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) => handleProfileChange('lastName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => handleProfileChange('email', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => handleProfileChange('phone', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input
              type="date"
              value={profile.dateOfBirth}
              onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select
              value={profile.gender}
              onChange={(e) => handleProfileChange('gender', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
        </div>
      </div>

      {/* Physical Information */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6 text-black">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Physical Information</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
            <input
              type="number"
              value={profile.height}
              onChange={(e) => handleProfileChange('height', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
            <input
              type="number"
              value={profile.weight}
              onChange={(e) => handleProfileChange('weight', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
            <select
              value={profile.bloodType}
              onChange={(e) => handleProfileChange('bloodType', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select blood type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medical History */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6 text-black">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Medical History</h2>
        
        {/* Allergies */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Allergies</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              placeholder="Add new allergy"
              className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
            <button
              onClick={() => addItem('allergies', newAllergy, setNewAllergy)}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {medicalHistory.allergies.map((allergy, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
              >
                {allergy}
                <button
                  onClick={() => removeItem('allergies', index)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Current Medications */}
        <div className="mb-6 text-black">
          <label className="block text-sm font-medium text-gray-700 mb-3">Current Medications</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newMedication}
              onChange={(e) => setNewMedication(e.target.value)}
              placeholder="Add new medication"
              className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => addItem('medications', newMedication, setNewMedication)}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {medicalHistory.medications.map((medication, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {medication}
                <button
                  onClick={() => removeItem('medications', index)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Medical Conditions */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Past/Current Medical Conditions</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              placeholder="Add medical condition"
              className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => addItem('conditions', newCondition, setNewCondition)}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {medicalHistory.conditions.map((condition, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
              >
                {condition}
                <button
                  onClick={() => removeItem('conditions', index)}
                  className="ml-2 text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Emergency Contact</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone</label>
          <input
            type="tel"
            value={profile.emergencyContact}
            onChange={(e) => handleProfileChange('emergencyContact', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center sm:justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all text-sm sm:text-base ${
            isSaving
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-teal-500 text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {isSaving ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            '💾 Save Profile'
          )}
        </button>
      </div>
    </div>
  );
}