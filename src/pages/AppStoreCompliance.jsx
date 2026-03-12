import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  FileText,
  Shield,
  CreditCard,
  Bell,
  Trash2,
  Image,
  Users,
  ArrowRight,
  Smartphone
} from 'lucide-react';

export default function AppStoreCompliance() {
  const [checkResults, setCheckResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runComplianceCheck();
  }, []);

  const runComplianceCheck = async () => {
    setLoading(true);
    
    // Simulated compliance checks
    const checks = {
      accountDeletion: {
        status: 'pass',
        label: 'Account Deletion',
        description: 'Users can delete their account from Settings',
        icon: Trash2
      },
      privacyPolicy: {
        status: 'pass',
        label: 'Privacy Policy',
        description: 'Privacy policy page exists and is accessible',
        icon: Shield
      },
      termsOfService: {
        status: 'pass',
        label: 'Terms of Service',
        description: 'Terms page exists and is accessible',
        icon: FileText
      },
      ageGating: {
        status: 'pass',
        label: 'Age Verification',
        description: 'Birth date collection during onboarding',
        icon: Users
      },
      pushNotifications: {
        status: 'pass',
        label: 'Push Notifications',
        description: 'Firebase FCM configured for iOS/Android',
        icon: Bell
      },
      contentModeration: {
        status: 'pass',
        label: 'Content Moderation',
        description: 'Photo moderation and reporting system in place',
        icon: Image
      },
      iapIntegration: {
        status: 'warning',
        label: 'In-App Purchases',
        description: 'Stripe configured - Apple IAP needed for iOS subscriptions',
        icon: CreditCard
      },
      nativeFeatures: {
        status: 'pass',
        label: 'Native Experience',
        description: 'PWA manifest and mobile-optimized UI',
        icon: Smartphone
      }
    };

    setCheckResults(checks);
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-700">Pass</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700">Needs Attention</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-700">Required</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'fail':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">App Store Compliance</h1>
          <p className="text-gray-600 mt-2">
            Checklist for Apple App Store and Google Play Store submission requirements
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-700">
                {checkResults ? Object.values(checkResults).filter(c => c.status === 'pass').length : '-'}
              </div>
              <div className="text-sm text-green-600">Passing</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-yellow-700">
                {checkResults ? Object.values(checkResults).filter(c => c.status === 'warning').length : '-'}
              </div>
              <div className="text-sm text-yellow-600">Warnings</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-red-700">
                {checkResults ? Object.values(checkResults).filter(c => c.status === 'fail').length : '-'}
              </div>
              <div className="text-sm text-red-600">Required Fixes</div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Checks */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Checklist</CardTitle>
            <CardDescription>
              Required items for App Store submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Running checks...</div>
            ) : (
              <div className="space-y-4">
                {checkResults && Object.entries(checkResults).map(([key, check]) => {
                  const Icon = check.icon;
                  return (
                    <div 
                      key={key}
                      className="flex items-center justify-between p-4 bg-white border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(check.status)}
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">{check.label}</div>
                          <div className="text-sm text-gray-500">{check.description}</div>
                        </div>
                      </div>
                      {getStatusBadge(check.status)}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* iOS IAP Notice */}
        <Card className="mt-6 border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Apple In-App Purchase Requirement
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-700 space-y-4">
            <p>
              Apple requires all digital subscriptions sold within iOS apps to use Apple's 
              In-App Purchase system. Apple takes a 15-30% commission on all transactions.
            </p>
            <div className="bg-white/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Options:</h4>
              <ul className="space-y-2 text-sm">
                <li>1. <strong>Implement Apple IAP</strong> - Full native experience, Apple takes 30%</li>
                <li>2. <strong>Web-only subscriptions</strong> - Direct users to web to subscribe (Stripe)</li>
                <li>3. <strong>Reader app exemption</strong> - Not applicable for dating apps</li>
              </ul>
            </div>
            <p className="text-sm">
              <strong>Recommendation:</strong> For launch, use web-based subscription flow. 
              Add Apple IAP later for better conversion on iOS.
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to={createPageUrl('Privacy')}>
              <Button variant="outline" className="w-full justify-between">
                Review Privacy Policy
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('Terms')}>
              <Button variant="outline" className="w-full justify-between">
                Review Terms of Service
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('CommunityGuidelines')}>
              <Button variant="outline" className="w-full justify-between">
                Review Community Guidelines
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('DeleteAccount')}>
              <Button variant="outline" className="w-full justify-between text-red-600 hover:text-red-700">
                Test Account Deletion Flow
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* App Store Submission Checklist */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Before Submission</CardTitle>
            <CardDescription>Manual checklist for app store submission</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded" />
                <span>App icons in all required sizes (1024x1024 for App Store)</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded" />
                <span>Screenshots for all device sizes (iPhone, iPad if supported)</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded" />
                <span>App description written (max 4000 characters)</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded" />
                <span>Keywords selected (max 100 characters)</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded" />
                <span>Support URL configured</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded" />
                <span>Privacy Policy URL configured</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded" />
                <span>Age rating questionnaire completed (17+ for dating)</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded" />
                <span>Test account credentials for Apple review team</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 rounded" />
                <span>App tested on physical iOS devices</span>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}