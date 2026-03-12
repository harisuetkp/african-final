import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldX, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import Logo from '@/components/shared/Logo';
import AfricanPattern from '@/components/shared/AfricanPattern';

export default function BannedScreen({ userProfile, banReason, userEmail }) {
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitDispute = async () => {
    if (!disputeReason.trim()) {
      alert('Please explain why you believe this ban is incorrect.');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.Dispute.create({
        user_email: userEmail,
        user_profile_id: userProfile?.id || null,
        dispute_type: 'ban_appeal',
        reason: disputeReason,
        original_ban_reason: banReason || 'No reason provided',
        status: 'pending'
      });
      
      setSubmitted(true);
      setShowDispute(false);
    } catch (error) {
      console.error('Failed to submit dispute:', error);
      alert('Failed to submit dispute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4 relative">
      <AfricanPattern className="text-red-600" opacity={0.05} />
      
      <div className="max-w-2xl w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="large" />
        </div>

        {/* Main Card */}
        <Card className="border-red-300 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <ShieldX size={32} />
              Account Suspended
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {/* Ban Notice */}
            <Alert className="bg-red-50 border-red-300">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-900 font-medium">
                Your account has been suspended and you cannot access Afrinnect at this time.
              </AlertDescription>
            </Alert>

            {/* Reason */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2 font-semibold">Reason for suspension:</p>
              <p className="text-gray-900">{banReason || 'Violation of community guidelines'}</p>
            </div>

            {/* What This Means */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">What this means:</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>You cannot access your profile or use any Afrinnect features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>Your profile is hidden from other users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>All matches and conversations are paused</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  <span>This suspension may be temporary or permanent depending on the violation</span>
                </li>
              </ul>
            </div>

            {/* Success Message */}
            {submitted && (
              <Alert className="bg-green-50 border-green-300">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-900">
                  Your appeal has been submitted successfully. Our team will review it within 24-48 hours and contact you via email.
                </AlertDescription>
              </Alert>
            )}

            {/* Dispute Form */}
            {showDispute && !submitted && (
              <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare size={20} />
                  File an Appeal
                </h3>
                <p className="text-sm text-gray-600">
                  If you believe this suspension is a mistake or you'd like to explain your situation, please provide details below:
                </p>
                <Textarea
                  placeholder="Explain why you believe this suspension is incorrect or provide context about your situation..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={6}
                  className="w-full"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmitDispute}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDispute(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!showDispute && !submitted && (
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={() => setShowDispute(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <MessageSquare size={18} />
                  File an Appeal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => base44.auth.logout()}
                  className="w-full"
                >
                  Logout
                </Button>
              </div>
            )}

            {submitted && (
              <Button
                variant="outline"
                onClick={() => base44.auth.logout()}
                className="w-full"
              >
                Logout
              </Button>
            )}

            {/* Contact Support */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Need immediate help? Email us at{' '}
                <a href="mailto:support@afrinnect.com" className="text-blue-600 hover:underline font-medium">
                  support@afrinnect.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Copyright */}
        <p className="text-center mt-6 text-sm text-gray-600">
          © {new Date().getFullYear()} Afrinnect. All rights reserved.
        </p>
      </div>
    </div>
  );
}