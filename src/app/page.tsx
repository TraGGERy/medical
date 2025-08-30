'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import AuthLoadingSpinner from '@/components/AuthLoadingSpinner';
import FeatureCard from '@/components/FeatureCard';
import ProcessStep from '@/components/ProcessStep';
import Testimonial from '@/components/Testimonial';
import UrgencyBanner from '@/components/UrgencyBanner';
import PricingCard from '@/components/PricingCard';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';

// Inline Button Component
const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    }
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    }
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  // Check authentication status and redirect if logged in
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        // Add a small delay for smooth transition before redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 800); // 800ms delay for smooth loading animation
        return;
      }
      // User is not logged in, show the landing page with smooth transition
      setTimeout(() => {
        setIsCheckingAuth(false);
      }, 600); // 600ms delay for smooth loading completion
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading spinner while checking authentication
  if (!isLoaded || isCheckingAuth) {
    return <AuthLoadingSpinner message="Loading your personalized experience..." />;
  }

  const handleHealthCheck = () => {
    router.push('/health-check');
  };

  const handleEarlyAccess = () => {
    router.push('/early-access');
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      {/* Navigation Header */}
      <Header />
      
      {/* Urgency Banner */}
      <UrgencyBanner />
      
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 to-teal-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20 text-center">
          <div className="animate-fade-in-up">
            {/* Social Proof Badge */}
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 mb-4 sm:mb-6">
              <span className="text-yellow-300 mr-2 text-sm sm:text-base">⭐⭐⭐⭐⭐</span>
              <span className="text-xs sm:text-sm">Trusted by 50,000+ users worldwide</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 animate-float leading-tight">
              Telemedicine Platform
              <span className="text-yellow-300 block">Healthcare at Your Fingertips</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl mb-4 opacity-90 max-w-3xl mx-auto">
              Connect with qualified healthcare providers from the comfort of your home. AI-powered symptom analysis meets virtual consultations.
            </p>
            <p className="text-xs sm:text-sm mb-6 sm:mb-8 opacity-80 px-4">
              ✅ Virtual Consultations • ✅ AI-Powered Analysis • ✅ HIPAA Compliant • ✅ Digital Prescriptions
            </p>
            
            {/* Value Proposition */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 max-w-2xl mx-auto">
              <p className="text-base sm:text-lg font-semibold mb-2">🎯 Complete Healthcare Solution:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm sm:text-base text-left">
                <div>• Virtual doctor consultations</div>
                <div>• AI symptom pre-screening</div>
                <div>• Digital prescriptions</div>
                <div>• Secure video calls</div>
                <div>• 24/7 health monitoring</div>
                <div>• Follow-up care tracking</div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center items-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  onClick={() => router.push('/telemedicine')}
                  size="lg"
                  className="animate-pulse-glow text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto bg-green-600 hover:bg-green-700"
                >
                  📞 Book Virtual Consultations
                </Button>
                <Button 
                  onClick={handleHealthCheck}
                  size="lg"
                  className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                >
                  🤖 AI Health Analysis
                </Button>
              </div>
              <div className="text-xs sm:text-sm opacity-80 mt-4">
                <p>⏰ Instant AI analysis • 📅 Same-day appointments available</p>
                <p>💳 No credit card required for AI analysis</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 animate-fade-in-up">How Our Telemedicine Platform Works</h2>
          
          {/* AI Analysis Flow */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-6 text-blue-600">🤖 AI-Powered Pre-Screening</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <ProcessStep
                step={1}
                title="Enter Your Symptoms"
                description="Type symptoms or upload lab reports for AI analysis."
                delay={200}
              />
              <ProcessStep
                step={2}
                title="AI Analysis"
                description="Advanced AI models process data and generate health insights."
                delay={400}
              />
              <ProcessStep
                step={3}
                title="Get Recommendations"
                description="Receive insights and recommendations for next steps."
                delay={600}
              />
            </div>
          </div>

          {/* Telemedicine Flow */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-green-600">📞 Virtual Consultation Process</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <ProcessStep
                step={1}
                title="Book Appointment"
                description="Schedule with certified healthcare providers based on your needs."
                delay={200}
              />
              <ProcessStep
                step={2}
                title="Pre-Consultation"
                description="Share AI analysis results and medical history securely."
                delay={400}
              />
              <ProcessStep
                step={3}
                title="Virtual Visit"
                description="Connect via secure video call for professional consultation."
                delay={600}
              />
              <ProcessStep
                step={4}
                title="Follow-Up Care"
                description="Receive digital prescriptions and ongoing care coordination."
                delay={800}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 animate-fade-in-up">Why Choose Our Telemedicine Platform?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard
              icon="👨‍⚕️"
              title="Certified Doctors"
              description="Connect with licensed healthcare providers available 24/7."
              delay={100}
            />
            <FeatureCard
              icon="🤖"
              title="AI-Powered Pre-Screening"
              description="Smart symptom analysis helps doctors understand your condition faster."
              delay={200}
            />
            <FeatureCard
              icon="📱"
              title="Seamless Experience"
              description="Book, consult, and follow-up all from your mobile device."
              delay={300}
            />
            <FeatureCard
              icon="💊"
              title="Digital Prescriptions"
              description="Receive prescriptions electronically and track your medications."
              delay={400}
            />
            <FeatureCard
              icon="🔒"
              title="HIPAA Compliant"
              description="Bank-level security ensures your health data stays private."
              delay={500}
            />
            <FeatureCard
              icon="⚡"
              title="Same-Day Appointments"
              description="Get care when you need it with flexible scheduling options."
              delay={600}
            />
          </div>
        </div>
      </section>

      {/* Social Proof & Testimonials */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Join 50,000+ People Who Trust Our Telemedicine Platform</h2>
            <p className="text-gray-600">Real stories from patients and healthcare providers</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
            <Testimonial
              name="Sarah Johnson"
              role="Working Mom"
              content="The AI pre-screening helped my doctor understand my symptoms before our video call. Got diagnosed and treated without leaving home!"
              avatar="SJ"
              rating={5}
            />
            <Testimonial
              name="Dr. Michael Chen"
              role="Telemedicine Provider"
              content="The AI analysis gives me valuable insights before consultations. My patients come prepared, making our virtual visits more efficient and effective."
              avatar="MC"
              rating={5}
            />
            <Testimonial
              name="Emma Rodriguez"
              role="College Student"
              content="Booked a same-day virtual appointment when I felt sick. The doctor prescribed medication digitally - so convenient and affordable!"
              avatar="ER"
              rating={5}
            />
          </div>

          {/* Stats with social proof */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 text-center">
            <div className="animate-fade-in-up">
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <p className="text-gray-600">Licensed Doctors</p>
              <p className="text-xs text-gray-500">Certified healthcare providers</p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="text-4xl font-bold text-green-600 mb-2">15min</div>
              <p className="text-gray-600">Average Wait Time</p>
              <p className="text-xs text-gray-500">Quick virtual consultations</p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
              <p className="text-gray-600">Patients Served</p>
              <p className="text-xs text-gray-500">Growing telemedicine community</p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
              <div className="text-4xl font-bold text-purple-600 mb-2">98%</div>
              <p className="text-gray-600">Satisfaction Rate</p>
              <p className="text-xs text-gray-500">Happy patients & providers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Affordable Healthcare Plans</h2>
            <p className="text-gray-600">AI analysis + virtual consultations - choose what works for you</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <PricingCard
              title="AI Analysis Only"
              price="$0"
              features={[
                "5 Free AI health reports per month",
                "Basic symptom analysis",
                "General recommendations",
                "Email support",
                "Health insights dashboard"
              ]}
              buttonText="Start Free Analysis"
              onButtonClick={handleHealthCheck}
            />
            
            <PricingCard
              title="Telemedicine Pro"
              price="$29.99"
              originalPrice="$49.99"
              features={[
                "Unlimited AI health reports",
                "2 Virtual consultations/month",
                "Digital prescriptions",
                "Priority doctor matching",
                "Lab report analysis",
                "24/7 chat support"
              ]}
              isPopular={true}
              buttonText="Get Telemedicine Access"
              onButtonClick={handleEarlyAccess}
            />
            
            <PricingCard
              title="Family Care Plan"
              price="$59.99"
              originalPrice="$99.99"
              features={[
                "Up to 5 family members",
                "Unlimited consultations",
                "Family health dashboard",
                "Pediatric & adult care",
                "Emergency consultation access",
                "Dedicated family coordinator"
              ]}
              buttonText="Choose Family Plan"
              onButtonClick={handleEarlyAccess}
            />
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">💳 No credit card required for free trial • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Risk Reversal & Final CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-teal-500 text-white py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 animate-fade-in-up">
            Healthcare When You Need It Most
          </h2>
          <p className="mb-6 text-base sm:text-lg opacity-90 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Don&apos;t wait for appointments. Get AI-powered health insights instantly or book a virtual consultation with certified doctors.
          </p>
          
          {/* Risk Reversal */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 max-w-2xl mx-auto">
            <h3 className="font-bold mb-4 text-base sm:text-lg">🛡️ Our Promise to You:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
              <div>✅ 5 Free AI reports monthly</div>
              <div>✅ Licensed healthcare providers</div>
              <div>✅ Same-day appointments</div>
              <div>✅ HIPAA compliant & secure</div>
              <div>✅ Digital prescriptions</div>
              <div>✅ Cancel anytime</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => router.push('/telemedicine')}
              size="lg"
              className="animate-pulse-glow text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              📞 Book Virtual Consultation
            </Button>
            <Button 
              onClick={handleHealthCheck}
              size="lg"
              className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
            >
              🤖 Get FREE AI Analysis
            </Button>
          </div>
          
          <div className="mt-6 text-xs sm:text-sm opacity-80 space-y-1">
            <p>⚡ Over 200 consultations completed today</p>
            <p>🔒 Your health data is 100% secure and private</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="font-semibold mb-2">Is this really free?</h3>
              <p className="text-gray-600">Yes! You get 5 free health reports every month with our Free Plan. No credit card required, no hidden fees.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="font-semibold mb-2">How reliable is the AI analysis?</h3>
              <p className="text-gray-600">Our AI provides educational health insights based on advanced algorithms. However, it&apos;s designed to supplement, not replace, professional medical advice. Always consult healthcare professionals for medical decisions.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="font-semibold mb-2">Is my health data secure?</h3>
              <p className="text-gray-600">Absolutely. We&apos;re HIPAA and GDPR compliant with bank-level encryption. Your data is never shared or sold.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="font-semibold mb-2">How long does it take?</h3>
              <p className="text-gray-600">Most users get their complete health report in under 2 minutes. Just describe your symptoms and get instant results.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">MediScope AI</h3>
              <p className="text-sm">AI-powered health diagnostics for everyone.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={handleHealthCheck} className="hover:text-white transition">Health Check</button></li>
                <li><button onClick={handleEarlyAccess} className="hover:text-white transition">Early Access</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="/privacy" className="hover:text-white transition">Privacy</a></li>
                <li><a href="/terms" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p>© 2025 MediScope AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
