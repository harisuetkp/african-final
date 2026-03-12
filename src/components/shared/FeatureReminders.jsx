import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import { Gift, Calendar, Users, Sparkles, Heart } from 'lucide-react';
import { createPageUrl } from '@/utils';

const REMINDERS = [
  {
    id: 'communities',
    title: 'Find Your Tribe 🌍',
    message: 'Join communities to connect with people who share your culture and interests.',
    icon: Users,
    path: 'Communities',
    actionLabel: 'Explore'
  },
  {
    id: 'gifts',
    title: 'Send a Gift 🎁',
    message: 'Make someone feel special! Send a virtual gift to your match today.',
    icon: Gift,
    path: 'Matches', 
    actionLabel: 'Go to Matches'
  },
  {
    id: 'events',
    title: 'Events Near You 📅',
    message: 'Don\'t miss out on cultural festivals, parties, and meetups happening soon.',
    icon: Calendar,
    path: 'Events',
    actionLabel: 'View Events'
  },
  {
    id: 'stories',
    title: 'Share Your Moment ✨',
    message: 'Post a story to show your authentic self and get more visibility.',
    icon: Sparkles,
    path: 'Stories',
    actionLabel: 'Post Story'
  },
  {
    id: 'matches',
    title: 'Find Your Match 💖',
    message: 'New people join every day. Swipe now to find your connection!',
    icon: Heart,
    path: 'Home',
    actionLabel: 'Start Swiping'
  }
];

export default function FeatureReminders() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't show reminders on these paths
    const excludedPaths = [
      'Onboarding', 'Login', 'Waitlist', 'Admin', 'Chat', 'Video', 
      'Payment', 'Subscription', 'Legal', 'Verify'
    ];
    
    if (excludedPaths.some(p => location.pathname.includes(p))) return;

    const checkAndShowReminder = () => {
      const lastReminderTime = localStorage.getItem('last_feature_reminder_time');
      const now = Date.now();
      // Show a reminder every 15 minutes of session time
      const COOLDOWN = 15 * 60 * 1000; 

      if (!lastReminderTime || (now - parseInt(lastReminderTime)) > COOLDOWN) {
        // Get previously shown reminders to avoid repetition if possible
        const shownHistory = JSON.parse(localStorage.getItem('reminder_history') || '[]');
        
        // Filter out recently shown ones (last 3)
        const availableReminders = REMINDERS.filter(r => !shownHistory.slice(-3).includes(r.id));
        
        // Fallback to all if we've shown everything
        const candidates = availableReminders.length > 0 ? availableReminders : REMINDERS;
        
        const randomReminder = candidates[Math.floor(Math.random() * candidates.length)];
        
        const Icon = randomReminder.icon;
        toast(randomReminder.title, {
          description: randomReminder.message,
          icon: <Icon className="w-5 h-5 text-purple-600" />,
          action: {
            label: randomReminder.actionLabel,
            onClick: () => navigate(createPageUrl(randomReminder.path))
          },
          duration: 6000,
        });

        localStorage.setItem('last_feature_reminder_time', now.toString());
        
        // Update history
        const newHistory = [...shownHistory, randomReminder.id].slice(-10); // Keep last 10
        localStorage.setItem('reminder_history', JSON.stringify(newHistory));
      }
    };

    // Check 10 seconds after page load/navigation to not interrupt immediate user intent
    const timer = setTimeout(checkAndShowReminder, 10000);

    return () => clearTimeout(timer);
  }, [location.pathname, navigate]);

  return null;
}