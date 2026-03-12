import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, DollarSign, RefreshCw, Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RefundsManager() {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [confirmRefund, setConfirmRefund] = useState(false);
  const queryClient = useQueryClient();

  // Search for user by email
  const searchMutation = useMutation({
    mutationFn: async (email) => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: email });
      if (profiles.length === 0) throw new Error('User not found');
      
      const profile = profiles[0];
      const subscriptions = await base44.entities.Subscription.filter({
        user_profile_id: profile.id
      }, '-created_date', 5);
      
      return { profile, subscriptions };
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  // Process refund
  const refundMutation = useMutation({
    mutationFn: async ({ profile_id, subscription_id, reason }) => {
      const response = await base44.functions.invoke('handleRefund', {
        profile_id,
        subscription_id,
        reason
      });
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Refund processed successfully');
      setShowRefundDialog(false);
      setConfirmRefund(false);
      setRefundReason('');
      // Refresh search results
      if (searchEmail) {
        searchMutation.mutate(searchEmail);
      }
    },
    onError: (error) => {
      toast.error(`Refund failed: ${error.message}`);
    }
  });

  const handleSearch = () => {
    if (searchEmail.trim()) {
      searchMutation.mutate(searchEmail.trim());
    }
  };

  const handleRefund = (subscription) => {
    setSelectedProfile({ 
      profile: searchMutation.data.profile, 
      subscription 
    });
    setShowRefundDialog(true);
  };

  const processRefund = () => {
    if (!selectedProfile) return;
    
    refundMutation.mutate({
      profile_id: selectedProfile.profile.id,
      subscription_id: selectedProfile.subscription?.id,
      reason: refundReason
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="text-green-600" />
            Refund Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-6">
            <Input
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="max-w-md"
            />
            <Button onClick={handleSearch} disabled={searchMutation.isPending}>
              {searchMutation.isPending ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Search size={18} />
              )}
              <span className="ml-2">Search</span>
            </Button>
          </div>

          {searchMutation.data && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={searchMutation.data.profile.primary_photo || '/placeholder-avatar.png'}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-lg">{searchMutation.data.profile.display_name}</h3>
                    <p className="text-gray-600">{searchMutation.data.profile.created_by}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={searchMutation.data.profile.subscription_tier === 'free' ? 'secondary' : 'default'}>
                        {searchMutation.data.profile.subscription_tier || 'free'}
                      </Badge>
                      {searchMutation.data.profile.is_banned && (
                        <Badge variant="destructive">Banned</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscriptions */}
              <div>
                <h4 className="font-semibold mb-3">Subscription History</h4>
                {searchMutation.data.subscriptions.length === 0 ? (
                  <p className="text-gray-500">No subscriptions found</p>
                ) : (
                  <div className="space-y-3">
                    {searchMutation.data.subscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{sub.plan_type}</p>
                          <p className="text-sm text-gray-600">
                            {sub.payment_provider} • ${sub.amount_paid} {sub.currency}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(sub.start_date).toLocaleDateString()} - {new Date(sub.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            sub.status === 'active' ? 'default' :
                            sub.status === 'cancelled' ? 'secondary' :
                            sub.status === 'refunded' ? 'destructive' : 'outline'
                          }>
                            {sub.status}
                          </Badge>
                          {sub.status === 'active' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRefund(sub)}
                            >
                              <RefreshCw size={14} className="mr-1" />
                              Refund
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" />
              Process Refund
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 text-sm">
                <strong>Warning:</strong> This will immediately:
              </p>
              <ul className="text-amber-700 text-sm mt-2 list-disc list-inside">
                <li>Refund the payment via Stripe</li>
                <li>Downgrade user to free tier</li>
                <li>Remove all premium features</li>
                <li>End any active video calls</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Refund Reason</label>
              <Textarea
                placeholder="Enter reason for refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmRefund(true)}
              disabled={!refundReason.trim()}
            >
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmRefund} onOpenChange={setConfirmRefund}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to refund this subscription? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={processRefund}
              disabled={refundMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {refundMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Processing...
                </>
              ) : (
                'Confirm Refund'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}