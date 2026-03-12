import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Users, Eye, CheckCircle } from 'lucide-react';

export default function BroadcastMessages({ broadcasts, profiles, currentUser }) {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    target_audience: 'all',
    send_at: ''
  });
  const queryClient = useQueryClient();

  const createBroadcastMutation = useMutation({
    mutationFn: async () => {
      const broadcast = await base44.entities.BroadcastMessage.create({
        ...formData,
        created_by: currentUser.email,
        status: formData.send_at ? 'scheduled' : 'draft',
        sent_count: 0,
        open_count: 0
      });

      // If sending immediately, create notifications
      if (!formData.send_at) {
        let targetProfiles = [];
        
        switch(formData.target_audience) {
          case 'all':
            targetProfiles = profiles;
            break;
          case 'premium':
            targetProfiles = profiles.filter(p => p.is_premium);
            break;
          case 'free':
            targetProfiles = profiles.filter(p => !p.is_premium);
            break;
          case 'active':
            targetProfiles = profiles.filter(p => p.is_active);
            break;
          case 'inactive':
            targetProfiles = profiles.filter(p => !p.is_active);
            break;
        }

        // Create notifications for all target users
        for (const profile of targetProfiles) {
          await base44.entities.Notification.create({
            user_profile_id: profile.id,
            type: 'admin_message',
            title: formData.title,
            message: formData.body,
            is_admin: true
          });
        }

        // Update broadcast status
        await base44.entities.BroadcastMessage.update(broadcast.id, {
          status: 'sent',
          sent_count: targetProfiles.length
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-broadcasts']);
      setShowDialog(false);
      setFormData({
        title: '',
        body: '',
        target_audience: 'all',
        send_at: ''
      });
    }
  });

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    sending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Send size={24} className="text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{broadcasts.length}</p>
                <p className="text-sm text-gray-600">Total Broadcasts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users size={24} className="text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {broadcasts.reduce((sum, b) => sum + (b.sent_count || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Messages Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye size={24} className="text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {broadcasts.reduce((sum, b) => sum + (b.open_count || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Opens</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Button className="w-full" onClick={() => setShowDialog(true)}>
              <Send size={18} className="mr-2" />
              New Broadcast
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Broadcasts List */}
      <Card>
        <CardHeader>
          <CardTitle>Broadcast History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {broadcasts.map(broadcast => (
              <div key={broadcast.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={statusColors[broadcast.status]}>{broadcast.status}</Badge>
                    <Badge variant="outline">{broadcast.target_audience}</Badge>
                  </div>
                  <h3 className="font-semibold">{broadcast.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{broadcast.body}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {broadcast.sent_count || 0} sent
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {broadcast.open_count || 0} opened
                    </span>
                    {broadcast.send_at && (
                      <span>
                        Scheduled: {new Date(broadcast.send_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {broadcasts.length === 0 && (
              <p className="text-center text-gray-500 py-8">No broadcasts sent yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Broadcast Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Broadcast Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Target Audience</label>
              <Select value={formData.target_audience} onValueChange={(v) => setFormData({...formData, target_audience: v})}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users ({profiles.length})</SelectItem>
                  <SelectItem value="premium">Premium Users ({profiles.filter(p => p.is_premium).length})</SelectItem>
                  <SelectItem value="free">Free Users ({profiles.filter(p => !p.is_premium).length})</SelectItem>
                  <SelectItem value="active">Active Users ({profiles.filter(p => p.is_active).length})</SelectItem>
                  <SelectItem value="inactive">Inactive Users ({profiles.filter(p => !p.is_active).length})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Message Title</label>
              <Input
                placeholder="e.g., New Feature Announcement"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Message Body</label>
              <Textarea
                placeholder="Write your message..."
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                className="mt-2"
                rows={5}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Schedule Send (Optional)</label>
              <Input
                type="datetime-local"
                value={formData.send_at}
                onChange={(e) => setFormData({...formData, send_at: e.target.value})}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to send immediately</p>
            </div>

            <Button
              onClick={() => createBroadcastMutation.mutate()}
              disabled={!formData.title || !formData.body || createBroadcastMutation.isPending}
              className="w-full"
            >
              <Send size={18} className="mr-2" />
              {formData.send_at ? 'Schedule Broadcast' : 'Send Now'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}