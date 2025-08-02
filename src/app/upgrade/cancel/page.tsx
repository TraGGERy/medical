'use client';

import Link from 'next/link';

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 text-gray-400 mx-auto mb-6">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Checkout Cancelled
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your subscription upgrade was cancelled. No charges were made to your account.
        </p>
        
        <div className="space-y-3">
          <Link 
            href="/upgrade"
            className="block w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-teal-600 transition"
          >
            Try Again
          </Link>
          
          <Link 
            href="/dashboard"
            className="block w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            Back to Dashboard
          </Link>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Have questions about our plans?{' '}
            <a href="mailto:support@diagnogenie.com" className="text-blue-600 hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}