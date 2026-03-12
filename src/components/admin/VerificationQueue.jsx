import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, XCircle, Shield, Camera, IdCard, Crown, Award } from 'lucide-react';

export default function VerificationQueue({ requests, profiles, currentUser }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const queryClient = useQueryClient();

  const approveVerificationMutation = useMutation({
    mutationFn: async (request) => {
      // Update verification request
      await base44.entities.VerificationRequest.update(request.id, {
        status: 'approved',
        reviewed_by: currentUser.email
      });

      // Update user profile
      const profile = profiles.find(p => p.id === request.user_profile_id);
      if (profile) {
        const updates = { ...profile.verification_status };
        if (request.verification_type === 'photo') updates.photo_verified = true;
        if (request.verification_type === 'id') updates.id_verified = true;
        
        await base44.entities.UserProfile.update(profile.id, {
          verification_status: updates
        });
        
        // Send Notification
        await base44.entities.Notification.create({
          user_profile_id: profile.id,
          type: 'admin_message',
          title: 'Verification Approved! 🎉',
          message: `Your ${request.verification_type} verification request has been approved.`,
          is_admin: true
        });

        // Send Push Notification
        try {
          await base44.functions.invoke('sendPushNotification', {
            user_profile_id: profile.id,
            title: 'Verification Approved! 🎉',
            body: `Your ${request.verification_type} verification request has been approved.`,
            type: 'system'
          });
        } catch (e) {
          console.error('Push notification failed:', e);
        }
      }

      // Log action
      await base44.entities.AdminAuditLog.create({
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action_type: 'verification_approved',
        target_user_id: request.user_profile_id,
        details: { verification_type: request.verification_type }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-verifications']);
      queryClient.invalidateQueries(['admin-profiles']);
      setSelectedRequest(null);
      alert('Verification approved!');
    }
  });

  const rejectVerificationMutation = useMutation({
    mutationFn: async (request) => {
      await base44.entities.VerificationRequest.update(request.id, {
        status: 'rejected',
        reviewed_by: currentUser.email,
        rejection_reason: rejectionReason
      });
      
      // Send Notification
      const profile = profiles.find(p => p.id === request.user_profile_id);
      if (profile) {
        await base44.entities.Notification.create({
          user_profile_id: profile.id,
          type: 'admin_message',
          title: 'Verification Update',
          message: `Your ${request.verification_type} verification request was rejected. Reason: ${rejectionReason || 'Does not meet guidelines.'}`,
          is_admin: true
        });

        // Send Push Notification
        try {
          await base44.functions.invoke('sendPushNotification', {
            user_profile_id: profile.id,
            title: 'Verification Update',
            body: `Your verification request was rejected. Check app for details.`,
            type: 'system'
          });
        } catch (e) {
          console.error('Push notification failed:', e);
        }
      }

      // Log action
      await base44.entities.AdminAuditLog.create({
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action_type: 'verification_rejected',
        target_user_id: request.user_profile_id,
        details: { verification_type: request.verification_type, reason: rejectionReason }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-verifications']);
      setSelectedRequest(null);
      setRejectionReason('');
      alert('Verification rejected.');
    }
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');

  const getVerificationIcon = (type) => {
    switch(type) {
      case 'photo': return <Camera size={18} />;
      case 'id': return <IdCard size={18} />;
      case 'elite': return <Award size={18} />;
      case 'vip': return <Crown size={18} />;
      default: return <Shield size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Shield size={24} className="text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold">{pendingRequests.length}</p>
                      <p className="text-sm text-gray-600">Pending Reviews</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>Total verification requests awaiting review</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Camera size={24} className="text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {requests.filter(r => r.verification_type === 'photo' && r.status === 'pending').length}
                      </p>
                      <p className="text-sm text-gray-600">Photo Verifications</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>Number of photo verification requests pending review</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <IdCard size={24} className="text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {requests.filter(r => r.verification_type === 'id' && r.status === 'pending').length}
                      </p>
                      <p className="text-sm text-gray-600">ID Verifications</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>Number of ID verification requests pending review</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Crown size={24} className="text-amber-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {requests.filter(r => (r.verification_type === 'elite' || r.verification_type === 'vip') && r.status === 'pending').length}
                      </p>
                      <p className="text-sm text-gray-600">Premium Badges</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>Number of premium badge verification requests pending review</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Verification Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingRequests.map(request => {
              const profile = profiles.find(p => p.id === request.user_profile_id);
              return (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    {getVerificationIcon(request.verification_type)}
                    <div>
                      <p className="font-semibold">{profile?.display_name || 'Unknown User'}</p>
                      <p className="text-sm text-gray-600 capitalize">{request.verification_type} Verification</p>
                      {request.ai_confidence_score && (
                        <Badge variant="outline" className="mt-1">
                          AI Score: {request.ai_confidence_score}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={() => setSelectedRequest(request)}>
                          Review
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Review this verification request</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              );
            })}
            {pendingRequests.length === 0 && (
              <p className="text-center text-gray-500 py-8">No pending verifications</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Verification Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              {/* Images */}
              <div className="grid md:grid-cols-2 gap-4">
                {selectedRequest.submitted_photo_url && (
                  <div>
                    <p className="text-sm font-medium mb-2">Submitted Photo</p>
                    <img 
                      src={selectedRequest.submitted_photo_url} 
                      alt="Verification" 
                      className="w-full rounded-lg border"
                    />
                  </div>
                )}
                {selectedRequest.submitted_id_url && (
                  <div>
                    <p className="text-sm font-medium mb-2">ID Document</p>
                    <img 
                      src={selectedRequest.submitted_id_url} 
                      alt="ID" 
                      className="w-full rounded-lg border"
                    />
                  </div>
                )}
              </div>

              {/* AI Score */}
              {selectedRequest.ai_confidence_score && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium">AI Confidence Score</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedRequest.ai_confidence_score}%</p>
                </div>
              )}

              {/* Rejection Reason */}
              <div>
                <label className="text-sm font-medium">Rejection Reason (Optional)</label>
                <Textarea
                  placeholder="Provide a reason if rejecting..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-2"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => approveVerificationMutation.mutate(selectedRequest)}
                        disabled={approveVerificationMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle size={18} className="mr-2" />
                        Approve
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Approve this verification and update user profile</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => rejectVerificationMutation.mutate(selectedRequest)}
                        disabled={rejectVerificationMutation.isPending}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle size={18} className="mr-2" />
                        Reject
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Reject this verification request</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}