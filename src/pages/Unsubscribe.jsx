import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, AlertTriangle, Loader2, Crown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Unsubscribe() {
  const [myProfile, setMyProfile] = useState(null);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) setMyProfile(profiles[0]);
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      }
    };
    fetchProfile();
  }, []);

  // Fetch active subscription
  const { data: subscription } = useQuery({
    queryKey: ['active-subscription', myProfile?.id],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({
        user_profile_id: myProfile.id,
        status: 'active'
      });
      return subs[0];
    },
    enabled: !!myProfile
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!subscription) throw new Error('No active subscription');

      // Update subscription
      await base44.entities.Subscription.update(subscription.id, {
        status: 'cancelled',
        auto_renew: false
      });

      // Don't downgrade immediately - let them keep premium until expiry
      // Just notify them

      await base44.entities.Notification.create({
        user_profile_id: myProfile.id,
        type: 'admin_message',
        title: 'Subscription Cancelled',
        message: `Your subscription will remain active until ${new Date(subscription.end_date).toLocaleDateString()}. We're sad to see you go!`,
        is_admin: true
      });
    },
    onSuccess: () => {
      setCancelled(true);
    }
  });

  if (!myProfile || !subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle size={60} className="mx-auto mb-6 text-amber-600" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription Cancelled</h2>
            <p className="text-gray-600 mb-6">
              Your premium features will remain active until{' '}
              <span className="font-semibold">
                {new Date(subscription.end_date).toLocaleDateString()}
              </span>
            </p>
            <Link to={createPageUrl('Profile')}>
              <Button className="w-full">Go to Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={24} />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Cancel Subscription</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Are you sure you want to cancel? You'll lose access to all premium features.
          </AlertDescription>
        </Alert>

        {/* Current Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown size={20} className="text-amber-600" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Plan</span>
              <span className="font-semibold capitalize">
                {subscription.plan_type.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount</span>
              <span className="font-semibold">
                ${subscription.amount_paid} {subscription.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Renewal Date</span>
              <span className="font-semibold">
                {new Date(subscription.end_date).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <Card>
          <CardHeader>
            <CardTitle>Help Us Improve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Why are you cancelling?</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="found_match">Found my match! ❤️</SelectItem>
                  <SelectItem value="too_expensive">Too expensive</SelectItem>
                  <SelectItem value="not_enough_matches">Not enough matches</SelectItem>
                  <SelectItem value="technical_issues">Technical issues</SelectItem>
                  <SelectItem value="taking_break">Taking a break</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Additional Feedback (Optional)</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us more..."
                rows={4}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Benefits You'll Lose */}
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">You'll Lose Access To:</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-amber-800">
              <li>• Unlimited likes and super likes</li>
              <li>• Advanced filters (location, religion, etc.)</li>
              <li>• See who likes you</li>
              <li>• Profile boosts</li>
              <li>• Read receipts</li>
              <li>• Ad-free experience</li>
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => cancelMutation.mutate()}
            disabled={!reason || cancelMutation.isPending}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            {cancelMutation.isPending ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Cancelling...
              </>
            ) : (
              'Confirm Cancellation'
            )}
          </Button>

          <Link to={createPageUrl('Profile')}>
            <Button variant="outline" className="w-full" size="lg">
              Keep My Subscription
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}