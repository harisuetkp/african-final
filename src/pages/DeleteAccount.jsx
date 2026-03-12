import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
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

export default function DeleteAccount() {
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const reasons = [
    "Found someone special",
    "Taking a break from dating",
    "Not enough matches",
    "Privacy concerns",
    "Too many notifications",
    "App performance issues",
    "Moving to another app",
    "Other"
  ];

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await base44.functions.invoke('deleteAccount', { 
        reason,
        confirmDelete: true 
      });
      
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      
      // Logout and redirect
      await base44.auth.logout(createPageUrl('Landing'));
    } catch (err) {
      setError(err.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
      setShowFinalConfirm(false);
    }
  };

  const canProceed = confirmText.toLowerCase() === 'delete my account';

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-red-700">Delete Account</CardTitle>
                <CardDescription>This action cannot be undone</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* What will be deleted */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">What will be permanently deleted:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Your profile and all photos</li>
                <li>• All matches and conversations</li>
                <li>• Likes and connections</li>
                <li>• Subscription and payment history</li>
                <li>• Any Founding Member or Ambassador status</li>
              </ul>
            </div>

            {/* Reason selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why are you leaving? (Optional)
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select a reason...</option>
                {reasons.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Confirmation text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold text-red-600">"delete my account"</span> to confirm:
              </label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete my account"
                className="border-gray-300"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Delete button */}
            <Button
              onClick={() => setShowFinalConfirm(true)}
              disabled={!canProceed}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete My Account
            </Button>

            <p className="text-xs text-gray-500 text-center">
              If you have an active subscription, it will be cancelled immediately with no refund.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Final Confirmation Dialog */}
      <AlertDialog open={showFinalConfirm} onOpenChange={setShowFinalConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data. 
              You will not be able to recover any information after this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, Delete Everything'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}