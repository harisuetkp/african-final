import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Book, Users, Heart, MessageCircle, Shield, Crown, Calendar, 
  BarChart3, Settings, Flag, Ban, CheckCircle, Star, Zap,
  Camera, Bell, Gift, Award, TrendingUp, Search, ChevronDown,
  ChevronRight, ArrowLeft, Sparkles, Globe, Lock, Eye, Trash2,
  AlertTriangle, Clock, DollarSign, Mail, Smartphone, Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminManual() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: Book },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'matching', label: 'Matching System', icon: Heart },
    { id: 'moderation', label: 'Moderation & Safety', icon: Shield },
    { id: 'subscriptions', label: 'Subscriptions & Revenue', icon: Crown },
    { id: 'events', label: 'Events & VIP', icon: Calendar },
    { id: 'stories', label: 'Stories Feature', icon: Camera },
    { id: 'messaging', label: 'Messaging System', icon: MessageCircle },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'ambassadors', label: 'Ambassador Program', icon: Award },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const manualContent = {
    overview: {
      title: "Afrinnect Admin Overview",
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="text-purple-600" />
                What is Afrinnect?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Afrinnect is a premium dating platform designed specifically for the African diaspora and those interested in African culture. The app connects singles worldwide with a focus on cultural compatibility, shared values, and meaningful relationships.</p>
              
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900">Target Audience</h4>
                  <ul className="text-sm text-purple-700 mt-2 space-y-1">
                    <li>• African singles worldwide</li>
                    <li>• African diaspora communities</li>
                    <li>• People interested in African culture</li>
                  </ul>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-amber-900">Key Differentiators</h4>
                  <ul className="text-sm text-amber-700 mt-2 space-y-1">
                    <li>• Cultural compatibility matching</li>
                    <li>• Country of origin filters</li>
                    <li>• Tribe/ethnicity options</li>
                    <li>• Language preferences</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900">Business Model</h4>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• Freemium with 4 tiers</li>
                    <li>• In-app purchases</li>
                    <li>• Ambassador referrals</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Dashboard Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Quick Actions</h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center gap-2"><Users size={16} /> <strong>Users:</strong> View, edit, ban, verify users</li>
                    <li className="flex items-center gap-2"><Flag size={16} /> <strong>Reports:</strong> Review and resolve reports</li>
                    <li className="flex items-center gap-2"><Crown size={16} /> <strong>Subscriptions:</strong> Manage plans & revenue</li>
                    <li className="flex items-center gap-2"><Calendar size={16} /> <strong>Events:</strong> Create VIP events</li>
                    <li className="flex items-center gap-2"><Mail size={16} /> <strong>Broadcast:</strong> Send mass notifications</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Key Metrics to Monitor</h4>
                  <ul className="text-sm space-y-2">
                    <li>• Daily Active Users (DAU)</li>
                    <li>• Match rate & conversation rate</li>
                    <li>• Subscription conversion rate</li>
                    <li>• Report resolution time</li>
                    <li>• Churn rate by tier</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },

    users: {
      title: "User Management",
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="text-blue-600" />
                User Lifecycle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                {['Sign Up', 'Onboarding', 'Photo Verify', 'Active User', 'Premium Convert'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      i === 0 ? 'bg-gray-500' : i === 4 ? 'bg-green-500' : 'bg-purple-500'
                    }`}>{i + 1}</div>
                    <span className="text-sm font-medium">{step}</span>
                    {i < 4 && <ChevronRight size={16} className="text-gray-400" />}
                  </div>
                ))}
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="profiles">
                  <AccordionTrigger>User Profiles</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p><strong>Required Fields:</strong> Display name, gender, looking for, country of origin, current country</p>
                      <p><strong>Optional Fields:</strong> Bio, photos (up to 6), prompts, interests, lifestyle, religion, education</p>
                      <p><strong>Verification Status:</strong></p>
                      <ul className="list-disc ml-6 text-sm">
                        <li><strong>Email Verified:</strong> Automatic on signup</li>
                        <li><strong>Phone Verified:</strong> Optional OTP verification</li>
                        <li><strong>Photo Verified:</strong> Required within 30 minutes of signup (selfie matching)</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="statuses">
                  <AccordionTrigger>User Statuses</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <h5 className="font-semibold text-green-800">Active (is_active: true)</h5>
                        <p className="text-sm text-green-700">Normal user, can use all features</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <h5 className="font-semibold text-yellow-800">Suspended (is_suspended: true)</h5>
                        <p className="text-sm text-yellow-700">Temporary ban with expiry date. User sees countdown.</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <h5 className="font-semibold text-red-800">Banned (is_banned: true)</h5>
                        <p className="text-sm text-red-700">Permanent ban. User can file dispute.</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h5 className="font-semibold text-gray-800">Inactive</h5>
                        <p className="text-sm text-gray-700">User hasn't logged in for 30+ days</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="actions">
                  <AccordionTrigger>Admin Actions on Users</AccordionTrigger>
                  <AccordionContent>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Action</th>
                          <th className="text-left py-2">When to Use</th>
                          <th className="text-left py-2">Effect</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Verify Photo</td>
                          <td className="py-2">Manual override for verification</td>
                          <td className="py-2">Sets photo_verified = true</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Issue Warning</td>
                          <td className="py-2">Minor violations</td>
                          <td className="py-2">warning_count +1, notification sent</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Suspend (Temp Ban)</td>
                          <td className="py-2">Moderate violations</td>
                          <td className="py-2">is_suspended = true, set expiry date</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Ban (Permanent)</td>
                          <td className="py-2">Severe violations</td>
                          <td className="py-2">is_banned = true, all matches hidden</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Grant Premium</td>
                          <td className="py-2">Promotions, support resolution</td>
                          <td className="py-2">Update subscription_tier & premium_until</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-medium">Delete Account</td>
                          <td className="py-2">GDPR request, fraud</td>
                          <td className="py-2">Soft delete, data retained 30 days</td>
                        </tr>
                      </tbody>
                    </table>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="devices">
                  <AccordionTrigger>Device Management</AccordionTrigger>
                  <AccordionContent>
                    <p>Each user can have <strong>maximum 4 devices</strong> linked to their account.</p>
                    <ul className="list-disc ml-6 mt-2 text-sm">
                      <li>Device IDs stored in <code>device_ids</code> array</li>
                      <li>Device info (name, last login) in <code>device_info</code></li>
                      <li>Users can remove devices from Settings</li>
                      <li>Admins can force remove all devices to force re-login</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )
    },

    matching: {
      title: "Matching System",
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="text-pink-600" />
                How Matching Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-pink-900 mb-2">Match Flow</h4>
                  <ol className="list-decimal ml-6 text-sm text-pink-800 space-y-1">
                    <li>User A likes User B → Like record created</li>
                    <li>If User B already liked User A → Match created!</li>
                    <li>Both users notified via push notification</li>
                    <li>Match has 24-hour expiry timer if no message sent</li>
                    <li>First message stops the timer, match becomes permanent</li>
                  </ol>
                </div>

                <Accordion type="single" collapsible>
                  <AccordionItem value="scoring">
                    <AccordionTrigger>AI Match Scoring (0-100)</AccordionTrigger>
                    <AccordionContent>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Factor</th>
                            <th className="text-left py-2">Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2">Same country of origin</td>
                            <td className="py-2">+10</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Same tribe/ethnicity</td>
                            <td className="py-2">+8</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Shared languages</td>
                            <td className="py-2">+7</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Same religion</td>
                            <td className="py-2">+10</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Same relationship goal</td>
                            <td className="py-2">+10</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Cultural values match</td>
                            <td className="py-2">Up to +20</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Shared interests</td>
                            <td className="py-2">Up to +15</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">Same country/city</td>
                            <td className="py-2">+5/+10</td>
                          </tr>
                          <tr>
                            <td className="py-2">Lifestyle compatibility</td>
                            <td className="py-2">Up to +10</td>
                          </tr>
                        </tbody>
                      </table>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="likes">
                    <AccordionTrigger>Like Types</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="border p-3 rounded-lg">
                          <h5 className="font-semibold flex items-center gap-2">
                            <Heart size={16} className="text-pink-500" /> Regular Like
                          </h5>
                          <p className="text-sm mt-1">Standard like, limited daily (Free: 25, Premium: 50, Elite+: Unlimited)</p>
                        </div>
                        <div className="border p-3 rounded-lg">
                          <h5 className="font-semibold flex items-center gap-2">
                            <Star size={16} className="text-amber-500" /> Super Like
                          </h5>
                          <p className="text-sm mt-1">Highlighted to recipient, shown first. Free: 1/week, Premium: 5/day, Elite+: Unlimited</p>
                        </div>
                        <div className="border p-3 rounded-lg">
                          <h5 className="font-semibold flex items-center gap-2">
                            <Zap size={16} className="text-purple-500" /> Priority Like (Elite/VIP)
                          </h5>
                          <p className="text-sm mt-1">Automatically set for Elite/VIP users. Their likes appear first in recipient's queue.</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="expiry">
                    <AccordionTrigger>Match Expiry System</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc ml-6 text-sm space-y-2">
                        <li><strong>24-hour timer</strong> starts when match is created</li>
                        <li>If no message sent within 24 hours, match expires</li>
                        <li><strong>Last Chance notification</strong> sent 1 hour before expiry</li>
                        <li>First message sent → timer stops, match is permanent</li>
                        <li>Expired matches marked as <code>is_expired: true, status: 'expired'</code></li>
                        <li>Automated job <code>checkExpiredMatches</code> runs hourly</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="discovery">
                    <AccordionTrigger>Discovery Algorithm</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-3">Profiles shown to users are filtered and sorted by:</p>
                      <ol className="list-decimal ml-6 text-sm space-y-1">
                        <li>Gender preference match (looking_for)</li>
                        <li>Not already liked/passed</li>
                        <li>Not blocked by either user</li>
                        <li>Not banned/suspended</li>
                        <li>User's filter preferences (age, location, religion, etc.)</li>
                        <li>Boosted profiles shown first</li>
                        <li>Recently active profiles prioritized</li>
                        <li>Match score calculated and displayed</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },

    moderation: {
      title: "Moderation & Safety",
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="text-red-600" />
                Safety Systems
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="reports">
                  <AccordionTrigger>Report Types & Handling</AccordionTrigger>
                  <AccordionContent>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Report Type</th>
                          <th className="text-left py-2">Priority</th>
                          <th className="text-left py-2">Recommended Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b bg-red-50">
                          <td className="py-2 font-medium">Underage</td>
                          <td className="py-2"><Badge variant="destructive">Critical</Badge></td>
                          <td className="py-2">Immediate ban + report to authorities if needed</td>
                        </tr>
                        <tr className="border-b bg-red-50">
                          <td className="py-2 font-medium">Scam</td>
                          <td className="py-2"><Badge variant="destructive">Critical</Badge></td>
                          <td className="py-2">Ban if confirmed, warn if unclear</td>
                        </tr>
                        <tr className="border-b bg-orange-50">
                          <td className="py-2 font-medium">Harassment</td>
                          <td className="py-2"><Badge className="bg-orange-500">High</Badge></td>
                          <td className="py-2">Review messages, warn or suspend</td>
                        </tr>
                        <tr className="border-b bg-orange-50">
                          <td className="py-2 font-medium">Hate Speech</td>
                          <td className="py-2"><Badge className="bg-orange-500">High</Badge></td>
                          <td className="py-2">Remove content, warn or ban</td>
                        </tr>
                        <tr className="border-b bg-yellow-50">
                          <td className="py-2 font-medium">Fake Profile</td>
                          <td className="py-2"><Badge className="bg-yellow-500">Medium</Badge></td>
                          <td className="py-2">Request photo verification, ban if fake</td>
                        </tr>
                        <tr className="border-b bg-yellow-50">
                          <td className="py-2 font-medium">Inappropriate Content</td>
                          <td className="py-2"><Badge className="bg-yellow-500">Medium</Badge></td>
                          <td className="py-2">Remove content, warn user</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Spam</td>
                          <td className="py-2"><Badge variant="secondary">Low</Badge></td>
                          <td className="py-2">Warn, suspend if repeated</td>
                        </tr>
                      </tbody>
                    </table>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="violations">
                  <AccordionTrigger>Violation Escalation</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold">1</div>
                        <div>
                          <p className="font-medium">1st Violation: Warning</p>
                          <p className="text-sm text-gray-600">warning_count = 1, notification sent</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">2</div>
                        <div>
                          <p className="font-medium">2nd Violation: 24-hour Suspension</p>
                          <p className="text-sm text-gray-600">is_suspended = true, suspension_expires_at set</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">3</div>
                        <div>
                          <p className="font-medium">3rd Violation: 7-day Suspension</p>
                          <p className="text-sm text-gray-600">Longer suspension period</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">4</div>
                        <div>
                          <p className="font-medium">4th Violation: Permanent Ban</p>
                          <p className="text-sm text-gray-600">is_banned = true, user can file dispute</p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="photomod">
                  <AccordionTrigger>Photo Moderation</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3">All profile photos go through moderation:</p>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li><strong>Auto-moderation:</strong> AI checks for nudity, violence, copyrighted content</li>
                      <li><strong>Manual queue:</strong> Flagged photos require admin review</li>
                      <li><strong>Photo Verification:</strong> Selfie compared to profile photos using AI</li>
                    </ul>
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800"><strong>Action:</strong> Go to Admin Dashboard → Photo Moderation to review flagged photos</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="scam">
                  <AccordionTrigger>Scam Detection</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3">Automated scam detection looks for:</p>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li>Requests for money in messages</li>
                      <li>External links (WhatsApp, Telegram, etc.)</li>
                      <li>Crypto/investment discussions</li>
                      <li>Rapid messaging to many users</li>
                      <li>Copy-paste message patterns</li>
                      <li>Profile photo reverse image search hits</li>
                    </ul>
                    <p className="mt-3 text-sm text-gray-600">Suspicious accounts are flagged in <code>ScamAnalysis</code> entity for review.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="disputes">
                  <AccordionTrigger>Ban Appeals / Disputes</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3">Banned users can file disputes:</p>
                    <ol className="list-decimal ml-6 text-sm space-y-1">
                      <li>User submits dispute with reason and evidence</li>
                      <li>Dispute appears in Admin Dashboard → Disputes</li>
                      <li>Review evidence and original ban reason</li>
                      <li>Approve (unban) or Reject with explanation</li>
                      <li>User notified of decision</li>
                    </ol>
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800"><strong>Note:</strong> Always document your decision in admin_response field</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )
    },

    subscriptions: {
      title: "Subscriptions & Revenue",
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="text-amber-600" />
                Subscription Tiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-bold text-gray-600">Free</h4>
                  <ul className="text-xs mt-2 space-y-1">
                    <li>• 25 likes/day</li>
                    <li>• 1 super like/week</li>
                    <li>• 0 rewinds</li>
                    <li>• Basic filters</li>
                    <li>• Ads shown</li>
                  </ul>
                </div>
                <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                  <h4 className="font-bold text-purple-600">Premium</h4>
                  <p className="text-xs text-gray-500">$14.99/mo</p>
                  <ul className="text-xs mt-2 space-y-1">
                    <li>• 50 likes/day</li>
                    <li>• 5 super likes/day</li>
                    <li>• 3 rewinds/day</li>
                    <li>• See who likes you</li>
                    <li>• No ads</li>
                  </ul>
                </div>
                <div className="border-2 border-amber-300 rounded-lg p-4 bg-amber-50">
                  <h4 className="font-bold text-amber-600">Elite</h4>
                  <p className="text-xs text-gray-500">$29.99/mo</p>
                  <ul className="text-xs mt-2 space-y-1">
                    <li>• Unlimited likes</li>
                    <li>• Unlimited super likes</li>
                    <li>• Unlimited rewinds</li>
                    <li>• Priority likes</li>
                    <li>• Weekly top picks</li>
                    <li>• Incognito mode</li>
                  </ul>
                </div>
                <div className="border-2 border-pink-300 rounded-lg p-4 bg-gradient-to-br from-pink-50 to-purple-50">
                  <h4 className="font-bold text-pink-600">VIP</h4>
                  <p className="text-xs text-gray-500">$79.99/mo</p>
                  <ul className="text-xs mt-2 space-y-1">
                    <li>• All Elite features</li>
                    <li>• VIP speed dating events</li>
                    <li>• Priority support</li>
                    <li>• Profile boost/month</li>
                    <li>• Virtual gifts</li>
                  </ul>
                </div>
              </div>

              <Accordion type="single" collapsible>
                <AccordionItem value="founding">
                  <AccordionTrigger>Founding Member Program</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3">Early adopters get special benefits:</p>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li><strong>Founding Member Badge:</strong> Permanent profile badge</li>
                      <li><strong>Free Trial:</strong> 14-day Premium trial</li>
                      <li><strong>Lifetime Discount:</strong> 20% off all subscriptions</li>
                    </ul>
                    <p className="mt-3 text-sm"><strong>How to grant:</strong> Use <code>grantFoundingMember</code> function or Admin Settings → Founder Program</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="inapp">
                  <AccordionTrigger>In-App Purchases</AccordionTrigger>
                  <AccordionContent>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Item</th>
                          <th className="text-left py-2">Price</th>
                          <th className="text-left py-2">Effect</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">Profile Boost (1hr)</td>
                          <td className="py-2">$4.99</td>
                          <td className="py-2">10x visibility for 1 hour</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Super Likes (5 pack)</td>
                          <td className="py-2">$4.99</td>
                          <td className="py-2">+5 super likes</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">24hr Unlock</td>
                          <td className="py-2">$2.99</td>
                          <td className="py-2">See who likes you for 24hrs</td>
                        </tr>
                        <tr>
                          <td className="py-2">Spotlight</td>
                          <td className="py-2">$9.99</td>
                          <td className="py-2">Featured on homepage for 24hrs</td>
                        </tr>
                      </tbody>
                    </table>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="stripe">
                  <AccordionTrigger>Stripe Integration</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li>Payments processed via Stripe</li>
                      <li>Webhook at <code>/functions/stripeWebhook</code> handles events</li>
                      <li>Subscription status auto-updates on payment success/failure</li>
                      <li>Refunds can be issued from Admin → Subscriptions</li>
                    </ul>
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800"><strong>Stripe Dashboard:</strong> dashboard.stripe.com for detailed payment logs</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="refunds">
                  <AccordionTrigger>Refund Policy</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li><strong>Within 48 hours:</strong> Full refund, no questions</li>
                      <li><strong>3-7 days:</strong> Prorated refund</li>
                      <li><strong>After 7 days:</strong> Case-by-case basis</li>
                      <li><strong>Banned users:</strong> No refunds unless wrongful ban</li>
                    </ul>
                    <p className="mt-3 text-sm">Use Admin → Subscriptions → Refunds Manager to process</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )
    },

    events: {
      title: "Events & VIP",
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="text-indigo-600" />
                VIP Events System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="types">
                  <AccordionTrigger>Event Types</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border p-3 rounded-lg">
                        <h5 className="font-semibold">💕 Speed Dating</h5>
                        <p className="text-sm mt-1">3-minute video rounds, automatic matching after</p>
                      </div>
                      <div className="border p-3 rounded-lg">
                        <h5 className="font-semibold">🎉 Mixer</h5>
                        <p className="text-sm mt-1">Group video chat, icebreaker games</p>
                      </div>
                      <div className="border p-3 rounded-lg">
                        <h5 className="font-semibold">📚 Workshop</h5>
                        <p className="text-sm mt-1">Dating tips, relationship advice sessions</p>
                      </div>
                      <div className="border p-3 rounded-lg">
                        <h5 className="font-semibold">✨ Exclusive Party</h5>
                        <p className="text-sm mt-1">VIP-only virtual events</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="create">
                  <AccordionTrigger>Creating Events</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal ml-6 text-sm space-y-2">
                      <li>Go to Admin Dashboard → VIP Events</li>
                      <li>Click "Create Event"</li>
                      <li>Fill in: Title, Type, Date/Time, Max Participants</li>
                      <li>Set tier requirement (Elite or VIP)</li>
                      <li>Add cover image and description</li>
                      <li>Set meeting link (Zoom, Google Meet, etc.)</li>
                      <li>Save → Event appears in VIP Events Hub</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="speed">
                  <AccordionTrigger>Speed Dating Flow</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal ml-6 text-sm space-y-2">
                      <li>Participants join lobby 5 min before start</li>
                      <li>System pairs participants randomly</li>
                      <li>3-minute video call per round</li>
                      <li>After each round, both mark "Interested" or "Pass"</li>
                      <li>Mutual interests → Match created automatically</li>
                      <li>Event ends → Summary of matches shown</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )
    },

    stories: {
      title: "Stories Feature",
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="text-orange-600" />
                Stories System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">How Stories Work</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Users upload photos/videos as stories</li>
                    <li>• Stories visible only to their matches</li>
                    <li>• Stories expire after 24 hours automatically</li>
                    <li>• Viewers can reply (sends message to match)</li>
                    <li>• Story owners see view count</li>
                  </ul>
                </div>

                <Accordion type="single" collapsible>
                  <AccordionItem value="moderation">
                    <AccordionTrigger>Story Moderation</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc ml-6 text-sm space-y-1">
                        <li>Stories go through same photo moderation as profiles</li>
                        <li>Reported stories appear in Admin → Story Management</li>
                        <li>Admins can delete any story</li>
                        <li>Users can delete their own stories</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="expiry">
                    <AccordionTrigger>Expiry System</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc ml-6 text-sm space-y-1">
                        <li>Stories set <code>expires_at</code> to 24 hours from creation</li>
                        <li>Automated job marks expired stories</li>
                        <li>Expired stories hidden from UI but data retained</li>
                        <li>Data cleanup after 30 days</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },

    messaging: {
      title: "Messaging System",
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="text-blue-600" />
                Chat Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="types">
                  <AccordionTrigger>Message Types</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border p-3 rounded-lg">
                        <h5 className="font-semibold">💬 Text</h5>
                        <p className="text-sm mt-1">Standard text messages</p>
                      </div>
                      <div className="border p-3 rounded-lg">
                        <h5 className="font-semibold">🎤 Voice Note</h5>
                        <p className="text-sm mt-1">Audio recordings</p>
                      </div>
                      <div className="border p-3 rounded-lg">
                        <h5 className="font-semibold">📷 Image</h5>
                        <p className="text-sm mt-1">Photo sharing (moderated)</p>
                      </div>
                      <div className="border p-3 rounded-lg">
                        <h5 className="font-semibold">❄️ Ice Breaker</h5>
                        <p className="text-sm mt-1">Pre-written conversation starters</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="features">
                  <AccordionTrigger>Premium Chat Features</AccordionTrigger>
                  <AccordionContent>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Feature</th>
                          <th className="text-left py-2">Tier Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">Read Receipts</td>
                          <td className="py-2">Premium+</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Typing Indicator</td>
                          <td className="py-2">Premium+</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Message Translation</td>
                          <td className="py-2">Elite+</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Video Calls</td>
                          <td className="py-2">Elite+</td>
                        </tr>
                        <tr>
                          <td className="py-2">Priority DMs (shown first)</td>
                          <td className="py-2">VIP only</td>
                        </tr>
                      </tbody>
                    </table>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="moderation">
                  <AccordionTrigger>Message Moderation</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li>Messages scanned for prohibited content (links, money requests)</li>
                      <li>Flagged messages marked with <code>is_flagged: true</code></li>
                      <li>Users can report individual messages</li>
                      <li>Admins can view message history in reports</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )
    },

    notifications: {
      title: "Notifications",
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="text-green-600" />
                Notification System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="types">
                  <AccordionTrigger>Notification Types</AccordionTrigger>
                  <AccordionContent>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Type</th>
                          <th className="text-left py-2">Trigger</th>
                          <th className="text-left py-2">Push?</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">match</td>
                          <td className="py-2">Mutual like</td>
                          <td className="py-2">✅ Yes</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">like</td>
                          <td className="py-2">Someone likes you</td>
                          <td className="py-2">✅ Yes</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">super_like</td>
                          <td className="py-2">Someone super likes you</td>
                          <td className="py-2">✅ Yes</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">message</td>
                          <td className="py-2">New message</td>
                          <td className="py-2">✅ Yes</td>
                        </tr>
                        <tr>
                          <td className="py-2">admin_message</td>
                          <td className="py-2">Broadcast or direct admin message</td>
                          <td className="py-2">✅ Yes</td>
                        </tr>
                      </tbody>
                    </table>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="broadcast">
                  <AccordionTrigger>Broadcast Messages</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3">Send notifications to all users or segments:</p>
                    <ol className="list-decimal ml-6 text-sm space-y-1">
                      <li>Go to Admin Dashboard → Broadcast</li>
                      <li>Select audience: All, Premium only, specific tier, etc.</li>
                      <li>Write title and message</li>
                      <li>Optional: Add link to open</li>
                      <li>Send → Creates notification for each user + push</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="push">
                  <AccordionTrigger>Push Notification Setup</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li>Uses Firebase Cloud Messaging (FCM)</li>
                      <li>Users opt-in on first visit</li>
                      <li>Token stored in <code>push_token</code> field</li>
                      <li>Function: <code>sendPushNotification</code></li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )
    },

    analytics: {
      title: "Analytics & Reports",
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="text-purple-600" />
                Analytics Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="kpis">
                  <AccordionTrigger>Key Metrics to Track</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-semibold mb-2">Growth Metrics</h5>
                        <ul className="text-sm space-y-1">
                          <li>• Daily/Weekly/Monthly Active Users</li>
                          <li>• New signups per day</li>
                          <li>• Onboarding completion rate</li>
                          <li>• Photo verification rate</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold mb-2">Engagement Metrics</h5>
                        <ul className="text-sm space-y-1">
                          <li>• Swipes per user per day</li>
                          <li>• Match rate (matches / likes)</li>
                          <li>• Conversation rate (chats / matches)</li>
                          <li>• Messages per conversation</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold mb-2">Revenue Metrics</h5>
                        <ul className="text-sm space-y-1">
                          <li>• MRR (Monthly Recurring Revenue)</li>
                          <li>• Conversion rate (free → paid)</li>
                          <li>• ARPU (Average Revenue Per User)</li>
                          <li>• Churn rate by tier</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold mb-2">Safety Metrics</h5>
                        <ul className="text-sm space-y-1">
                          <li>• Reports per day</li>
                          <li>• Report resolution time</li>
                          <li>• Ban rate</li>
                          <li>• Dispute overturn rate</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="reports">
                  <AccordionTrigger>Available Reports</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc ml-6 text-sm space-y-2">
                      <li><strong>Daily Activity Report:</strong> Auto-generated each morning</li>
                      <li><strong>Weekly Growth Report:</strong> Sent to admin emails</li>
                      <li><strong>Revenue Report:</strong> Stripe integration + subscription data</li>
                      <li><strong>Moderation Report:</strong> Reports handled, bans issued</li>
                      <li><strong>Ambassador Report:</strong> Referrals, commissions, payouts</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="google">
                  <AccordionTrigger>Google Analytics Integration</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3">GA4 tracks:</p>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li>Page views and navigation</li>
                      <li>Custom events (signup, match, message, purchase)</li>
                      <li>User properties (tier, country)</li>
                      <li>Conversion funnels</li>
                    </ul>
                    <p className="mt-3 text-sm">Access at: analytics.google.com</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )
    },

    ambassadors: {
      title: "Ambassador Program",
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="text-pink-600" />
                Ambassador System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="overview">
                  <AccordionTrigger>Program Overview</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3">Ambassadors are users who promote Afrinnect and earn commissions:</p>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li>Each ambassador gets a unique referral code</li>
                      <li>New users sign up with the code</li>
                      <li>Ambassador earns commission when referral subscribes</li>
                      <li>Tiered benefits based on performance</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="commission">
                  <AccordionTrigger>Commission Structure</AccordionTrigger>
                  <AccordionContent>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Plan Type</th>
                          <th className="text-left py-2">Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">CPA (Cost Per Acquisition)</td>
                          <td className="py-2">$5-10 per new subscriber</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Revenue Share</td>
                          <td className="py-2">10-20% of first payment</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Recurring Share</td>
                          <td className="py-2">5-10% for 6 months</td>
                        </tr>
                        <tr>
                          <td className="py-2">Signup Bonus</td>
                          <td className="py-2">$0.50 per signup (even without subscription)</td>
                        </tr>
                      </tbody>
                    </table>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="tiers">
                  <AccordionTrigger>Ambassador Tiers</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-4 gap-3">
                      <div className="border p-3 rounded-lg">
                        <h5 className="font-semibold text-gray-600">Bronze</h5>
                        <p className="text-xs">0-10 referrals</p>
                        <p className="text-xs mt-1">1x multiplier</p>
                      </div>
                      <div className="border p-3 rounded-lg bg-gray-50">
                        <h5 className="font-semibold text-gray-600">Silver</h5>
                        <p className="text-xs">11-50 referrals</p>
                        <p className="text-xs mt-1">1.1x multiplier</p>
                      </div>
                      <div className="border p-3 rounded-lg bg-amber-50">
                        <h5 className="font-semibold text-amber-600">Gold</h5>
                        <p className="text-xs">51-100 referrals</p>
                        <p className="text-xs mt-1">1.25x multiplier</p>
                      </div>
                      <div className="border p-3 rounded-lg bg-purple-50">
                        <h5 className="font-semibold text-purple-600">Platinum</h5>
                        <p className="text-xs">100+ referrals</p>
                        <p className="text-xs mt-1">1.5x multiplier</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="admin">
                  <AccordionTrigger>Admin Management</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li><strong>Applications:</strong> Review in Admin → Ambassadors</li>
                      <li><strong>Approve/Reject:</strong> Set status, assign commission plan</li>
                      <li><strong>Payouts:</strong> Monthly, minimum $50, via PayPal/Bank</li>
                      <li><strong>Fraud Detection:</strong> Monitor for fake signups</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )
    },

    settings: {
      title: "System Settings",
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="text-gray-600" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="launch">
                  <AccordionTrigger>Launch / Maintenance Mode</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3">Control app availability:</p>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li><strong>is_live: false</strong> → Only admins and waitlist page accessible</li>
                      <li><strong>is_live: true</strong> → Full app available to all</li>
                      <li>Set in SystemSettings with key: <code>launch_configuration</code></li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="tiers">
                  <AccordionTrigger>Tier Configuration</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3">Manage subscription tiers in <code>TierConfiguration</code> entity:</p>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li>Edit daily limits (likes, super likes, rewinds)</li>
                      <li>Toggle features per tier</li>
                      <li>Adjust pricing</li>
                      <li>Changes apply immediately to all users</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="flags">
                  <AccordionTrigger>Feature Flags</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3">Toggle features without code changes:</p>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li><strong>is_enabled:</strong> Global on/off</li>
                      <li><strong>enabled_for_premium:</strong> Premium+ only</li>
                      <li><strong>rollout_percentage:</strong> Gradual rollout (0-100%)</li>
                    </ul>
                    <p className="mt-3 text-sm">Manage in Admin → Feature Flags</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="secrets">
                  <AccordionTrigger>API Keys & Secrets</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3">Configured secrets (Dashboard → Settings → Environment):</p>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                      <li>STRIPE_SECRET_KEY - Payment processing</li>
                      <li>STRIPE_PUBLISHABLE_KEY - Frontend payments</li>
                      <li>FIREBASE_* - Push notifications</li>
                      <li>GOOGLE_ANALYTICS_ID - Analytics</li>
                      <li>GOOGLE_MAPS_API_KEY - Location services</li>
                      <li>VAPID_KEY - Web push</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="automations">
                  <AccordionTrigger>Automated Jobs</AccordionTrigger>
                  <AccordionContent>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Job</th>
                          <th className="text-left py-2">Schedule</th>
                          <th className="text-left py-2">Purpose</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">checkExpiredMatches</td>
                          <td className="py-2">Hourly</td>
                          <td className="py-2">Expire 24hr matches</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">checkExpiredSubscriptions</td>
                          <td className="py-2">Daily</td>
                          <td className="py-2">Downgrade expired subs</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">checkExpiredSuspensions</td>
                          <td className="py-2">Hourly</td>
                          <td className="py-2">Lift temp bans</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">sendMatchNudges</td>
                          <td className="py-2">Every 6 hours</td>
                          <td className="py-2">Remind to message</td>
                        </tr>
                        <tr>
                          <td className="py-2">sendWeeklyActivityEmail</td>
                          <td className="py-2">Weekly (Sunday)</td>
                          <td className="py-2">Activity summary email</td>
                        </tr>
                      </tbody>
                    </table>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )
    }
  };

  const filteredSections = sections.filter(s => 
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('AdminDashboard')}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft size={20} />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Book className="text-purple-600" />
                  Admin Manual
                </h1>
                <p className="text-sm text-gray-500">Complete guide to managing Afrinnect</p>
              </div>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search manual..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              {filteredSections.map(section => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-purple-100 text-purple-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Mobile Navigation */}
          <div className="lg:hidden w-full mb-4">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {manualContent[activeSection]?.title}
              </h2>
              {manualContent[activeSection]?.content}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}