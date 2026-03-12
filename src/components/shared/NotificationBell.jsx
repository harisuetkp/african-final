import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function NotificationBell({ className = "", variant = "ghost" }) {
  const [myProfile, setMyProfile] = React.useState(null);

  React.useEffect(() => {
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
        // Not logged in
      }
    };
    fetchProfile();
  }, []);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-count', myProfile?.id],
    queryFn: async () => {
      if (!myProfile?.id) return 0;
      try {
        const notifs = await base44.entities.Notification.filter(
          { user_profile_id: myProfile.id, is_read: false }
        );
        return notifs.length;
      } catch (error) {
        return 0;
      }
    },
    enabled: !!myProfile?.id,
    refetchInterval: 30000, // Check every 30s
    staleTime: 10000
  });

  return (
    <Link to={createPageUrl('Notifications')}>
      <Button variant={variant} size="icon" className={`relative ${className}`}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs rounded-full border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}