'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import FeatureCard from '@/components/FeatureCard';
import ProcessStep from '@/components/ProcessStep';
import Testimonial from '@/components/Testimonial';
import UrgencyBanner from '@/components/UrgencyBanner';
import PricingCard from '@/components/PricingCard';
import Header from '@/components/Header';

export default function LandingPage() {
  const router = useRouter();

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
              Get Your Health Insights in 
              <span className="text-yellow-300 block sm:inline"> 2 Minutes</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl mb-4 opacity-90 max-w-3xl mx-auto">
              AI-powered symptom analysis to help you understand your health better.
            </p>
            <p className="text-xs sm:text-sm mb-6 sm:mb-8 opacity-80 px-4">
              ✅ AI-Powered Analysis • ✅ HIPAA Compliant • ✅ Educational Health Insights
            </p>
            
            {/* Value Proposition */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 max-w-2xl mx-auto">
              <p className="text-base sm:text-lg font-semibold mb-2">🎯 What you get:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm sm:text-base text-left">
                <div>• AI symptom analysis</div>
                <div>• Health insights & education</div>
                <div>• Wellness recommendations</div>
                <div>• When to seek medical care</div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center items-center">
              <Button 
                onClick={handleHealthCheck}
                size="lg"
                className="animate-pulse-glow text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
              >
                🚀 Get FREE Health Insights Now
              </Button>
              <div className="text-xs sm:text-sm opacity-80 mt-4 sm:mt-0">
                <p>⏰ Takes less than 2 minutes</p>
                <p>💳 No credit card required</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 animate-fade-in-up">How MediScope AI Works</h2>
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
              description="Gemini 2.5 + o3 models process data and generate insights."
              delay={400}
            />
            <ProcessStep
              step={3}
              title="Get Your Insights"
              description="Receive a detailed health insights report with wellness recommendations."
              delay={600}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 animate-fade-in-up">Why Choose MediScope AI?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard
              icon="⚡"
              title="Instant Insights"
              description="Get health analysis in minutes, anytime, anywhere."
              delay={100}
            />
            <FeatureCard
              icon="🔍"
              title="AI-Powered Analysis"
              description="Powered by cutting-edge AI for educational health insights."
              delay={200}
            />
            <FeatureCard
              icon="🔒"
              title="Private & Secure"
              description="Your data is encrypted and HIPAA/GDPR compliant."
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* Social Proof & Testimonials */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Join 50,000+ People Who Trust MediScope AI</h2>
            <p className="text-gray-600">Real stories from real users</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
            <Testimonial
              name="Sarah Johnson"
              role="Working Mom"
              content="Saved me a 3-hour ER visit! The AI correctly identified my symptoms and told me it wasn't urgent. Got the right treatment the next day."
              avatar="SJ"
              rating={5}
            />
            <Testimonial
              name="Dr. Michael Chen"
              role="Family Physician"
              content="I recommend this to my patients for initial screening. The accuracy is impressive and helps them make informed decisions about seeking care."
              avatar="MC"
              rating={5}
            />
            <Testimonial
              name="Emma Rodriguez"
              role="College Student"
              content="As someone without insurance, this was a lifesaver. Got a detailed report for free and knew exactly what to do next."
              avatar="ER"
              rating={5}
            />
          </div>

          {/* Stats with social proof */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 text-center">
            <div className="animate-fade-in-up">
              <div className="text-4xl font-bold text-blue-600 mb-2">AI</div>
              <p className="text-gray-600">Powered Analysis</p>
              <p className="text-xs text-gray-500">Advanced health insights</p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="text-4xl font-bold text-blue-600 mb-2">&lt;2min</div>
              <p className="text-gray-600">Average Analysis Time</p>
              <p className="text-xs text-gray-500">Quick health insights</p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
              <p className="text-gray-600">Users Helped</p>
              <p className="text-xs text-gray-500">Growing community</p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
              <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <p className="text-gray-600">Available</p>
              <p className="text-xs text-gray-500">Anytime health insights</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Get 5 FREE Reports Every Month</h2>
            <p className="text-gray-600">Choose your plan - upgrade anytime for unlimited reports</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <PricingCard
              title="Free Plan"
              price="$0"
              features={[
                "5 Free health reports per month",
                "Basic symptom analysis",
                "General recommendations",
                "Email support"
              ]}
              buttonText="Start Free Plan"
              onButtonClick={handleHealthCheck}
            />
            
            <PricingCard
              title="Pro Plan"
              price="$9.99"
              originalPrice="$19.99"
              features={[
                "Unlimited health reports",
                "Advanced AI analysis",
                "Detailed treatment plans",
                "Priority support",
                "Lab report analysis",
                "Follow-up tracking"
              ]}
              isPopular={true}
              buttonText="Get Pro Access"
              onButtonClick={handleEarlyAccess}
            />
            
            <PricingCard
              title="Family Plan"
              price="$19.99"
              originalPrice="$39.99"
              features={[
                "Up to 5 family members",
                "All Pro features",
                "Family health dashboard",
                "Pediatric analysis",
                "24/7 phone support"
              ]}
              buttonText="Choose Family"
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
            Don't Wait Until It's Too Late
          </h2>
          <p className="mb-6 text-base sm:text-lg opacity-90 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Early detection saves lives. Get your health report now - completely FREE.
          </p>
          
          {/* Risk Reversal */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 max-w-2xl mx-auto">
            <h3 className="font-bold mb-4 text-base sm:text-lg">🛡️ Our Promise to You:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
              <div>✅ 5 Free reports every month</div>
              <div>✅ No hidden fees</div>
              <div>✅ Cancel anytime</div>
              <div>✅ HIPAA compliant</div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Button 
              onClick={handleHealthCheck}
              size="lg"
              className="animate-pulse-glow text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
            >
              🚨 Get My 5 FREE Health Reports Now
            </Button>
          </div>
          
          <div className="mt-6 text-xs sm:text-sm opacity-80 space-y-1">
            <p>⚡ Over 500 people used this in the last 24 hours</p>
            <p>🔒 Your data is 100% secure and private</p>
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
              <p className="text-gray-600">Our AI provides educational health insights based on advanced algorithms. However, it's designed to supplement, not replace, professional medical advice. Always consult healthcare professionals for medical decisions.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="font-semibold mb-2">Is my health data secure?</h3>
              <p className="text-gray-600">Absolutely. We're HIPAA and GDPR compliant with bank-level encryption. Your data is never shared or sold.</p>
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
