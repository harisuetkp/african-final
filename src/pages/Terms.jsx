import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Landing')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={24} />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Terms of Service</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Afrinnect Terms of Service</h2>
            <p className="text-sm text-gray-500">Last Updated: March 1, 2026</p>
          </div>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">1. Acceptance of Terms</h3>
            <p className="text-gray-700">
              By accessing and using Afrinnect, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">2. Eligibility</h3>
            <p className="text-gray-700">
              You must be at least 18 years old to use Afrinnect. By creating an account, you represent that you are of legal age to form a binding contract.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">3. Account Responsibilities</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You agree to provide accurate, current information in your profile</li>
              <li>You may not impersonate others or create fake profiles</li>
              <li>One person, one account - multiple accounts are prohibited</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">4. Prohibited Conduct</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Harassment, hate speech, or discriminatory behavior</li>
              <li>Sharing explicit content without consent</li>
              <li>Scamming, fraud, or soliciting money</li>
              <li>Promoting illegal activities</li>
              <li>Using the platform for commercial purposes without permission</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">5. Content Ownership</h3>
            <p className="text-gray-700">
              You retain ownership of content you post. By posting, you grant Afrinnect a license to use, display, and distribute your content on the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">6. Safety and Verification</h3>
            <p className="text-gray-700">
              While we implement safety features including AI moderation and photo verification, Afrinnect is not responsible for the actions of users. Always exercise caution when meeting people in person.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">7. Subscriptions and Payments</h3>
            <p className="text-gray-700 mb-3">
              Afrinnect offers three premium subscription tiers: <strong>Premium</strong>, <strong>Elite</strong>, and <strong>VIP</strong>. Each tier includes different features and benefits.
            </p>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="font-semibold text-purple-900 mb-2">📋 Subscription Terms</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm">
                <li><strong>Auto-Renewal:</strong> Subscriptions automatically renew unless canceled at least 24 hours before the renewal date</li>
                <li><strong>Cancellation:</strong> You can cancel anytime from Settings → Subscription & Pricing. Cancellation takes effect at the end of your current billing period - <strong>you keep all features until then</strong></li>
                <li><strong>Billing Cycles:</strong> Monthly, Quarterly (3 months), 6-Month, or Annual billing options are available depending on the plan</li>
                <li><strong>Price Changes:</strong> We will notify you at least 30 days before any price changes take effect</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="font-semibold text-green-900 mb-2">⬆️ Upgrading Your Plan</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm">
                <li>You can upgrade at any time</li>
                <li><strong>Proration Credit:</strong> When upgrading, you receive a credit for the unused portion of your current subscription</li>
                <li>The credit is automatically applied to your new plan purchase - <strong>you are never double-charged</strong></li>
                <li>New features are available immediately upon successful payment</li>
                <li>Example: If you have 15 days left on Premium ($14.99/month), you get ~$7.50 credit toward Elite</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="font-semibold text-blue-900 mb-2">⬇️ Downgrading Your Plan</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm">
                <li>You can downgrade at any time by canceling your current subscription</li>
                <li><strong>Keep Your Features:</strong> You retain all current tier features until your billing period ends</li>
                <li>After expiration, your account automatically moves to the lower tier (or Free)</li>
                <li>No partial refunds are issued for downgrades - you simply use what you paid for</li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-2">💳 Payment Processing</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm">
                <li>Payment processing is handled securely by Stripe (PCI-DSS compliant)</li>
                <li>For iOS: Manage subscriptions in your Apple ID settings</li>
                <li>For Android: Manage subscriptions in Google Play Store settings</li>
                <li>We accept major credit/debit cards (Visa, Mastercard, Amex, Discover)</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">8. In-App Purchases</h3>
            <p className="text-gray-700 mb-3">
              In addition to subscriptions, Afrinnect offers one-time purchases:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Profile Boosts:</strong> Increase your visibility for 30 minutes</li>
              <li><strong>Super Likes:</strong> Let someone know you're especially interested</li>
              <li><strong>See Who Likes You (24hr):</strong> Temporary access to see your admirers</li>
              <li><strong>Virtual Gifts:</strong> Send digital gifts to matches</li>
            </ul>
            <p className="text-gray-700 mt-3 text-sm">
              One-time purchases are <strong>non-refundable</strong> and do not expire. They remain in your account until used.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">9. Refund Policy</h3>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
              <p className="font-semibold text-amber-900 mb-2">Refund Policy</p>
              <p className="text-gray-700 text-sm">
                Subscription and in-app purchases are generally non-refundable. We do not typically offer refunds or credits for:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700 text-sm">
                <li>Partial subscription periods</li>
                <li>Unused premium features</li>
                <li>Unused in-app purchases (Boosts, Super Likes, etc.)</li>
                <li>Account terminations or suspensions due to violations</li>
                <li>Change of mind after purchase</li>
              </ul>
              <p className="text-gray-700 text-sm mt-2">
                <strong>Exceptions:</strong> Refunds may be granted for:
              </p>
              <ul className="list-disc pl-6 mt-1 space-y-1 text-gray-700 text-sm">
                <li>Technical errors that prevented service delivery</li>
                <li>Duplicate charges (we will refund the duplicate)</li>
                <li>Unauthorized transactions (report within 48 hours)</li>
                <li>Where required by applicable law (e.g., EU cooling-off period for certain purchases)</li>
              </ul>
              <p className="text-gray-700 text-sm mt-2">
                For App Store and Google Play purchases, refund requests should be directed to Apple or Google respectively. Contact support@afrinnect.com for other refund inquiries within 14 days of purchase.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">10. Ambassador & Referral Program</h3>
            <p className="text-gray-700">
              Afrinnect offers an Ambassador Program for content creators and influencers. By participating:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-2">
              <li>You agree to promote Afrinnect honestly and in compliance with FTC disclosure guidelines</li>
              <li>Commissions are paid based on verified signups and subscriptions</li>
              <li>Fraudulent referrals (fake accounts, self-referrals, incentivized signups) will result in termination and forfeiture of unpaid commissions</li>
              <li>We reserve the right to modify commission rates with 30 days notice</li>
              <li>Minimum payout threshold applies (typically $50 USD)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">11. Premium Features</h3>
            <p className="text-gray-700">
              Premium features vary by subscription tier. Feature availability may change:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-2">
              <li><strong>Incognito Mode:</strong> Browse profiles without being seen (Elite/VIP only)</li>
              <li><strong>Priority DMs:</strong> Your messages appear first (Elite/VIP only)</li>
              <li><strong>Video Calls:</strong> Video chat with matches (VIP only)</li>
              <li><strong>See Who Likes You:</strong> View your admirers (Premium and above)</li>
              <li><strong>Unlimited Likes/Messages:</strong> Based on your tier limits</li>
            </ul>
            <p className="text-gray-700 mt-3 text-sm">
              We may add, modify, or remove features at any time. Significant changes will be communicated via email or in-app notification.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">12. Account Termination & Deletion</h3>
            <p className="text-gray-700">
              We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
              <p className="font-semibold text-blue-900 mb-2">Your Right to Delete Your Account</p>
              <p className="text-gray-700 text-sm">
                You may delete your account at any time through <strong>Settings → Account Deletion</strong>. Upon deletion:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700 text-sm">
                <li>Your profile will be immediately deactivated and hidden from other users</li>
                <li>Your personal data will be anonymized or deleted within 30 days</li>
                <li>Some data may be retained for legal compliance (fraud prevention, legal disputes)</li>
                <li>This action is permanent and cannot be undone</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">13. Limitation of Liability</h3>
            <p className="text-gray-700">
              Afrinnect is provided "as is" without warranties. We are not liable for damages arising from use of the service, interactions with other users, or technical issues.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">14. Dispute Resolution & Arbitration</h3>
            <p className="text-gray-700">
              Any disputes arising from your use of Afrinnect shall be resolved as follows:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-2">
              <li><strong>Informal Resolution:</strong> Contact support@afrinnect.com first. We will attempt to resolve disputes within 30 days.</li>
              <li><strong>Binding Arbitration:</strong> If informal resolution fails, disputes will be resolved through binding arbitration under the rules of the American Arbitration Association (AAA).</li>
              <li><strong>Class Action Waiver:</strong> You agree to resolve disputes individually and waive any right to participate in class action lawsuits.</li>
              <li><strong>Small Claims Court:</strong> Either party may bring claims in small claims court if eligible.</li>
            </ul>
            <p className="text-gray-700 mt-3 text-sm">
              This arbitration agreement does not preclude you from bringing issues to the attention of federal, state, or local agencies.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">15. Changes to Terms</h3>
            <p className="text-gray-700">
              We may modify these terms at any time. Continued use after changes constitutes acceptance of new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">16. Governing Law</h3>
            <p className="text-gray-700">
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. You agree to submit to the personal jurisdiction of the courts located in Delaware for any actions not subject to arbitration.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">17. Intellectual Property</h3>
            <p className="text-gray-700">
              All content, features, and functionality of Afrinnect, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, and software, are the exclusive property of Afrinnect and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p className="text-gray-700">
              The Afrinnect name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Afrinnect. You must not use such marks without prior written permission.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">18. Severability</h3>
            <p className="text-gray-700">
              If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law, and the remaining provisions will continue in full force and effect.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">19. Entire Agreement</h3>
            <p className="text-gray-700">
              These Terms, together with our Privacy Policy and Community Guidelines, constitute the entire agreement between you and Afrinnect regarding your use of the service and supersede all prior agreements and understandings.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">20. Contact</h3>
            <p className="text-gray-700">
              For questions about these terms:
            </p>
            <ul className="list-none space-y-1 text-gray-700 mt-2">
              <li>📧 <strong>Legal:</strong> legal@afrinnect.com</li>
              <li>📧 <strong>Support:</strong> support@afrinnect.com</li>
              <li>📧 <strong>Privacy:</strong> privacy@afrinnect.com</li>
            </ul>
          </section>

          {/* Copyright Notice */}
          <div className="pt-6 border-t text-center">
            <p className="text-sm text-gray-600">© {new Date().getFullYear()} Afrinnect. All rights reserved.</p>
            <p className="text-xs text-gray-500 mt-1">
              Unauthorized reproduction or distribution of this copyrighted work is illegal.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}