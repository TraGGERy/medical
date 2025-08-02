'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface SubscriptionInfo {
  planName: string;
  maxReports: number | null;
  currentReports: number;
  isUnlimited: boolean;
  status: string;
}

export default function SubscriptionStatus() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    planName: 'Free Plan',
    maxReports: 5,
    currentReports: 0,
    isUnlimited: false,
    status: 'active'
  });

  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        const response = await fetch('/api/subscription/status');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionInfo(data);
        } else {
          console.error('Failed to fetch subscription status');
        }
      } catch (error) {
        console.error('Error fetching subscription info:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchSubscriptionInfo();
    }
  }, [user?.id]);

  const getProgressPercentage = () => {
    if (subscriptionInfo.isUnlimited) return 0;
    if (!subscriptionInfo.maxReports) return 0;
    return Math.min(100, (subscriptionInfo.currentReports / subscriptionInfo.maxReports) * 100);
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage < 70) return 'bg-green-500';
    if (percentage < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleManageBilling = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to access billing portal');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No billing portal URL received');
      }
    } catch (error) {
      console.error('Error accessing billing portal:', error);
      alert(`Error accessing billing portal: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Subscription Status</h2>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading subscription info...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{subscriptionInfo.planName}</p>
              <p className="text-sm text-gray-600">
                {subscriptionInfo.isUnlimited 
                  ? 'Unlimited reports' 
                  : `${subscriptionInfo.currentReports} of ${subscriptionInfo.maxReports} reports used this month`}
              </p>
            </div>
            
            {!subscriptionInfo.isUnlimited && subscriptionInfo.maxReports && (
              <div className="bg-gray-100 text-xs font-medium text-gray-800 px-2.5 py-1 rounded-full">
                {subscriptionInfo.maxReports - subscriptionInfo.currentReports} remaining
              </div>
            )}
          </div>
          
          {!subscriptionInfo.isUnlimited && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`${getProgressColor()} h-2.5 rounded-full transition-all duration-500`}
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          )}
          
          {subscriptionInfo.planName === 'Free Plan' && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-3">Upgrade for unlimited reports and advanced features</p>
              <button 
                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white py-2 rounded-xl font-medium hover:from-blue-700 hover:to-teal-600 transition"
                onClick={() => window.location.href = '/upgrade'}
              >
                Upgrade Now
              </button>
            </div>
          )}

          {subscriptionInfo.planName !== 'Free Plan' && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button 
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-xl font-medium hover:bg-gray-200 transition"
                onClick={handleManageBilling}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Manage Billing'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}