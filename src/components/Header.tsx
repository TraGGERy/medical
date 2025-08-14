'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import Button from './Button';

export default function Header() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleGetStarted = () => {
    if (isSignedIn) {
      router.push('/dashboard');
    } else {
      router.push('/health-check');
    }
  };

  const handleHome = () => {
    router.push('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div 
            onClick={handleHome}
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-teal-500 rounded-xl flex items-center justify-center mr-2 sm:mr-3">
              <span className="text-white font-bold text-sm sm:text-lg">M</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">MediScope AI</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Health Diagnostics</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-8">
            <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              How It Works
            </a>
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Features
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Pricing
            </a>
            <a href="#faq" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              FAQ
            </a>
            <button 
              onClick={() => router.push('/telemedicine')}
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Telemedicine
            </button>
            {isSignedIn && (
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                Dashboard
              </button>
            )}
          </div>

          {/* Desktop Auth & CTA */}
          <div className="hidden sm:flex items-center space-x-4">
            {isSignedIn ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  Welcome, {user?.firstName || 'User'}
                </span>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                  afterSignOutUrl="/"
                />
              </div>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="hidden lg:block text-gray-600 hover:text-blue-600 transition-colors font-medium">
                    Sign In
                  </button>
                </SignInButton>
                <Button 
                  onClick={handleGetStarted}
                  variant="secondary"
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-teal-500 text-white hover:shadow-lg"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMobileMenu}
            className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg 
              className={`w-6 h-6 text-gray-600 transition-transform ${isMobileMenuOpen ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden mt-4 pb-4 border-t border-gray-100">
            <div className="flex flex-col space-y-4 pt-4">
              <button 
                onClick={() => handleMobileNavClick('#how-it-works')}
                className="text-left text-gray-600 hover:text-blue-600 transition-colors font-medium py-2"
              >
                How It Works
              </button>
              <button 
                onClick={() => handleMobileNavClick('#features')}
                className="text-left text-gray-600 hover:text-blue-600 transition-colors font-medium py-2"
              >
                Features
              </button>
              <button 
                onClick={() => handleMobileNavClick('#pricing')}
                className="text-left text-gray-600 hover:text-blue-600 transition-colors font-medium py-2"
              >
                Pricing
              </button>
              <button 
                onClick={() => handleMobileNavClick('#faq')}
                className="text-left text-gray-600 hover:text-blue-600 transition-colors font-medium py-2"
              >
                FAQ
              </button>
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push('/telemedicine');
                }}
                className="text-left text-gray-600 hover:text-blue-600 transition-colors font-medium py-2"
              >
                Telemedicine
              </button>
              {isSignedIn && (
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    router.push('/dashboard');
                  }}
                  className="text-left text-gray-600 hover:text-blue-600 transition-colors font-medium py-2"
                >
                  Dashboard
                </button>
              )}
              <div className="pt-4 border-t border-gray-100">
                <Button 
                  onClick={handleGetStarted}
                  variant="secondary"
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white hover:shadow-lg mb-3"
                >
                  {isSignedIn ? 'Go to Dashboard' : 'Get Started Free'}
                </Button>
                {!isSignedIn && (
                  <SignInButton mode="modal">
                    <button className="w-full text-center text-gray-600 hover:text-blue-600 transition-colors font-medium py-2">
                      Sign In
                    </button>
                  </SignInButton>
                )}
                {isSignedIn && (
                  <div className="flex items-center justify-center py-2">
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8"
                        }
                      }}
                      afterSignOutUrl="/"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      {user?.firstName || 'User'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}