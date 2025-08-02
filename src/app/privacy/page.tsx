import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">Last updated: December 23, 2024</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          
          {/* Important Notice */}
          <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-black">
                  Your Privacy Matters
                </h3>
                <div className="mt-2 text-sm text-black">
                  <p>
                    We are committed to protecting your health information with the highest standards of security and privacy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="prose prose-gray max-w-none text-black">
            
            <h2>1. Introduction and Legal Commitment</h2>
            <p>
              DiagnoGenie (&quot;Company,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is legally committed to protecting your privacy and personal health information. 
              This Privacy Policy constitutes a binding legal agreement between you and DiagnoGenie regarding the collection, use, disclosure, 
              and protection of your information when you use our AI-powered health diagnostic service (&quot;Service&quot;).
            </p>
            <p>
              <strong>BY USING OUR SERVICE, YOU EXPRESSLY CONSENT TO THE PRACTICES DESCRIBED IN THIS PRIVACY POLICY.</strong> 
              If you do not agree with any part of this policy, you must discontinue use of our Service immediately.
            </p>

            <h2>2. Our Absolute Data Protection Commitment</h2>
            
            <div className="bg-gray-50 border-2 border-gray-300 p-6 rounded-lg mb-6">
              <h3 className="text-black font-bold text-lg mb-4">🛡️ IRONCLAD DATA PROTECTION GUARANTEE</h3>
              <div className="space-y-3 text-black font-semibold">
                <p>✅ <strong>WE NEVER SELL YOUR DATA</strong> - Not to anyone, for any reason, at any price</p>
                <p>✅ <strong>WE NEVER SHARE WITHOUT CONSENT</strong> - Your data stays with us unless legally required</p>
                <p>✅ <strong>WE NEVER USE FOR MARKETING</strong> - No third-party advertising or profiling</p>
                <p>✅ <strong>WE NEVER GIVE TO INSURANCE</strong> - Your health data will never reach insurance companies</p>
                <p>✅ <strong>WE NEVER SELL TO EMPLOYERS</strong> - Your employer will never get your health information</p>
                <p>✅ <strong>BANK-LEVEL ENCRYPTION</strong> - Military-grade security protects your data 24/7</p>
              </div>
            </div>

            <h3>2.1 Legal Binding Commitment</h3>
            <p>
              <strong>THIS IS A LEGALLY BINDING COMMITMENT:</strong> We hereby covenant and warrant that we will not, 
              under any circumstances, sell, rent, lease, or otherwise monetize your personal or health information. 
              Any violation of this commitment shall constitute a material breach of this agreement, entitling you to 
              legal remedies including but not limited to damages, injunctive relief, and attorney&apos;s fees.
            </p>

            <h3>2.2 Zero Tolerance Policy</h3>
            <p>
              We maintain a zero-tolerance policy regarding unauthorized data sharing. Any employee, contractor, 
              or third party found to have violated our data protection standards will face immediate termination 
              and potential legal action. We conduct regular audits and monitoring to ensure compliance.
            </p>

            <h2>3. Information We Collect (Minimal Data Principle)</h2>
            
            <h3>2.1 Health Information</h3>
            <ul>
              <li>Symptoms and health concerns you report</li>
              <li>Medical history information you provide</li>
              <li>Health reports and analysis results</li>
              <li>Usage patterns and interaction data</li>
            </ul>

            <h3>2.2 Personal Information</h3>
            <ul>
              <li>Name and email address</li>
              <li>Account credentials</li>
              <li>Payment information (processed securely by third parties)</li>
              <li>Communication preferences</li>
            </ul>

            <h3>2.3 Technical Information</h3>
            <ul>
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Usage analytics and performance data</li>
              <li>Cookies and similar technologies</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            
            <h3>3.1 Primary Purposes</h3>
            <ul>
              <li>Provide AI-powered health analysis and reports</li>
              <li>Improve our diagnostic algorithms and accuracy</li>
              <li>Maintain and improve our service quality</li>
              <li>Provide customer support and assistance</li>
            </ul>

            <h3>3.2 Secondary Purposes</h3>
            <ul>
              <li>Send important service updates and notifications</li>
              <li>Conduct research to advance healthcare technology (anonymized data only)</li>
              <li>Comply with legal obligations and regulations</li>
              <li>Prevent fraud and ensure service security</li>
            </ul>

            <h2>4. Data Security and Protection</h2>
            
            <h3>4.1 Security Measures</h3>
            <p>We implement industry-standard security measures including:</p>
            <ul>
              <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using AES-256 encryption</li>
              <li><strong>Access Controls:</strong> Strict access controls and authentication requirements</li>
              <li><strong>Regular Audits:</strong> Regular security audits and vulnerability assessments</li>
              <li><strong>Secure Infrastructure:</strong> Cloud infrastructure with enterprise-grade security</li>
            </ul>

            <h3>4.2 HIPAA Compliance</h3>
            <p>
              We are committed to HIPAA compliance and treat all health information as Protected Health Information (PHI). 
              We have implemented appropriate administrative, physical, and technical safeguards to protect your health information.
            </p>

            <h2>8. Information Sharing and Disclosure (Strict Prohibitions)</h2>
            
            <h3>8.1 ABSOLUTE PROHIBITIONS - WE WILL NEVER:</h3>
            <div className="bg-gray-100 border-2 border-gray-300 p-6 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-semibold text-black">
                <div>❌ Sell your data to ANYONE</div>
                <div>❌ Share with insurance companies</div>
                <div>❌ Provide to employers</div>
                <div>❌ Give to marketing companies</div>
                <div>❌ Share with data brokers</div>
                <div>❌ Sell to pharmaceutical companies</div>
                <div>❌ Provide to social media platforms</div>
                <div>❌ Share with government (except legal requirement)</div>
                <div>❌ Give to family members without consent</div>
                <div>❌ Share with healthcare providers without consent</div>
                <div>❌ Provide to researchers without anonymization</div>
                <div>❌ Use for any commercial purpose beyond our service</div>
              </div>
            </div>

            <h3>8.2 Legal Enforcement of Prohibitions</h3>
            <p>
              <strong>LEGALLY ENFORCEABLE PROMISE:</strong> The above prohibitions are legally binding commitments. 
              Any violation constitutes breach of contract and breach of fiduciary duty. You may seek legal remedies including:
            </p>
            <ul>
              <li>Monetary damages (actual and punitive)</li>
              <li>Injunctive relief to stop further violations</li>
              <li><strong>Attorney&apos;s fees and court costs</strong></li>
              <li>Statutory damages under applicable privacy laws</li>
            </ul>

            <h3>8.3 Extremely Limited Sharing (Only When Legally Required)</h3>
            <p>
              We may only disclose your information in these specific, legally mandated circumstances:
            </p>
            <ul>
              <li><strong>Court Orders:</strong> When compelled by valid court order or subpoena (we will notify you unless legally prohibited)</li>
              <li><strong>Legal Compliance:</strong> When required by federal or state law (we will challenge overly broad requests)</li>
              <li><strong>Emergency Situations:</strong> Only to prevent imminent physical harm (documented emergency only)</li>
              <li><strong>Service Providers:</strong> Minimal data to essential service providers under strict confidentiality agreements</li>
            </ul>

            <h3>8.4 Your Right to Legal Notice</h3>
            <p>
              <strong>ADVANCE NOTICE GUARANTEE:</strong> Except where legally prohibited, we will provide you with advance notice 
              of any legal request for your information, giving you the opportunity to challenge the request in court. 
              We will not voluntarily cooperate with fishing expeditions or overly broad requests.
            </p>

            <h2>6. Your Rights and Choices</h2>
            
            <h3>6.1 Access and Control</h3>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal and health information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Export your data in a portable format</li>
              <li>Restrict certain uses of your information</li>
            </ul>

            <h3>6.2 Communication Preferences</h3>
            <p>You can:</p>
            <ul>
              <li>Opt out of marketing communications</li>
              <li>Choose notification preferences</li>
              <li>Update your contact information</li>
            </ul>

            <h2>7. Data Retention</h2>
            <p>
              We retain your information for as long as necessary to provide our services and comply with legal obligations:
            </p>
            <ul>
              <li><strong>Account Information:</strong> Until you delete your account</li>
              <li><strong>Health Reports:</strong> 7 years (standard medical record retention)</li>
              <li><strong>Usage Data:</strong> 2 years for service improvement</li>
              <li><strong>Legal Compliance:</strong> As required by applicable laws</li>
            </ul>

            <h2>8. International Data Transfers</h2>
            <p>
              Your information may be processed in countries other than your own. We ensure appropriate safeguards are in place 
              for international transfers, including:
            </p>
            <ul>
              <li>Adequacy decisions by relevant authorities</li>
              <li>Standard contractual clauses</li>
              <li>Certification schemes</li>
            </ul>

            <h2>9. Children&apos;s Privacy</h2>
            <p>
              Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. 
              If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>

            <h2>10. Cookies and Tracking Technologies</h2>
            
            <h3>10.1 Types of Cookies We Use</h3>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for basic service functionality</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use our service</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
            </ul>

            <h3>10.2 Managing Cookies</h3>
            <p>
              You can control cookies through your browser settings. However, disabling certain cookies may affect service functionality.
            </p>

            <h2>11. Third-Party Services</h2>
            <p>
              Our service may contain links to third-party websites or integrate with third-party services. 
              This Privacy Policy does not apply to third-party services, and we encourage you to review their privacy policies.
            </p>

            <h2>12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by:
            </p>
            <ul>
              <li>Posting the updated policy on our website</li>
              <li>Sending you an email notification</li>
              <li>Providing in-app notifications</li>
            </ul>

            <h2>18. Executive Accountability and Personal Guarantees</h2>
            
            <h3>18.1 CEO Personal Commitment</h3>
            <p>
              The Chief Executive Officer of DiagnoGenie personally guarantees compliance with this Privacy Policy. 
              Any violation of our data protection commitments will result in immediate executive accountability measures, 
              including potential personal liability for damages.
            </p>

            <h3>18.2 Board Oversight</h3>
            <p>
              Our Board of Directors maintains direct oversight of privacy compliance. Privacy violations are reported 
              directly to the board, and executive compensation is tied to privacy compliance metrics.
            </p>

            <h2>19. Final Commitment Statement</h2>
            
            <div className="bg-gray-100 border-2 border-gray-300 p-8 rounded-lg mb-8">
              <h3 className="text-xl font-bold mb-4 text-black">🛡️ OUR UNBREAKABLE PROMISE TO YOU</h3>
              <div className="space-y-3 text-black">
                <p className="font-semibold">Your health data is SACRED to us. We treat it with the same care we would want for our own family&apos;s health information.</p>
                <p>We will NEVER sell, share, or monetize your personal health data. This is not just a business policy - it&apos;s a moral and legal commitment.</p>
                <p>If we ever violate this promise, we will face the full consequences under law, including personal accountability from our executives.</p>
                <p className="text-lg font-bold">Your privacy is not negotiable. Period.</p>
              </div>
            </div>

            <h2>20. Contact Information and Legal Department</h2>
            <p>
              For any privacy concerns, questions, or to report violations, contact us immediately:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold mb-2">Privacy Department</h4>
                  <p><strong>Chief Privacy Officer:</strong> privacy@diagnogenie.com</p>
                  <p><strong>Privacy Hotline:</strong> 1-800-PRIVACY (24/7)</p>
                  <p><strong>Legal Department:</strong> legal@diagnogenie.com</p>
                </div>
                <div>
                  <h4 className="font-bold mb-2">Executive Contact</h4>
                  <p><strong>CEO Direct Line:</strong> ceo@diagnogenie.com</p>
                  <p><strong>General Counsel:</strong> counsel@diagnogenie.com</p>
                  <p><strong>Compliance Officer:</strong> compliance@diagnogenie.com</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p><strong>Mailing Address:</strong> [Your Business Address]</p>
                <p><strong>Emergency Privacy Line:</strong> [Your Contact Number]</p>
                <p><strong>Response Time Guarantee:</strong> We will respond to privacy inquiries within 24 hours</p>
              </div>
            </div>

            <h2>15. Legal Remedies and Enforcement</h2>
            
            <h3>15.1 Your Legal Rights in Case of Violation</h3>
            <p>
              If we violate any provision of this Privacy Policy, you have the following legal remedies:
            </p>
            <div className="bg-gray-50 border-l-4 border-gray-400 p-6 mb-6">
              <h4 className="font-bold text-black mb-3">💼 Available Legal Actions:</h4>
              <ul className="space-y-2 text-black">
                <li><strong>Breach of Contract Lawsuit:</strong> Sue for damages caused by our breach of this agreement</li>
                <li><strong>Privacy Law Claims:</strong> File claims under CCPA, GDPR, HIPAA, and other applicable privacy laws</li>
                <li><strong>Class Action Participation:</strong> Join or initiate class action lawsuits for widespread violations</li>
                <li><strong>Injunctive Relief:</strong> Seek court orders to stop ongoing violations</li>
                <li><strong>Statutory Damages:</strong> Claim damages as provided by applicable privacy statutes</li>
                <li><strong>Attorney&apos;s Fees:</strong> Recover your legal costs if you prevail in court</li>
              </ul>
            </div>

            <h3>15.2 Liquidated Damages Clause</h3>
            <p>
              <strong>LIQUIDATED DAMAGES:</strong> In recognition that privacy violations cause harm that is difficult to quantify, 
              we agree that any unauthorized disclosure of your personal health information shall result in liquidated damages 
              of no less than $10,000 per incident, plus actual damages, attorney&apos;s fees, and costs.
            </p>

            <h3>15.3 Waiver of Arbitration for Privacy Claims</h3>
            <p>
              <strong>COURT ACCESS GUARANTEE:</strong> Notwithstanding any other agreement, you have the absolute right to pursue 
              privacy violation claims in federal or state court. We waive any right to force arbitration for privacy-related disputes.
            </p>

            <h3>15.4 Statute of Limitations Extension</h3>
            <p>
              We agree that the statute of limitations for privacy violation claims shall not begin to run until you discover 
              or reasonably should have discovered the violation, regardless of when the violation actually occurred.
            </p>

            <h2>16. Data Breach Notification and Response</h2>
            
            <h3>16.1 Immediate Notification Promise</h3>
            <p>
              <strong>72-HOUR NOTIFICATION GUARANTEE:</strong> In the event of any data breach affecting your information, 
              we will notify you within 72 hours of discovery via email, phone, and postal mail. We will not delay notification 
              for any reason except where prohibited by law enforcement.
            </p>

            <h3>16.2 Breach Response Commitment</h3>
            <p>In case of a data breach, we commit to:</p>
            <ul>
              <li>Immediate containment and investigation</li>
              <li>Free credit monitoring for affected users (minimum 2 years)</li>
              <li>Identity theft protection services</li>
              <li>Legal assistance for affected users</li>
              <li>Full transparency about the scope and cause of the breach</li>
              <li>Independent security audit and public reporting of results</li>
            </ul>

            <h2>17. Governing Law and Jurisdiction</h2>

            <h2>14. State-Specific Rights</h2>
            
            <h3>14.1 California Residents (CCPA)</h3>
            <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act:</p>
            <ul>
              <li>Right to know what personal information is collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the sale of personal information</li>
              <li>Right to non-discrimination for exercising your rights</li>
            </ul>

            <h3>14.2 European Residents (GDPR)</h3>
            <p>If you are in the European Union, you have rights under the General Data Protection Regulation:</p>
            <ul>
              <li>Right of access to your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
            </ul>

            <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mt-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-black">
                    Our Commitment
                  </h3>
                  <div className="mt-2 text-sm text-black">
                    <p>
                      We are committed to transparency and protecting your privacy. Your health information is never sold, 
                      and we use it only to provide you with the best possible health insights.
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