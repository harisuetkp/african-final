import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, XCircle, Clock, MessageSquare, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function DisputeManagement({ disputes, currentUser }) {
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const queryClient = useQueryClient();

  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ disputeId, approved, response }) => {
      const dispute = disputes.find(d => d.id === disputeId);
      
      // Update dispute status
      await base44.entities.Dispute.update(disputeId, {
        status: approved ? 'approved' : 'rejected',
        admin_response: response,
        reviewed_by: currentUser.email,
        reviewed_at: new Date().toISOString()
      });

      // If approved, unban the user
      if (approved && dispute.user_profile_id) {
        const profile = await base44.entities.UserProfile.filter({ id: dispute.user_profile_id });
        if (profile.length > 0) {
          await base44.entities.UserProfile.update(profile[0].id, {
            is_banned: false,
            is_suspended: false,
            is_active: true,
            ban_reason: null,
            suspension_reason: null
          });
        }
      }

      // Log admin action
      await base44.entities.AdminAuditLog.create({
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action_type: approved ? 'user_unban' : 'dispute_rejected',
        target_user_id: dispute.user_email,
        details: {
          dispute_id: disputeId,
          admin_response: response,
          approved
        }
      });

      // Send notification to user
      if (dispute.user_profile_id) {
        await base44.entities.Notification.create({
          user_profile_id: dispute.user_profile_id,
          type: 'admin_message',
          title: approved ? 'Appeal Approved' : 'Appeal Decision',
          message: response,
          is_admin: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-disputes']);
      setSelectedDispute(null);
      setAdminResponse('');
      alert('Dispute resolved successfully!');
    }
  });

  const getStatusBadge = (status) => {
    const configs = {
      pending: { color: 'bg-yellow-500', icon: Clock, label: 'Pending' },
      under_review: { color: 'bg-blue-500', icon: Eye, label: 'Under Review' },
      approved: { color: 'bg-green-500', icon: CheckCircle, label: 'Approved' },
      rejected: { color: 'bg-red-500', icon: XCircle, label: 'Rejected' }
    };
    
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white gap-1`}>
        <Icon size={14} />
        {config.label}
      </Badge>
    );
  };

  const pendingDisputes = disputes.filter(d => d.status === 'pending' || d.status === 'under_review');
  const resolvedDisputes = disputes.filter(d => d.status === 'approved' || d.status === 'rejected');

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-gray-900">{disputes.length}</p>
            <p className="text-sm text-gray-600">Total Disputes</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-300">
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-yellow-900">{pendingDisputes.length}</p>
            <p className="text-sm text-yellow-700">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-300">
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-green-900">
              {disputes.filter(d => d.status === 'approved').length}
            </p>
            <p className="text-sm text-green-700">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-300">
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-red-900">
              {disputes.filter(d => d.status === 'rejected').length}
            </p>
            <p className="text-sm text-red-700">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Disputes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} />
            Pending Disputes ({pendingDisputes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingDisputes.map(dispute => (
              <div
                key={dispute.id}
                className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{dispute.user_email}</p>
                    <p className="text-sm text-gray-600">
                      Filed: {new Date(dispute.created_date).toLocaleString()}
                    </p>
                  </div>
                  {getStatusBadge(dispute.status)}
                </div>

                <div className="bg-white p-3 rounded border border-gray-200 mb-3">
                  <p className="text-xs text-gray-500 mb-1">Original Ban Reason:</p>
                  <p className="text-sm text-gray-900">{dispute.original_ban_reason}</p>
                </div>

                <div className="bg-white p-3 rounded border border-gray-200 mb-3">
                  <p className="text-xs text-gray-500 mb-1">User's Appeal:</p>
                  <p className="text-sm text-gray-900">{dispute.reason}</p>
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setSelectedDispute(dispute)}
                        className="w-full gap-2"
                      >
                        <MessageSquare size={16} />
                        Review & Respond
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Review appeal details and send response</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}

            {pendingDisputes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle size={48} className="mx-auto mb-2 opacity-50" />
                <p>No pending disputes to review</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resolved Disputes */}
      <Card>
        <CardHeader>
          <CardTitle>Resolved Disputes ({resolvedDisputes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {resolvedDisputes.map(dispute => (
              <div
                key={dispute.id}
                className={`p-4 rounded-lg border ${
                  dispute.status === 'approved'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{dispute.user_email}</p>
                    <p className="text-xs text-gray-600">
                      Resolved by {dispute.reviewed_by} on {new Date(dispute.reviewed_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(dispute.status)}
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  <span className="font-medium">Admin Response:</span> {dispute.admin_response}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Dispute Appeal</DialogTitle>
          </DialogHeader>
          
          {selectedDispute && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">User:</p>
                <p className="font-semibold">{selectedDispute.user_email}</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-gray-600 mb-1">Original Ban Reason:</p>
                <p className="text-gray-900">{selectedDispute.original_ban_reason}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">User's Appeal:</p>
                <p className="text-gray-900">{selectedDispute.reason}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Your Response to User:
                </label>
                <Textarea
                  placeholder="Explain your decision clearly and professionally..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    if (!adminResponse.trim()) {
                      alert('Please provide a response to the user.');
                      return;
                    }
                    if (confirm('Approve this appeal and unban the user?')) {
                      resolveDisputeMutation.mutate({
                        disputeId: selectedDispute.id,
                        approved: true,
                        response: adminResponse
                      });
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                >
                  <CheckCircle size={18} />
                  Approve & Unban
                </Button>
                <Button
                  onClick={() => {
                    if (!adminResponse.trim()) {
                      alert('Please provide a response to the user.');
                      return;
                    }
                    if (confirm('Reject this appeal? User will remain banned.')) {
                      resolveDisputeMutation.mutate({
                        disputeId: selectedDispute.id,
                        approved: false,
                        response: adminResponse
                      });
                    }
                  }}
                  variant="destructive"
                  className="flex-1 gap-2"
                >
                  <XCircle size={18} />
                  Reject Appeal
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}