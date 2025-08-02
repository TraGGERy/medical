'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface PrivacySettingsData {
  id?: string;
  userId?: string;
  dataEncryption: boolean;
  shareWithDoctors: boolean;
  anonymousAnalytics: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  dataRetention: string; // Changed from number to string
  thirdPartySharing: boolean;
  twoFactorEnabled: boolean;
}

interface Report {
  id: string;
  date: string;
  condition: string;
  status: 'Normal' | 'Attention' | 'Urgent';
  riskLevel: string;
}

export default function PrivacySettings() {
  const { user, isLoaded } = useUser();
  
  const [settings, setSettings] = useState<PrivacySettingsData>({
    dataEncryption: true,
    shareWithDoctors: false,
    anonymousAnalytics: true,
    emailNotifications: true,
    smsNotifications: false,
    dataRetention: '2-years', // Changed from 365 to '2-years'
    thirdPartySharing: false,
    twoFactorEnabled: false,
  });

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'all'>('single');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  // Fetch privacy settings and reports on component mount
  useEffect(() => {
    if (isLoaded && user) {
      console.log('User is authenticated:', user.id);
      fetchPrivacySettings();
      fetchReports();
    } else if (isLoaded && !user) {
      console.log('User is not authenticated');
      setLoading(false);
    }
  }, [isLoaded, user]);

  const fetchPrivacySettings = async () => {
    try {
      console.log('Fetching privacy settings...');
      const response = await fetch('/api/privacy-settings');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Privacy settings data:', data);
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch privacy settings:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/health-reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleSettingChange = async (setting: string, value: boolean | string) => {
    const newSettings = { ...settings, [setting]: value };
    setSettings(newSettings);
    
    // Auto-save settings
    await saveSettings(newSettings);
  };

  const saveSettings = async (settingsToSave: PrivacySettingsData) => {
    try {
      console.log('Attempting to save settings:', settingsToSave);
      
      const response = await fetch('/api/privacy-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsToSave),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError);
          throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }
        
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Settings saved successfully:', data);
      
      if (data.success && data.settings) {
        // Update local state with the saved settings
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      alert(`Failed to update privacy settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Revert the change on error
      fetchPrivacySettings();
    }
  };

  const handleReportSelection = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleDeleteReports = async () => {
    try {
      setDeleting(true);
      const response = await fetch('/api/delete-data', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: deleteType === 'all' ? 'all' : 'reports',
          reportIds: deleteType === 'single' ? selectedReports : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setSelectedReports([]);
        // Refresh reports list
        fetchReports();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      alert('Failed to delete data. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const exportData = async () => {
    try {
      setExporting(true);
      const response = await fetch('/api/export-data');
      
      if (response.ok) {
        // Get the filename from the response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `diagnogenie-data-export-${new Date().toISOString().split('T')[0]}.json`;
        
        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const element = document.createElement('a');
        element.href = url;
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        window.URL.revokeObjectURL(url);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading privacy settings...</span>
        </div>
      )}

      {/* Authentication Error */}
      {isLoaded && !user && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Authentication Required</h2>
          <p className="text-red-600">Please sign in to access your privacy settings.</p>
        </div>
      )}

      {/* Privacy Settings Content */}
      {isLoaded && user && !loading && (
        <>
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Privacy & Security Settings</h1>
            <p className="text-gray-600">Control how your health data is stored, shared, and protected</p>
          </div>

      {/* Data Encryption & Security */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Data Security</h2>
        
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-medium text-gray-800 text-sm sm:text-base">End-to-End Encryption</h3>
              <p className="text-xs sm:text-sm text-gray-600">Your data is encrypted both in transit and at rest</p>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 font-medium mr-2 text-sm">✓ Enabled</span>
              <div className="w-10 h-5 sm:w-12 sm:h-6 bg-green-500 rounded-full relative">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              Enable 2FA
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start">
              <span className="text-green-600 text-xl mr-3">🔒</span>
              <div>
                <h3 className="font-semibold text-green-800 mb-1">HIPAA Compliant</h3>
                <p className="text-sm text-green-700">
                  Your health data is protected according to HIPAA regulations and industry best practices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sharing Preferences */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Data Sharing Preferences</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">Share with Healthcare Providers</h3>
              <p className="text-sm text-gray-600">Allow doctors to access your reports when you share them</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.shareWithDoctors}
                onChange={(e) => handleSettingChange('shareWithDoctors', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">Anonymous Analytics</h3>
              <p className="text-sm text-gray-600">Help improve our AI by sharing anonymized data</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.anonymousAnalytics}
                onChange={(e) => handleSettingChange('anonymousAnalytics', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">Third-Party Sharing</h3>
              <p className="text-sm text-gray-600">Share data with research institutions (always anonymized)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.thirdPartySharing}
                onChange={(e) => handleSettingChange('thirdPartySharing', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Notification Preferences</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">Email Notifications</h3>
              <p className="text-sm text-gray-600">Receive report summaries and health tips via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">SMS Notifications</h3>
              <p className="text-sm text-gray-600">Receive urgent health alerts via text message</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Data Retention */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Data Retention</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How long should we keep your health data?
          </label>
          <select
            value={settings.dataRetention}
            onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="6-months">6 months</option>
            <option value="1-year">1 year</option>
            <option value="2-years">2 years</option>
            <option value="5-years">5 years</option>
            <option value="indefinite">Keep indefinitely</option>
          </select>
          <p className="text-sm text-gray-600 mt-2">
            After this period, your data will be automatically deleted unless you extend the retention period.
          </p>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Data Management</h2>
        
        <div className="space-y-6">
          {/* Export Data */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
            <div>
              <h3 className="font-medium text-gray-800">Export Your Data</h3>
              <p className="text-sm text-gray-600">Download all your health data in a portable format</p>
            </div>
            <button
              onClick={exportData}
              disabled={exporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? '📥 Exporting...' : '📥 Export Data'}
            </button>
          </div>

          {/* Delete Reports */}
          <div className="border border-red-200 rounded-xl p-4">
            <h3 className="font-medium text-red-800 mb-3">Delete Health Reports</h3>
            <p className="text-sm text-red-600 mb-4">
              Permanently delete selected reports or all your data. This action cannot be undone.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="deleteType"
                    value="single"
                    checked={deleteType === 'single'}
                    onChange={(e) => setDeleteType(e.target.value as 'single' | 'all')}
                    className="mr-2"
                  />
                  Delete selected reports
                </label>
              </div>
              
              {deleteType === 'single' && (
                <div className="ml-6 space-y-2 max-h-40 overflow-y-auto">
                  {reports.map((report) => (
                    <label key={report.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={() => handleReportSelection(report.id)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        {report.date} - {report.condition}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              
              <div>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="deleteType"
                    value="all"
                    checked={deleteType === 'all'}
                    onChange={(e) => setDeleteType(e.target.value as 'single' | 'all')}
                    className="mr-2"
                  />
                  Delete all my data permanently
                </label>
              </div>
            </div>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteType === 'single' && selectedReports.length === 0}
              className={`mt-4 px-4 py-2 rounded-xl font-medium transition-colors ${
                deleteType === 'single' && selectedReports.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              🗑️ Delete {deleteType === 'all' ? 'All Data' : `${selectedReports.length} Reports`}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-red-800 mb-4">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">
              {deleteType === 'all' 
                ? 'Are you sure you want to permanently delete ALL your health data? This action cannot be undone.'
                : `Are you sure you want to permanently delete ${selectedReports.length} selected reports? This action cannot be undone.`
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteReports}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}