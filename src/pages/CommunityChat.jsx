import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Send, Loader2, Users, Shield, Image } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AutoResizeTextarea } from "@/components/ui/autosize-textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Crown } from 'lucide-react';
import { hasAccess } from '@/components/shared/TierGate';

export default function CommunityChat() {
  const urlParams = new URLSearchParams(window.location.search);
  const communityId = urlParams.get('id');
  const [myProfile, setMyProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

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

  // Fetch community
  const { data: community } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      const communities = await base44.entities.Community.filter({ id: communityId });
      return communities[0];
    },
    enabled: !!communityId
  });

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['community-messages', communityId],
    queryFn: async () => {
      const msgs = await base44.entities.Message.filter(
        { match_id: `community_${communityId}` },
        '-created_date',
        100
      );
      return msgs.reverse();
    },
    enabled: !!communityId,
    refetchInterval: 3000
  });

  // Fetch member profiles
  const { data: memberProfiles = [] } = useQuery({
    queryKey: ['community-members', community?.members],
    queryFn: async () => {
      if (!community?.members?.length) return [];
      const profiles = await Promise.all(
        community.members.map(id => 
          base44.entities.UserProfile.filter({ id }).then(p => p[0])
        )
      );
      return profiles.filter(Boolean);
    },
    enabled: !!community?.members?.length
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, mediaUrl = null, messageType = 'text' }) => {
      if ((!content && !mediaUrl) || !myProfile) return;

      await base44.functions.invoke('sendCommunityMessage', {
        communityId,
        content: content ? content.trim() : '',
        messageType,
        mediaUrl
      });
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['community-messages'] });
    },
    onError: (error) => {
      // Extract error message from axios response if possible
      const msg = error.response?.data?.error || error.message;
      alert(msg);
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check Elite access for media
    const eliteTiers = ['elite', 'vip'];
    if (!eliteTiers.includes(myProfile?.subscription_tier)) {
      alert('Photo/Video uploads are exclusive to Elite & VIP members. Upgrade to share media!');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await sendMessageMutation.mutateAsync({ 
        content: 'Shared a photo', 
        mediaUrl: file_url, 
        messageType: 'image' 
      });
    } catch (error) {
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = () => {
    // Check premium access
    if (!hasAccess(myProfile?.subscription_tier, 'unlimited_likes')) {
      alert('Community chat is available for Premium members. Upgrade now!');
      return;
    }
    sendMessageMutation.mutate({ content: message });
  };

  const getProfile = (senderId) => {
    return memberProfiles.find(p => p.id === senderId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <Users size={32} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Community Not Found</h2>
        <p className="text-gray-500 max-w-xs">This community may have been removed or doesn't exist.</p>
        <Link to={createPageUrl('Communities')}>
          <Button>Back to Communities</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Communities')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{community.icon}</span>
                <h1 className="font-bold">{community.name}</h1>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users size={12} />
                <span>{community.members?.length || 0} members</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-4 py-4">
        <div className="space-y-4 pb-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const senderProfile = getProfile(msg.sender_id);
              const isMyMessage = msg.sender_id === myProfile?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isMyMessage ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <img
                      src={senderProfile?.primary_photo || senderProfile?.photos?.[0] || 'https://via.placeholder.com/40'}
                      alt={senderProfile?.display_name}
                      className="w-full h-full object-cover"
                    />
                  </Avatar>
                  <div className={`flex flex-col ${isMyMessage ? 'items-end' : ''}`}>
                    <p className="text-xs text-gray-500 mb-1">
                      {senderProfile?.display_name}
                    </p>
                    <div
                      className={`rounded-2xl px-4 py-2 max-w-xs ${
                        isMyMessage
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      {msg.message_type === 'image' && msg.media_url ? (
                        <img src={msg.media_url} alt="" className="rounded-lg max-w-full mb-2" />
                      ) : null}
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(msg.created_date), 'h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Input - Fixed at bottom above navigation */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
        {hasAccess(myProfile?.subscription_tier, 'unlimited_likes') ? (
          <>
            <div className="max-w-4xl mx-auto flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload">
                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={uploading}
                  type="button"
                  className="flex-shrink-0"
                >
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <Image size={20} />}
                </Button>
              </label>
              <AutoResizeTextarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 py-3"
                minHeight={44}
                maxHeight={120}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              <Shield size={12} className="inline mr-1" />
              Premium feature • AI moderated
            </p>
          </>
        ) : (
          <div className="max-w-4xl mx-auto text-center py-3 bg-gradient-to-r from-amber-50 to-purple-50 rounded-xl">
            <Crown size={20} className="inline text-amber-600 mb-1" />
            <p className="text-sm font-medium text-gray-700 mb-2">Premium Feature</p>
            <p className="text-xs text-gray-500 mb-3">Upgrade to Premium to chat in communities</p>
            <Link to={createPageUrl('PricingPlans')}>
              <Button size="sm" className="bg-gradient-to-r from-amber-500 to-amber-600">
                <Crown size={14} className="mr-1" />
                Upgrade Now
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}