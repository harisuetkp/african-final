import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Grid3X3, Layers, Globe, MapPin, Sparkles, Crown, Heart as HeartIcon, RotateCcw, User, Loader2, AlertTriangle, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileCard from '@/components/profile/ProfileCard';
import ProfileMini from '@/components/profile/ProfileMini';
import FilterDrawer from '@/components/discovery/FilterDrawer';
import Logo from '@/components/shared/Logo';
import AfricanPattern from '@/components/shared/AfricanPattern';
import LikesLimitPaywall from '@/components/paywall/LikesLimitPaywall';
import AdBanner from '@/components/ads/AdBanner';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import TutorialTooltip from '@/components/shared/TutorialTooltip';
import MessageWithLikeModal from '@/components/home/MessageWithLikeModal';
import UbuntuAIButton from '@/components/shared/UbuntuAIButton';
import NotificationBell from '@/components/shared/NotificationBell';
import confetti from 'canvas-confetti';
import { usePerformanceMonitor } from '@/components/shared/usePerformanceMonitor';
import EmptyState from '@/components/shared/EmptyState';
import { useConversionTracker, CONVERSION_EVENTS } from '@/components/shared/ConversionTracker';
import { hasAccess } from '@/components/shared/TierGate';
import { useTierConfig, getTierLimit, isUnlimited } from '@/components/shared/useTierConfig';
import PullToRefresh from '@/components/shared/PullToRefresh';
import LazyImage from '@/components/shared/LazyImage';
import { useUpgradePrompts, UpgradePromptBanner } from '@/components/monetization/UpgradePrompts';
import { ProfileCardSkeleton } from '@/components/shared/SkeletonLoader';
import BannedScreen from '@/components/auth/BannedScreen';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TrialExpiryBanner from '@/components/monetization/TrialExpiryBanner';
import { useLanguage } from '@/components/i18n/LanguageContext';
import FeedbackModal from '@/components/matching/FeedbackModal';
import ProfileSuggestions from '@/components/matching/ProfileSuggestions';
import ProgressToTrial from '@/components/monetization/ProgressToTrial';
import BlurredLikesTeaser from '@/components/monetization/BlurredLikesTeaser';
import BoostButton from '@/components/monetization/BoostButton';
import SuperLikeCounter from '@/components/monetization/SuperLikeCounter';
import LikesCounter from '@/components/monetization/LikesCounter';
import ActivitySummaryBanner from '@/components/monetization/ActivitySummaryBanner';
import WeeklyTopPicks from '@/components/monetization/WeeklyTopPicks';
import PremiumBadgeOnProfile from '@/components/monetization/PremiumBadgeOnProfile';
import MatchMilestones from '@/components/monetization/MatchMilestones';
import VIPEventsPromo from '@/components/monetization/VIPEventsPromo.jsx';
import FoundingMemberBanner from '@/components/founding/FoundingMemberBanner';

export default function Home() {
  usePerformanceMonitor('Home');
  const { trackEvent } = useConversionTracker();
  const { t } = useLanguage();
  
  const [viewMode, setViewMode] = useState('swipe');
  const [discoveryMode, setDiscoveryMode] = useState('global');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filters, setFilters] = useState({});
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [showLimitPaywall, setShowLimitPaywall] = useState(false);
  const [swipeHistory, setSwipeHistory] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [pendingLikeProfile, setPendingLikeProfile] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackProfile, setFeedbackProfile] = useState(null);
  const [profileViewStartTime, setProfileViewStartTime] = useState(Date.now());
  const [photosViewedCount, setPhotosViewedCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { prompt: upgradePrompt, dismissPrompt } = useUpgradePrompts(myProfile);
  const { tiers: tierConfig } = useTierConfig();

  // Fetch AI Behavior Analysis Recommendations - DEFERRED to avoid blocking initial load
  useEffect(() => {
    if (!myProfile?.id) return;
    
    // Delay recommendation fetch to not block initial render
    const timer = setTimeout(async () => {
      try {
        const recs = await base44.entities.UserRecommendation.filter({ user_id: myProfile.id, is_dismissed: false });
        if (recs.length > 0) {
          setRecommendations(recs);
        }
        // Skip analyzeBehavior on page load - too slow
      } catch(e) {}
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [myProfile?.id]);

  // OPTIMIZATION: Prefetch Activity Data - DEFERRED
  useEffect(() => {
    if (!myProfile?.id) return;
    
    // Delay prefetch to not block initial render
    const timer = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: ['who-likes-me', myProfile.id],
        queryFn: () => base44.entities.Like.filter({ liked_id: myProfile.id, is_seen: false }, '-created_date', 50),
        staleTime: 120000
      });
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [myProfile?.id, queryClient]);

  // Fetch counts for badge - OPTIMIZED with longer staleTime
  const { data: activityCounts } = useQuery({
    queryKey: ['activity-counts', myProfile?.id],
    queryFn: async () => {
      if (!myProfile?.id) return { likes: 0, views: 0 };
      try {
        const likes = await base44.entities.Like.filter({ liked_id: myProfile.id, is_seen: false });
        return { likes: likes.length, views: 0 };
      } catch (e) {
        console.error('Failed to fetch activity counts:', e);
        return { likes: 0, views: 0 };
      }
    },
    enabled: !!myProfile?.id,
    staleTime: 60000,
    refetchInterval: 120000, // Reduced frequency to prevent rate limiting
    retry: 1
  });

  // CRITICAL: Check auth first - OPTIMIZED (removed blocking calls)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          navigate(createPageUrl('Landing'));
          return;
        }
        setIsCheckingAuth(false);
        
        // Defer non-critical checks to background
        setTimeout(async () => {
          try {
            const user = await base44.auth.me();
            // Ban check and subscription revalidation in background
            base44.functions.invoke('checkBannedUser', { email: user.email }).catch(() => {});
            base44.functions.invoke('revalidateSubscription').catch(() => {});
          } catch (e) {}
        }, 1000);
      } catch (e) {
        navigate(createPageUrl('Landing'));
      }
    };
    checkAuth();
  }, []);

  // Fetch user's profile and redirect if needed
  useEffect(() => {
    if (isCheckingAuth) return; // Wait for auth check
    
    const fetchMyProfile = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
          // Not logged in - redirect to landing
          navigate(createPageUrl('Landing'));
          return;
        }
        
        if (user.role === 'admin' || user.email === 'pivotngoyb@gmail.com') {
          setIsAdmin(true);
        }

        // Use filter to securely get only the current user's profile
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) {
          const profile = profiles[0];

          // CRITICAL: Check if user is banned FIRST
          if (profile.is_banned || profile.is_suspended) {
            setMyProfile(profile);
            return; // Stop here - BannedScreen will be shown
          }
          
          // Update device tracking on login
          // Try to get existing deviceId from localStorage or create a new persistent one
          let deviceId = localStorage.getItem('device_id');
          if (!deviceId) {
            // Generate a more stable ID that doesn't change on refresh
            deviceId = navigator.userAgent + '_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('device_id', deviceId);
          }
          
          const existingDeviceIds = profile.device_ids || [];
          
          if (!existingDeviceIds.includes(deviceId)) {
            // New device - check limit
            if (existingDeviceIds.length >= 4) {
              alert('Maximum 4 devices allowed. Please remove an old device from Settings.');
              navigate(createPageUrl('Settings'));
              return;
            }
            
            // Add new device
            await base44.entities.UserProfile.update(profile.id, {
              device_ids: [...existingDeviceIds, deviceId],
              device_info: [
                ...(profile.device_info || []),
                {
                  device_id: deviceId,
                  device_name: navigator.userAgent.substring(0, 50),
                  last_login: new Date().toISOString()
                }
              ]
            });
          }
          
          setMyProfile(profile);

          // Update login streak
          const today = new Date().toISOString().split('T')[0];
          const lastLogin = profile.last_login_date;
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          
          if (lastLogin !== today) {
            try {
              let newStreak = profile.login_streak || 0;
              if (lastLogin === yesterday) {
                newStreak += 1; // Consecutive day
              } else if (lastLogin !== today) {
                newStreak = 1; // Reset streak
              }
              
              await base44.entities.UserProfile.update(profile.id, {
                login_streak: newStreak,
                last_login_date: today,
                last_active: new Date().toISOString()
              });
            } catch (error) {
              console.error('Failed to update login streak:', error);
            }
          }
        } else {
          // No profile found - redirect to onboarding
          console.log("No profile found");
          navigate(createPageUrl('Onboarding'));
        }
      } catch (e) {
        // Not logged in - do nothing, let them see landing
      }
    };
    fetchMyProfile();
  }, [isCheckingAuth]);

  // Calculate age helper function
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  // Calculate distance between two coordinates (Haversine formula) - Returns Miles
  // Note: 1 Km = 0.621371 Miles. R (Earth Radius) in miles = 3959
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 3959; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c); 
  };

  // OPTIMIZED: AI-powered match score with caching
  const matchScoreCache = React.useRef(new Map());
  
  const calculateMatchScore = async (user1, user2) => {
    if (!user1 || !user2) return 0;
    
    // Check cache first (prevents recalculation)
    const cacheKey = `${user1.id}_${user2.id}`;
    if (matchScoreCache.current.has(cacheKey)) {
      return matchScoreCache.current.get(cacheKey);
    }
    
    let score = 0;
    
    // Cultural compatibility (25 points)
    if (user1.country_of_origin === user2.country_of_origin) score += 10;
    if (user1.tribe_ethnicity === user2.tribe_ethnicity) score += 8;
    if (user1.languages?.some(l => user2.languages?.includes(l))) score += 7;
    
    // Cultural values alignment (20 points)
    const sharedCulturalValues = user1.cultural_values?.filter(v => user2.cultural_values?.includes(v))?.length || 0;
    score += Math.min(sharedCulturalValues * 4, 20);
    
    // Relationship goals & religion (20 points)
    if (user1.religion === user2.religion) score += 10;
    if (user1.relationship_goal === user2.relationship_goal) score += 10;
    
    // Interests alignment (15 points)
    const sharedInterests = user1.interests?.filter(i => user2.interests?.includes(i))?.length || 0;
    score += Math.min(sharedInterests * 3, 15);
    
    // Location proximity (10 points)
    if (user1.current_country === user2.current_country) score += 5;
    if (user1.current_city === user2.current_city) score += 5;
    
    // Preference match (10 points)
    const user1Gender = user1.gender;
    const user2Gender = user2.gender;
    if (user1.looking_for?.includes(user2Gender)) score += 5;
    if (user2.looking_for?.includes(user1Gender)) score += 5;
    
    // Lifestyle compatibility (bonus)
    if (user1.lifestyle?.smoking === user2.lifestyle?.smoking) score += 3;
    if (user1.lifestyle?.drinking === user2.lifestyle?.drinking) score += 3;
    if (user1.lifestyle?.fitness === user2.lifestyle?.fitness) score += 4;
    
    const finalScore = Math.min(Math.round(score), 100);
    
    // Cache the result (expires on component unmount)
    matchScoreCache.current.set(cacheKey, finalScore);
    
    return finalScore;
  };

  // Fetch profiles for discovery - OPTIMIZED via Backend Function
  const { data: profiles = [], isLoading, refetch } = useQuery({
    queryKey: ['discovery-profiles', filters, discoveryMode, myProfile?.id],
    queryFn: async () => {
      const savedFilters = myProfile?.filters || {};
      const combinedFilters = { ...savedFilters, ...filters };

      try {
        const response = await base44.functions.invoke('getDiscoveryProfiles', {
           filters: combinedFilters,
           mode: discoveryMode,
           myProfileId: myProfile.id,
           limit: 15
        });
        return response.data.profiles || [];
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
        return [];
      }
    },
    enabled: !!myProfile?.id,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 300000,
    gcTime: 600000,
    retry: 1
  });

  // Image Preloading for instant swipes
  useEffect(() => {
    if (profiles.length > 0 && currentIndex + 1 < profiles.length) {
      const nextProfile = profiles[currentIndex + 1];
      if (nextProfile.primary_photo) {
        const img = new Image();
        img.src = nextProfile.primary_photo;
      }
      // Preload the one after that too if possible
      if (currentIndex + 2 < profiles.length) {
         const nextNext = profiles[currentIndex + 2];
         if (nextNext.primary_photo) {
           const img2 = new Image();
           img2.src = nextNext.primary_photo;
         }
      }
    }
  }, [currentIndex, profiles]);

  // Check daily like limit - uses centralized tier configuration
  const canLike = () => {
    if (isAdmin) return true; // Admins get unlimited likes
    
    const tier = myProfile?.subscription_tier || 'free';
    const dailyLikesLimit = getTierLimit(tierConfig, tier, 'daily_likes');
    
    // -1 means unlimited
    if (isUnlimited(dailyLikesLimit)) return true;

    // Use local date string for comparisons
    const now = new Date();
    const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const resetDate = myProfile?.daily_likes_reset_date;
    const likesUsed = myProfile?.daily_likes_count || 0;

    if (resetDate !== today) {
      return true; // New day, reset
    }

    return likesUsed < dailyLikesLimit;
  };

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async ({ likedId, isSuperLike = false, likeNote = null }) => {
      if (!myProfile) return;

      // Check daily limit
      if (!canLike()) {
        throw new Error('daily_limit_reached');
      }

      // Update like count
      const now = new Date();
      const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const resetDate = myProfile.daily_likes_reset_date;
      const shouldReset = resetDate !== today;

      await base44.entities.UserProfile.update(myProfile.id, {
        daily_likes_count: shouldReset ? 1 : (myProfile.daily_likes_count || 0) + 1,
        daily_likes_reset_date: today
      });
      
      // Fetch liked profile to get user_id
      const likedProfiles = await base44.entities.UserProfile.filter({ id: likedId });
      if (!likedProfiles.length) throw new Error('Profile not found');
      const likedProfile = likedProfiles[0];

      // Check if user has Priority Likes (Elite/VIP perk)
      const tier = myProfile.subscription_tier || 'free';
      const isPriorityLike = tier === 'elite' || tier === 'vip';
      
      // Create like record with security fields
      await base44.entities.Like.create({
        liker_id: myProfile.id,
        liked_id: likedId,
        liker_user_id: myProfile.user_id,
        liked_user_id: likedProfile.user_id,
        is_super_like: isSuperLike,
        is_seen: false,
        is_priority: isPriorityLike,
        priority_boost_expires: isPriorityLike ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
      });

      // If there's a note, create initial message
      if (likeNote) {
        // Check if match exists first
        const existingMatch = await base44.entities.Match.filter({
          $or: [
            { user1_id: myProfile.id, user2_id: likedId },
            { user1_id: likedId, user2_id: myProfile.id }
          ]
        });

        if (existingMatch.length > 0) {
          await base44.entities.Message.create({
            match_id: existingMatch[0].id,
            sender_id: myProfile.id,
            receiver_id: likedId,
            sender_user_id: myProfile.user_id,
            receiver_user_id: likedProfile.user_id,
            content: likeNote,
            message_type: 'text',
            like_note: likeNote
          });
        }
      }

      // Check for mutual like (match)
      const mutualLikes = await base44.entities.Like.filter({
        liker_id: likedId,
        liked_id: myProfile.id
      });

      if (mutualLikes.length > 0) {
        // CRITICAL FIX: Check if match already exists to prevent duplicates
        const existingMatches = await base44.entities.Match.filter({
          $or: [
            { user1_id: myProfile.id, user2_id: likedId },
            { user1_id: likedId, user2_id: myProfile.id }
          ]
        });

        // Only create match if it doesn't exist
        if (existingMatches.length === 0) {
          // Track first match
          if (!myProfile.has_matched_before) {
            trackEvent(CONVERSION_EVENTS.FIRST_MATCH);
            await base44.entities.UserProfile.update(myProfile.id, {
              has_matched_before: true
            });
          }

          // Mark both likes as seen
          await base44.entities.Like.update(mutualLikes[0].id, { is_seen: true });
          const myNewLike = await base44.entities.Like.filter({
            liker_id: myProfile.id,
            liked_id: likedId
          });
          if (myNewLike.length > 0) {
            await base44.entities.Like.update(myNewLike[0].id, { is_seen: true });
          }

          // Create match with 24hr expiry timer
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          
          await base44.entities.Match.create({
            user1_id: myProfile.id,
            user2_id: likedId,
            user1_user_id: myProfile.user_id,
            user2_user_id: likedProfile.user_id,
            user1_liked: true,
            user2_liked: true,
            is_match: true,
            matched_at: new Date().toISOString(),
            expires_at: expiresAt,
            is_expired: false,
            last_chance_sent: false,
            first_message_sent: false,
            status: 'active'
          });

          // Send notifications and push notifications to both users
          const likedProfiles = await base44.entities.UserProfile.filter({ id: likedId });
          if (likedProfiles.length > 0) {
          await base44.entities.Notification.create({
            user_profile_id: likedId,
            user_id: likedProfile.user_id,
            type: 'match',
            title: "It's a Match! 💕",
            message: `You and ${myProfile.display_name} liked each other!`,
            from_profile_id: myProfile.id,
            link_to: createPageUrl('Matches')
          });
          
          // Send push notification
          try {
            await base44.functions.invoke('sendPushNotification', {
              user_profile_id: likedId,
              title: "It's a Match! 💕",
              body: `You and ${myProfile.display_name} liked each other!`,
              link: createPageUrl('Matches'),
              type: 'match'
            });
          } catch (e) {
            console.error('Push notification failed:', e);
          }

          await base44.entities.Notification.create({
            user_profile_id: myProfile.id,
            user_id: myProfile.user_id,
            type: 'match',
            title: "It's a Match! 💕",
            message: `You and ${likedProfiles[0].display_name} liked each other!`,
            from_profile_id: likedId,
            link_to: createPageUrl('Matches')
          });
          
          // Send push notification
          try {
            await base44.functions.invoke('sendPushNotification', {
              user_profile_id: myProfile.id,
              title: "It's a Match! 💕",
              body: `You and ${likedProfiles[0].display_name} liked each other!`,
              link: createPageUrl('Matches'),
              type: 'match'
            });
          } catch (e) {
            console.error('Push notification failed:', e);
            }
          }

          return { isMatch: true };
        } else {
          // Match already exists
          return { isMatch: true };
        }
      } else {
        // Send like notification
        await base44.entities.Notification.create({
          user_profile_id: likedId,
          user_id: likedProfile.user_id,
          type: isSuperLike ? 'super_like' : 'like',
          title: isSuperLike ? "You got a Super Like! ⭐" : "Someone likes you!",
          message: `${myProfile.display_name} ${isSuperLike ? 'super liked' : 'liked'} your profile`,
          from_profile_id: myProfile.id,
          link_to: createPageUrl('Matches')
        });
        
        // Send push notification
        try {
          await base44.functions.invoke('sendPushNotification', {
            user_profile_id: likedId,
            title: isSuperLike ? "You got a Super Like! ⭐" : "Someone likes you!",
            body: `${myProfile.display_name} ${isSuperLike ? 'super liked' : 'liked'} your profile`,
            link: createPageUrl('Matches'),
            type: isSuperLike ? 'super_like' : 'like'
          });
        } catch (e) {
          console.error('Push notification failed:', e);
        }
      }
      return { isMatch: false };
    },
    onSuccess: (data) => {
      if (data?.isMatch) {
        // Celebrate match with confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setShowMatchCelebration(true);
        setMatchCount(prev => prev + 1); // Trigger milestone check
        setTimeout(() => setShowMatchCelebration(false), 3000);
      }
      setCurrentIndex(prev => prev + 1);
    },
    onError: (error) => {
      if (error.message === 'daily_limit_reached') {
        setShowLimitPaywall(true);
      }
    }
  });

  const handleLike = (profile) => {
    // Show message modal
    setPendingLikeProfile(profile);
    setShowMessageModal(true);
  };

  const handleLikeWithMessage = async (message) => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    setSwipeHistory([...swipeHistory, { profile: pendingLikeProfile, action: 'like', index: currentIndex }]);
    likeMutation.mutate({ likedId: pendingLikeProfile.id, likeNote: message });
    setShowMessageModal(false);
    setPendingLikeProfile(null);
  };

  const handleSuperLike = async (profile) => {
    const tier = myProfile?.subscription_tier || 'free';

    // Check super like limits by tier - Use local start of day
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const startOfDayISO = now.toISOString();

    const superLikesToday = await base44.entities.Like.filter({
      liker_id: myProfile.id,
      is_super_like: true,
      created_date: { $gte: startOfDayISO }
    });
    
    // Free: 1 per week, Premium: 5 per day, Elite/VIP: unlimited
    const limits = {
      free: { count: 1, period: 'week' },
      premium: { count: 5, period: 'day' },
      elite: { count: 999, period: 'day' },
      vip: { count: 999, period: 'day' }
    };
    
    const limit = limits[tier] || limits.free;
    
    if (tier === 'free') {
      // Check weekly limit
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const superLikesThisWeek = await base44.entities.Like.filter({
        liker_id: myProfile.id,
        is_super_like: true,
        created_date: { $gte: weekAgo }
      });
      
      if (superLikesThisWeek.length >= 1) {
        alert(t('admin.home.freeSuperLikeLimit'));
        return;
      }
      } else if (tier === 'premium' && superLikesToday.length >= 5) {
      alert(t('admin.home.premiumSuperLikeLimit'));
      return;
      }
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }
    setSwipeHistory([...swipeHistory, { profile, action: 'superlike', index: currentIndex }]);
    likeMutation.mutate({ likedId: profile.id, isSuperLike: true });
  };

  // Pass mutation
  const passMutation = useMutation({
    mutationFn: async () => {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
      
      // Record the pass so they don't see this person again
      await base44.entities.Pass.create({
        passer_id: myProfile.id,
        passed_id: currentProfile.id,
        passer_user_id: myProfile.user_id,
        is_rewindable: true
      });

      // Record interaction for ML learning
      const timeSpent = Date.now() - profileViewStartTime;
      try {
        await base44.functions.invoke('mlMatchingEngine', {
          action: 'record_interaction',
          payload: {
            userId: myProfile.id,
            targetProfileId: currentProfile.id,
            actionType: 'pass',
            metadata: {
              timeSpent,
              photosViewed: photosViewedCount,
              bioExpanded: false
            }
          }
        });
      } catch (e) {
        console.log('ML tracking skipped:', e);
      }
    },
    onSuccess: () => {
      setSwipeHistory([...swipeHistory, { profile: currentProfile, action: 'pass', index: currentIndex }]);
      setCurrentIndex(prev => prev + 1);
      setProfileViewStartTime(Date.now());
      setPhotosViewedCount(0);
      // Skip feedback modal and immediate refetch for speed
    },
    onError: (error) => {
      console.error('Failed to record pass:', error);
      setSwipeHistory([...swipeHistory, { profile: currentProfile, action: 'pass', index: currentIndex }]);
      setCurrentIndex(prev => prev + 1);
    }
  });

  const handlePass = () => {
    passMutation.mutate();
  };

  const handleRewind = async () => {
    const tier = myProfile?.subscription_tier || 'free';
    const dailyRewindsLimit = getTierLimit(tierConfig, tier, 'daily_rewinds');
    
    // Free users can't rewind (limit = 0)
    if (dailyRewindsLimit === 0) {
      setShowLimitPaywall(true);
      return;
    }
    
    if (swipeHistory.length === 0) {
      return;
    }

    // Check daily limit if not unlimited
    if (!isUnlimited(dailyRewindsLimit)) {
      const now = new Date();
      const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const rewindsToday = parseInt(localStorage.getItem(`rewinds_${today}`) || '0');
      if (rewindsToday >= dailyRewindsLimit) {
        alert(`You've used all ${dailyRewindsLimit} rewinds for today. Upgrade to Elite for unlimited rewinds!`);
        return;
      }
      localStorage.setItem(`rewinds_${today}`, String(rewindsToday + 1));
    }
    
    const lastAction = swipeHistory[swipeHistory.length - 1];
    
    // If last action was a like, delete it
    if (lastAction.action === 'like' || lastAction.action === 'superlike') {
      const existingLikes = await base44.entities.Like.filter({
        liker_id: myProfile.id,
        liked_id: lastAction.profile.id
      });
      
      for (const like of existingLikes) {
        await base44.entities.Like.delete(like.id);
      }
    }
    
    // If last action was a pass, delete the pass record
    if (lastAction.action === 'pass') {
      const existingPasses = await base44.entities.Pass.filter({
        passer_id: myProfile.id,
        passed_id: lastAction.profile.id
      });
      
      for (const pass of existingPasses) {
        await base44.entities.Pass.delete(pass.id);
      }
    }
    
    setCurrentIndex(lastAction.index);
    setSwipeHistory(swipeHistory.slice(0, -1));
    
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  const tutorialSteps = [
    { icon: '👋', title: 'Welcome to Afrinnect!', description: 'Swipe right to like, left to pass. Let\'s find your perfect match!' },
    { icon: '⭐', title: 'Super Like', description: 'Tap the star to super like someone special. They\'ll know you\'re really interested!' },
    { icon: '🔥', title: 'Daily Matches', description: 'Check your daily curated matches for the best compatibility!' },
    { icon: '💎', title: 'Premium Features', description: 'Upgrade to see who likes you, get unlimited likes, and more!' }
  ];

  const completeTutorial = async () => {
    if (myProfile) {
      await base44.entities.UserProfile.update(myProfile.id, {
        tutorial_completed: true
      });
    }
  };

  const currentProfile = profiles[currentIndex];
  const hasMoreProfiles = currentIndex < profiles.length;

  // Show nothing while checking auth (will redirect to Landing if not authenticated)
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-amber-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show banned screen if user is banned or suspended
  if (myProfile && (myProfile.is_banned || myProfile.is_suspended)) {
    return (
      <BannedScreen
        userProfile={myProfile}
        banReason={myProfile.ban_reason || myProfile.suspension_reason || 'Violation of community guidelines'}
        userEmail={myProfile.created_by}
      />
    );
  }



  return (
    <PullToRefresh onRefresh={refetch}>
    <div className="h-[100dvh] flex flex-col bg-gradient-to-br from-gray-50 via-purple-50/30 to-amber-50/20 relative overflow-hidden">
      <AfricanPattern className="text-purple-600" opacity={0.03} />
      
      {/* Header - Native App Bar */}
      <header className="flex-shrink-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100/50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Logo />
            
            <div className="flex items-center gap-3">
              {/* Discovery Mode Toggle */}
              <Tabs value={discoveryMode} onValueChange={setDiscoveryMode}>
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="local" className="gap-1 text-xs sm:text-sm">
                    <MapPin size={14} />
                    <span className="hidden sm:inline">{t('home.local')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="global" className="gap-1 text-xs sm:text-sm">
                    <Globe size={14} />
                    <span className="hidden sm:inline">{t('home.global')}</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* View Mode Toggle */}
              <Tabs value={viewMode} onValueChange={setViewMode}>
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="swipe">
                    <Layers size={18} />
                  </TabsTrigger>
                  <TabsTrigger value="grid">
                    <Grid3X3 size={18} />
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Filters */}
              <FilterDrawer 
                filters={filters} 
                onFiltersChange={setFilters}
                isPremium={myProfile?.is_premium}
                userTier={myProfile?.subscription_tier || 'free'}
              />

              {/* Likes Counter */}
              <LikesCounter userProfile={myProfile} />

              {/* Super Like Counter */}
              <SuperLikeCounter userProfile={myProfile} />

              {/* Who Likes You Button */}
              <Link to={createPageUrl('WhoLikesYou')}>
                <Button variant="outline" size="icon" className="h-8 w-8 relative">
                  <HeartIcon size={16} className="text-pink-600" />
                  {(activityCounts?.likes > 0 || activityCounts?.views > 0) && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </Button>
              </Link>

              {/* Notifications */}
              <NotificationBell />
              
              {isAdmin && (
                <Link to={createPageUrl('AdminDashboard')}>
                  <Button variant="ghost" size="icon" className="text-purple-600 hover:bg-purple-50" title="Admin Dashboard">
                    <Crown size={20} />
                  </Button>
                </Link>
              )}
              </div>
              </div>
              </div>
              </header>

      {/* Founding Member Banner */}
      <FoundingMemberBanner profile={myProfile} />

      <main className="flex-1 flex flex-col overflow-hidden px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Activity Summary Banner */}
        <ActivitySummaryBanner userProfile={myProfile} />
        
        {/* Weekly Top Picks (Elite/VIP) */}
        <WeeklyTopPicks userProfile={myProfile} />

        {/* VIP Events Promo (Elite/VIP) */}
        <VIPEventsPromo userProfile={myProfile} />

        {/* Boost Button */}
        <div className="mb-3">
          <BoostButton userProfile={myProfile} onBoostActivated={() => refetch()} />
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ProfileCardSkeleton />
              <p className="mt-4 text-sm text-gray-500 animate-pulse">Finding amazing people for you...</p>
            </div>
          </div>
        ) : viewMode === 'swipe' ? (
          /* Swipe Mode */
          <div className="flex-1 flex flex-col items-center justify-center relative">
            {/* Rewind Button (Premium/Elite/VIP) */}
            {swipeHistory.length > 0 && (
              <Button
                onClick={handleRewind}
                className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full w-14 h-14 shadow-lg ${
                  (myProfile?.subscription_tier === 'premium' || myProfile?.subscription_tier === 'elite' || myProfile?.subscription_tier === 'vip' || myProfile?.is_premium)
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                title={t('admin.home.rewindLastSwipe')}
              >
                <RotateCcw size={24} />
              </Button>
            )}
            
            <AnimatePresence mode="wait">
              {hasMoreProfiles && currentProfile ? (
                <ProfileCard
                    key={currentProfile.id}
                    profile={currentProfile}
                    myLocation={myProfile?.location}
                    onLike={() => handleLike(currentProfile)}
                    onPass={handlePass}
                    onSuperLike={() => handleSuperLike(currentProfile)}
                    isLiking={likeMutation.isPending && !likeMutation.variables?.isSuperLike}
                    isPassing={passMutation.isPending}
                    isSuperLiking={likeMutation.isPending && likeMutation.variables?.isSuperLike}
                    matchScore={currentProfile.matchScore}
                    matchReasons={currentProfile.matchReasons || []}
                    matchBreakdown={currentProfile.matchBreakdown || {}}
                  />
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center px-4"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-amber-100 rounded-full flex items-center justify-center mb-6">
                    <span className="text-5xl">🌍</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">You've seen everyone nearby!</h2>
                  <p className="text-gray-600 mb-4">
                    Great news — there are thousands more people waiting to meet you globally.
                  </p>
                  <div className="space-y-3 w-full">
                    <Button 
                      onClick={() => setDiscoveryMode('global')}
                      className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 shadow-lg"
                    >
                      <Globe size={20} className="mr-2" />
                      Explore Globally
                    </Button>
                    <Button 
                      onClick={() => setFilters({})} 
                      variant="outline" 
                      className="w-full h-12 text-base"
                    >
                      Reset Filters
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* Grid Mode */
          <div className="flex-1 overflow-y-auto py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {profiles.map(profile => (
                <ProfileMini
                  key={profile.id}
                  profile={profile}
                  myLocation={myProfile?.location}
                  onClick={() => setSelectedProfile(profile)}
                />
              ))}
              {profiles.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <p className="text-gray-500">No profiles found. Try adjusting your filters.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Profile Modal (Grid Mode) */}
        <AnimatePresence>
          {selectedProfile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setSelectedProfile(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <ProfileCard
                  profile={selectedProfile}
                  myLocation={myProfile?.location}
                  onLike={() => {
                    handleLike(selectedProfile);
                    setSelectedProfile(null);
                  }}
                  onPass={() => setSelectedProfile(null)}
                  onSuperLike={() => {
                    handleSuperLike(selectedProfile);
                    setSelectedProfile(null);
                  }}
                  expanded
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Upgrade Prompts */}
        <UpgradePromptBanner prompt={upgradePrompt} onDismiss={dismissPrompt} />

        {/* Likes Limit Paywall */}
        <AnimatePresence>
          {showLimitPaywall && (
            <LikesLimitPaywall onClose={() => setShowLimitPaywall(false)} />
          )}
        </AnimatePresence>

        {/* Tutorial */}
        {showTutorial && (
          <TutorialTooltip steps={tutorialSteps} onComplete={completeTutorial} />
        )}

        {/* Match Celebration - Enhanced */}
        <AnimatePresence>
          {showMatchCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.5, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.5, y: 50 }}
                className="text-center bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 mx-4 shadow-2xl"
              >
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-8xl mb-4"
                >
                  💕
                </motion.div>
                <h2 className="text-4xl font-bold text-white mb-2">{t('admin.home.itsAMatch')}</h2>
                <p className="text-white/80 mb-4">You both liked each other!</p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => {
                      setShowMatchCelebration(false);
                      navigate(createPageUrl('Matches'));
                    }}
                    className="bg-white text-purple-600 hover:bg-gray-100"
                  >
                    Send a Message
                  </Button>
                  <Button 
                    onClick={() => setShowMatchCelebration(false)}
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                  >
                    Keep Swiping
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message with Like Modal */}
        <MessageWithLikeModal
          profile={pendingLikeProfile}
          open={showMessageModal}
          onSend={handleLikeWithMessage}
          onClose={() => {
            setShowMessageModal(false);
            setPendingLikeProfile(null);
          }}
        />

        {/* Match Milestones Celebration */}
        <MatchMilestones userProfile={myProfile} newMatchCount={matchCount} />

        {/* Feedback Modal for ML Learning */}
        <FeedbackModal
          open={showFeedbackModal}
          onClose={() => {
            setShowFeedbackModal(false);
            setFeedbackProfile(null);
          }}
          profile={feedbackProfile}
          actionType="pass"
          myProfileId={myProfile?.id}
          onSubmit={(reasons) => {
            console.log('Feedback submitted:', reasons);
          }}
        />
        </main>
          </div>
    </PullToRefresh>
          );
          }