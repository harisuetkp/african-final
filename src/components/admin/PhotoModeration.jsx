import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, AlertTriangle, Eye, Loader2, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function PhotoModeration() {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState('pending');
  const queryClient = useQueryClient();

  // Fetch photo moderation queue
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['photo-moderation', filter],
    queryFn: async () => {
      const filterQuery = filter === 'all' ? {} : { status: filter };
      return await base44.entities.PhotoModeration.filter(filterQuery, '-created_date', 100);
    },
    refetchInterval: 30000
  });

  // Fetch profile data for photos
  const { data: profiles = [] } = useQuery({
    queryKey: ['moderation-profiles', photos],
    queryFn: async () => {
      if (photos.length === 0) return [];
      const uniqueProfileIds = [...new Set(photos.map(p => p.user_profile_id))];
      const profileData = await Promise.all(
        uniqueProfileIds.map(id => 
          base44.entities.UserProfile.filter({ id }).then(p => p[0])
        )
      );
      return profileData.filter(Boolean);
    },
    enabled: photos.length > 0
  });

  const approveMutation = useMutation({
    mutationFn: async (photo) => {
      // Update photo moderation status
      await base44.entities.PhotoModeration.update(photo.id, {
        status: 'approved',
        reviewed_by: (await base44.auth.me()).id,
        reviewed_at: new Date().toISOString()
      });

      // Update user profile to add photo
      const profile = profiles.find(p => p.id === photo.user_profile_id);
      if (profile) {
        const updatedPhotos = [...(profile.photos || []), photo.photo_url];
        await base44.entities.UserProfile.update(profile.id, {
          photos: updatedPhotos,
          primary_photo: profile.primary_photo || photo.photo_url
        });
      }

      // Notify user
      await base44.entities.Notification.create({
        user_profile_id: photo.user_profile_id,
        type: 'admin_message',
        title: 'Photo Approved! ✅',
        message: 'Your photo has been approved and added to your profile',
        is_admin: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-moderation'] });
      setSelectedPhoto(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ photo, reason }) => {
      // Update photo moderation status
      await base44.entities.PhotoModeration.update(photo.id, {
        status: 'rejected',
        reviewed_by: (await base44.auth.me()).id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason
      });

      // Notify user
      await base44.entities.Notification.create({
        user_profile_id: photo.user_profile_id,
        type: 'admin_message',
        title: 'Photo Rejected',
        message: `Your photo was rejected: ${reason}`,
        is_admin: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-moderation'] });
      setSelectedPhoto(null);
      setRejectionReason('');
    }
  });

  const getProfile = (profileId) => {
    return profiles.find(p => p.id === profileId);
  };

  const stats = {
    pending: photos.filter(p => p.status === 'pending').length,
    approved: photos.filter(p => p.status === 'approved').length,
    rejected: photos.filter(p => p.status === 'rejected').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertTriangle size={32} className="text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle size={32} className="text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle size={32} className="text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} />
            Photo Moderation Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {photos.map((photo) => {
                const profile = getProfile(photo.user_profile_id);
                return (
                  <Card key={photo.id} className="overflow-hidden">
                    <div className="relative">
                      <img
                        src={photo.photo_url}
                        alt="User photo"
                        className="w-full h-64 object-cover"
                      />
                      <Badge
                        className={`absolute top-2 right-2 ${
                          photo.status === 'pending' ? 'bg-yellow-500' :
                          photo.status === 'approved' ? 'bg-green-500' :
                          'bg-red-500'
                        }`}
                      >
                        {photo.status}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{profile?.display_name}</p>
                          <p className="text-xs text-gray-500">
                            {photo.ai_flagged && '⚠️ AI Flagged'}
                          </p>
                        </div>
                      </div>
                      {photo.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => approveMutation.mutate(photo)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle size={16} className="mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => setSelectedPhoto(photo)}
                          >
                            <XCircle size={16} className="mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {photo.rejection_reason && (
                        <p className="text-xs text-red-600 mt-2">
                          Reason: {photo.rejection_reason}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {photos.length === 0 && (
                <div className="col-span-3 text-center py-12 text-gray-500">
                  <Shield size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No photos to review</p>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPhoto && (
              <img
                src={selectedPhoto.photo_url}
                alt="Photo"
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
            <div>
              <Label>Rejection Reason *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this photo is being rejected..."
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPhoto(null);
                  setRejectionReason('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => rejectMutation.mutate({ photo: selectedPhoto, reason: rejectionReason })}
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                className="flex-1"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  'Reject Photo'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}