import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Users, MessageCircle, Crown, Shield, Trash2, CheckCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmptyState from '@/components/shared/EmptyState';

export default function Notifications() {
  const [myProfile, setMyProfile] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
          if (profiles.length > 0) {
            setMyProfile(profiles[0]);
          }
        }
      } catch (e) {
        console.log('Not logged in');
      }
    };
    fetchProfile();
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', myProfile?.id],
    queryFn: async () => {
      try {
        const allNotifs = await base44.entities.Notification.filter(
          { user_profile_id: myProfile.id },
          '-created_date',
          50
        );
        
        // Sort notifications: likes/super_likes first (if premium), then matches, then messages, then others
        const isPremium = myProfile?.subscription_tier && myProfile.subscription_tier !== 'free';
        
        return allNotifs.sort((a, b) => {
          const priority = (notif) => {
            if (isPremium && (notif.type === 'like' || notif.type === 'super_like')) return 0;
            if (notif.type === 'match') return 1;
            if (notif.type === 'message') return 2;
            if (notif.type === 'admin_message') return 3;
            return 4;
          };
          
          const priorityDiff = priority(a) - priority(b);
          if (priorityDiff !== 0) return priorityDiff;
          
          // Within same priority, sort by date (newest first)
          return new Date(b.created_date) - new Date(a.created_date);
        });
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
      }
    },
    enabled: !!myProfile,
    staleTime: 120000,
    retry: 1,
    retryDelay: 5000
  });

  const markReadMutation = useMutation({
    mutationFn: (notifId) => base44.entities.Notification.update(notifId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const deleteNotifMutation = useMutation({
    mutationFn: (notifId) => base44.entities.Notification.delete(notifId),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markReadMutation.mutate(notif.id);
    }
    if (notif.link_to) {
      window.location.href = notif.link_to;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'match': return <Heart className="text-pink-500" size={24} />;
      case 'like': return <Heart className="text-purple-500" size={24} />;
      case 'super_like': return <Crown className="text-amber-500" size={24} />;
      case 'message': return <MessageCircle className="text-blue-500" size={24} />;
      case 'admin_message': return <Shield className="text-red-500" size={24} />;
      default: return <Users className="text-gray-500" size={24} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="bg-purple-600">{unreadCount} new</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-purple-600 hover:bg-purple-50"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck size={18} className="mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </header>

      <ScrollArea className="max-w-2xl mx-auto">
        <div className="p-4 space-y-2">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No notifications yet"
                description="We'll let you know when you get likes, matches, or messages"
                className="py-8"
              />
            ) : (
              notifications.map((notif, idx) => {
                // Check if this is a like notification and user needs premium
                const isLikeNotif = notif.type === 'like' || notif.type === 'super_like';
                const needsPremium = isLikeNotif && (!myProfile?.subscription_tier || myProfile.subscription_tier === 'free');
                
                return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                    notif.is_read
                      ? 'bg-white border-gray-200'
                      : isLikeNotif ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 border-2' : 'bg-purple-50 border-purple-200'
                  } ${notif.is_admin ? 'border-l-4 border-l-red-500' : ''} ${needsPremium ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{getNotificationIcon(notif.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {needsPremium ? 'Someone special is interested in you! Upgrade to see who.' : notif.message}
                          </p>
                          {notif.is_admin && (
                            <Badge className="mt-2 bg-red-600 text-xs">From Admin</Badge>
                          )}
                          {needsPremium && (
                            <Link to={createPageUrl('PricingPlans')}>
                              <Badge className="mt-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs cursor-pointer hover:from-amber-600 hover:to-amber-700">
                                <Crown size={10} className="mr-1" />
                                Upgrade to See Who
                              </Badge>
                            </Link>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotifMutation.mutate(notif.id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.created_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )})
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}