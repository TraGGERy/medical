import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-600 mt-2">Last updated: December 23, 2024</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          
          {/* Important Notice */}
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  IMPORTANT MEDICAL DISCLAIMER
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    DiagnoGenie is NOT a substitute for professional medical advice, diagnosis, or treatment. 
                    Always seek the advice of qualified healthcare providers with any questions regarding medical conditions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="prose prose-gray max-w-none">
            
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using DiagnoGenie ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              DiagnoGenie is an AI-powered health information tool that provides general health insights based on symptoms you report. 
              The Service is designed for informational and educational purposes only.
            </p>

            <h3>What We Do:</h3>
            <ul>
              <li>Analyze symptoms using artificial intelligence</li>
              <li>Provide general health information</li>
              <li>Suggest when to seek medical attention</li>
              <li>Generate health reports for your reference</li>
            </ul>

            <h3>What We Do NOT Do:</h3>
            <ul>
              <li>Provide medical diagnoses</li>
              <li>Replace professional medical consultation</li>
              <li>Prescribe treatments or medications</li>
              <li>Offer emergency medical services</li>
            </ul>

            <h2>3. Medical Disclaimer and Limitations</h2>
            
            <h3>3.1 Not Medical Advice</h3>
            <p>
              <strong>THE SERVICE IS NOT INTENDED TO PROVIDE MEDICAL ADVICE, PROFESSIONAL DIAGNOSIS, OPINION, TREATMENT, OR SERVICES.</strong> 
              The information provided through the Service is for general informational purposes only and should not be considered medical advice.
            </p>

            <h3>3.2 No Doctor-Patient Relationship</h3>
            <p>
              Use of the Service does not create a doctor-patient relationship between you and DiagnoGenie, its operators, or any healthcare professionals 
              associated with the Service.
            </p>

            <h3>3.3 Accuracy Limitations</h3>
            <p>
              While we strive for accuracy, the AI-generated insights may not be complete, accurate, or applicable to your specific situation. 
              Medical conditions are complex and require professional evaluation.
            </p>

            <h3>3.4 Emergency Situations</h3>
            <p>
              <strong>IN CASE OF MEDICAL EMERGENCY, CALL EMERGENCY SERVICES (911 in the US) IMMEDIATELY.</strong> 
              Do not rely on the Service for emergency medical situations.
            </p>

            <h2>4. User Responsibilities</h2>
            
            <h3>4.1 Accurate Information</h3>
            <p>
              You agree to provide accurate and complete information when using the Service. Inaccurate information may lead to inappropriate suggestions.
            </p>

            <h3>4.2 Professional Consultation</h3>
            <p>
              You acknowledge that you should always consult with qualified healthcare professionals for:
            </p>
            <ul>
              <li>Any health concerns or symptoms</li>
              <li>Before making any medical decisions</li>
              <li>Before starting, stopping, or changing any treatment</li>
              <li>For proper medical diagnosis and treatment</li>
            </ul>

            <h3>4.3 Age Restrictions</h3>
            <p>
              The Service is intended for users 18 years and older. Users under 18 must have parental consent and supervision.
            </p>

            <h2>5. Privacy and Data Protection</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. 
              By using the Service, you consent to our data practices as described in our Privacy Policy.
            </p>

            <h2>6. Limitation of Liability</h2>
            <p>
              <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
            </p>
            <ul>
              <li>DiagnoGenie and its operators shall not be liable for any direct, indirect, incidental, special, or consequential damages</li>
              <li>We make no warranties about the accuracy, completeness, or reliability of the Service</li>
              <li>You use the Service at your own risk</li>
              <li>Our total liability shall not exceed the amount you paid for the Service in the past 12 months</li>
            </ul>

            <h2>7. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless DiagnoGenie, its operators, employees, and affiliates from any claims, damages, 
              or expenses arising from your use of the Service or violation of these Terms.
            </p>

            <h2>8. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by DiagnoGenie and are protected by international 
              copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h2>9. Prohibited Uses</h2>
            <p>You may not use the Service:</p>
            <ul>
              <li>For any unlawful purpose or to solicit others to unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material without our prior written consent</li>
              <li>To impersonate or attempt to impersonate the company, a company employee, another user, or any other person or entity</li>
              <li>In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful</li>
            </ul>

            <h2>10. Subscription and Payment Terms</h2>
            <p>
              Some features of the Service may require payment. By subscribing to paid features, you agree to pay all applicable fees. 
              Subscriptions automatically renew unless cancelled. Refunds are provided according to our refund policy.
            </p>

            <h2>11. Termination</h2>
            <p>
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, 
              under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>

            <h2>12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of any material changes. 
              Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
            </p>

            <h2>13. Governing Law</h2>
            <p>
              These Terms shall be interpreted and governed by the laws of [Your Jurisdiction], without regard to its conflict of law provisions. 
              Any disputes shall be resolved in the courts of [Your Jurisdiction].
            </p>

            <h2>14. Severability</h2>
            <p>
              If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted 
              to accomplish the objectives of such provision to the greatest extent possible under applicable law.
            </p>

            <h2>15. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <p><strong>Email:</strong> legal@diagnogenie.com</p>
              <p><strong>Address:</strong> [Your Business Address]</p>
              <p><strong>Phone:</strong> [Your Contact Number]</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Remember
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      DiagnoGenie is a tool to help you understand your health better, but it should never replace professional medical care. 
                      When in doubt, always consult with a healthcare professional.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}