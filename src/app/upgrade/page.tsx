'use client';

import { useUser } from '@clerk/nextjs';
import PricingCard from '@/components/PricingCard';

export default function UpgradePage() {
  const { user } = useUser();

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      alert('Please sign in to upgrade your subscription.');
      return;
    }

    try {
      // Map plan to Stripe price ID
      const priceId = planId === 'pro' 
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1234567890abcdef_pro_monthly'
        : process.env.NEXT_PUBLIC_STRIPE_FAMILY_PRICE_ID || 'price_1234567890abcdef_family_monthly';

      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert(`Error processing upgrade: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upgrade Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get unlimited health reports and premium features with our Pro or Family plans
          </p>
        </div>

        {/* Current Plan Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Plan</h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Free Plan</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
              Active
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            5 health reports per month
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <PricingCard
            title="Pro Plan"
            price="$19/month"
            features={[
              "Unlimited health reports",
              "Priority AI analysis",
              "Advanced health insights",
              "Email support",
              "Export reports to PDF"
            ]}
            buttonText="Upgrade to Pro"
            onButtonClick={() => handleUpgrade('pro')}
            isPopular={true}
          />
          
          <PricingCard
            title="Family Plan"
            price="$39/month"
            features={[
              "Everything in Pro Plan",
              "Up to 5 family members",
              "Family health dashboard",
              "Shared health insights",
              "Priority support"
            ]}
            buttonText="Upgrade to Family"
            onButtonClick={() => handleUpgrade('family')}
          />
        </div>

        {/* Benefits Section */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Upgrade?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unlimited Reports</h3>
              <p className="text-gray-600">Generate as many health reports as you need, whenever you need them.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Priority Analysis</h3>
              <p className="text-gray-600">Get faster, more detailed AI analysis with priority processing.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Family Support</h3>
              <p className="text-gray-600">Manage health reports for your entire family in one place.</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. You&apos;ll continue to have access to premium features until the end of your billing period.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens to my free reports when I upgrade?
              </h3>
              <p className="text-gray-600">
                When you upgrade, you&apos;ll get unlimited reports immediately. Your previous reports will remain accessible in your dashboard.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is my health data secure?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use enterprise-grade encryption and follow HIPAA compliance standards to protect your health information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}