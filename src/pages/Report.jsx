import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, User, MessageSquare, Camera,
  Shield, Loader2, CheckCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const REPORT_TYPES = [
  { value: 'fake_profile', label: 'Fake Profile', icon: User, description: 'This person is pretending to be someone else' },
  { value: 'harassment', label: 'Harassment', icon: MessageSquare, description: 'Sending unwanted or abusive messages' },
  { value: 'inappropriate_content', label: 'Inappropriate Content', icon: Camera, description: 'Explicit photos or offensive content' },
  { value: 'scam', label: 'Scam / Fraud', icon: AlertTriangle, description: 'Asking for money or suspicious behavior' },
  { value: 'underage', label: 'Underage User', icon: Shield, description: 'This person appears to be under 18' },
  { value: 'hate_speech', label: 'Hate Speech', icon: AlertTriangle, description: 'Discriminatory or hateful content' },
  { value: 'other', label: 'Other', icon: AlertTriangle, description: 'Something else not listed above' }
];

export default function Report() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('userId');
  
  const [myProfile, setMyProfile] = useState(null);
  const [reportedProfile, setReportedProfile] = useState(null);
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
          if (profiles.length > 0) {
            setMyProfile(profiles[0]);
          }
        }

        if (userId) {
          const reported = await base44.entities.UserProfile.filter({ id: userId });
          if (reported.length > 0) {
            setReportedProfile(reported[0]);
          }
        }
      } catch (e) {
        console.log('Error fetching data');
      }
    };
    fetchData();
  }, [userId]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('submitReport', {
        reported_id: userId,
        report_type: reportType,
        description
      });
      if (response.data.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error) => {
        alert(error.message);
    }
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Report Submitted</h2>
          <p className="text-gray-500 mb-4">
            Thank you for helping keep Afrinnect safe.
          </p>
          
          {/* What Happens Next */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 text-sm mb-2">What Happens Next:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>Our safety team reviews your report within 24 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>Violating accounts are warned, suspended, or banned</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>You'll receive a notification once we take action</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>The reported user won't know who reported them</span>
              </li>
            </ul>
          </div>
          <Link to={createPageUrl('Home')}>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Matches')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={24} />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Report User</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Shield className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-amber-800 text-sm">Your Safety Matters</h3>
            <p className="text-amber-700 text-sm mt-1">
              Reports are anonymous. The reported user won't know who submitted the report.
            </p>
          </div>
        </div>

        {/* Reported User */}
        {reportedProfile && (
          <Card className="mb-6">
            <CardContent className="p-4 flex items-center gap-4">
              <img
                src={reportedProfile.primary_photo || reportedProfile.photos?.[0] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                alt={reportedProfile.display_name}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div>
                <p className="text-sm text-gray-500">Reporting:</p>
                <h3 className="font-semibold text-gray-900">{reportedProfile.display_name}</h3>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Type */}
        <div className="mb-6">
          <Label className="text-base font-semibold mb-4 block">What's the issue?</Label>
          <RadioGroup value={reportType} onValueChange={setReportType}>
            <div className="space-y-3">
              {REPORT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
                    reportType === type.value
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value={type.value} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <type.icon size={16} className={reportType === type.value ? 'text-purple-600' : 'text-gray-400'} />
                      <span className="font-medium text-gray-900">{type.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Description */}
        <div className="mb-6">
          <Label className="text-base font-semibold mb-2 block">Additional Details</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide any additional information that can help us investigate..."
            rows={4}
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={!reportType || !description || submitMutation.isPending}
          className="w-full bg-red-600 hover:bg-red-700"
          size="lg"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            'Submit Report'
          )}
        </Button>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Report?</AlertDialogTitle>
              <AlertDialogDescription>
                You're about to report {reportedProfile?.display_name || 'this user'} for {REPORT_TYPES.find(t => t.value === reportType)?.label?.toLowerCase() || 'a violation'}. Our safety team will review this within 24 hours.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => submitMutation.mutate()}
                className="bg-red-600 hover:bg-red-700"
              >
                Submit Report
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-center text-gray-500 text-xs mt-4">
          False reports may result in action against your account
        </p>
      </main>
    </div>
  );
}