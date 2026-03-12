import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  FileText,
  Shield,
  CreditCard,
  Bell,
  Trash2,
  Image,
  Users,
  ArrowRight,
  Smartphone,
  Apple,
  Play
} from 'lucide-react';

export default function AppStoreComplianceAdmin() {
  const iosChecklist = [
    { id: 'delete', label: 'Account Deletion', status: 'pass', desc: 'DeleteAccount page with full flow', icon: Trash2 },
    { id: 'privacy', label: 'Privacy Policy', status: 'pass', desc: 'Privacy page accessible', icon: Shield },
    { id: 'terms', label: 'Terms of Service', status: 'pass', desc: 'Terms page accessible', icon: FileText },
    { id: 'age', label: 'Age Gating (17+)', status: 'pass', desc: 'Birth date required in onboarding', icon: Users },
    { id: 'content', label: 'Content Moderation', status: 'pass', desc: 'Photo moderation + reporting', icon: Image },
    { id: 'push', label: 'Push Notifications', status: 'pass', desc: 'Firebase FCM configured', icon: Bell },
    { id: 'iap', label: 'In-App Purchases', status: 'warning', desc: 'Use web checkout or implement StoreKit', icon: CreditCard },
    { id: 'native', label: 'Native UI/UX', status: 'pass', desc: 'Mobile-optimized responsive design', icon: Smartphone },
  ];

  const androidChecklist = [
    { id: 'delete', label: 'Account Deletion', status: 'pass', desc: 'DeleteAccount page with full flow', icon: Trash2 },
    { id: 'privacy', label: 'Privacy Policy', status: 'pass', desc: 'Privacy page accessible', icon: Shield },
    { id: 'terms', label: 'Terms of Service', status: 'pass', desc: 'Terms page accessible', icon: FileText },
    { id: 'age', label: 'Age Rating', status: 'pass', desc: 'Content suitable for 17+ rating', icon: Users },
    { id: 'content', label: 'Content Moderation', status: 'pass', desc: 'Photo moderation + reporting', icon: Image },
    { id: 'push', label: 'Push Notifications', status: 'pass', desc: 'Firebase FCM configured', icon: Bell },
    { id: 'billing', label: 'Google Play Billing', status: 'warning', desc: 'Use web checkout or implement Billing Library', icon: CreditCard },
  ];

  const getStatusBadge = (status) => {
    if (status === 'pass') return <Badge className="bg-green-100 text-green-700">✓ Pass</Badge>;
    if (status === 'warning') return <Badge className="bg-yellow-100 text-yellow-700">⚠ Action Needed</Badge>;
    return <Badge className="bg-red-100 text-red-700">✗ Required</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">App Store Compliance</h1>
          <p className="text-gray-500">Checklist for iOS App Store and Google Play Store</p>
        </div>
        <Link to={createPageUrl('AppStoreCompliance')} target="_blank">
          <Button variant="outline" className="gap-2">
            <ExternalLink size={16} />
            Full Compliance Page
          </Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Apple size={32} />
              <div>
                <h3 className="font-bold text-lg">iOS App Store</h3>
                <p className="text-gray-400 text-sm">7/8 requirements met</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-green-500">7 Pass</Badge>
              <Badge className="bg-yellow-500">1 Warning</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Play size={32} />
              <div>
                <h3 className="font-bold text-lg">Google Play Store</h3>
                <p className="text-green-200 text-sm">6/7 requirements met</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-green-800">6 Pass</Badge>
              <Badge className="bg-yellow-500 text-yellow-900">1 Warning</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* iOS Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Apple size={20} />
            iOS App Store Requirements
          </CardTitle>
          <CardDescription>
            Apple requires strict compliance for dating apps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {iosChecklist.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.status === 'pass' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                    <Icon className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Android Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play size={20} className="text-green-600" />
            Google Play Store Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {androidChecklist.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.status === 'pass' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                    <Icon className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* IAP Notice */}
      <Card className="border-yellow-300 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <CreditCard size={20} />
            In-App Purchase Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-700 space-y-4">
          <p>
            Both Apple (30%) and Google (15-30%) require their payment systems for digital subscriptions sold within apps.
          </p>
          
          <div className="bg-white/70 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Recommended Launch Strategy:</h4>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              <li><strong>Phase 1 (Launch):</strong> Web-only subscriptions via Stripe. App users are directed to web to subscribe.</li>
              <li><strong>Phase 2 (Growth):</strong> Add Apple IAP for iOS, keep Stripe for web/Android to maximize revenue.</li>
              <li><strong>Phase 3 (Scale):</strong> Add Google Play Billing for native Android experience.</li>
            </ol>
          </div>

          <p className="text-sm">
            <strong>Note:</strong> You can offer subscriptions via web without implementing IAP. Users can still use the app; 
            they just subscribe through the web checkout.
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Compliance Pages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link to={createPageUrl('DeleteAccount')} target="_blank">
            <Button variant="outline" className="w-full justify-between text-red-600">
              Test Delete Account Flow
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to={createPageUrl('Privacy')} target="_blank">
            <Button variant="outline" className="w-full justify-between">
              View Privacy Policy
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to={createPageUrl('Terms')} target="_blank">
            <Button variant="outline" className="w-full justify-between">
              View Terms of Service
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to={createPageUrl('CommunityGuidelines')} target="_blank">
            <Button variant="outline" className="w-full justify-between">
              View Community Guidelines
              <ArrowRight size={16} />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Pre-Submission Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-Submission Checklist</CardTitle>
          <CardDescription>Complete these before submitting to app stores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">Assets Needed</h4>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                App icon (1024x1024)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                Screenshots (6.5" & 5.5" iPhone)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                App preview video (optional)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                Feature graphic (Android)
              </label>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Metadata</h4>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                App description (4000 chars)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                Keywords (100 chars, iOS)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                Support URL
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                Test account for reviewers
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}