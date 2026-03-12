import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Home, Heart, Calendar, User, MessageCircle, Compass, Sparkles, Bell } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import ScreenshotAlertNotif from '@/components/notifications/ScreenshotAlertNotif';
import SubscriptionReminder from '@/components/monetization/SubscriptionReminder';
import RetentionRewards from '@/components/monetization/RetentionRewards';
import { LanguageProvider, useLanguage } from '@/components/i18n/LanguageContext';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { ErrorLoggerProvider } from '@/components/analytics/ErrorLogger'; // Replaced ErrorMonitor
import OfflineIndicator from '@/components/shared/OfflineIndicator';
import { NativeStyles } from '@/components/shared/NativeStyles';
import { useServiceWorker } from '@/components/shared/ServiceWorkerManager';
import { useNetworkStatus } from '@/components/shared/NetworkStatus';
import CookieConsent from '@/components/legal/CookieConsent';
import PushNotificationSetup from '@/components/notifications/PushNotificationSetup';
import { GlobalErrorHandler } from '@/components/shared/GlobalErrorHandler';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import InstallPrompt from '@/components/mobile/InstallPrompt';
import BannedScreen from '@/components/auth/BannedScreen';
import FeatureReminders from '@/components/shared/FeatureReminders';
import FeedbackWidget from '@/components/shared/FeedbackWidget';
import CelebrationModal from '@/components/shared/CelebrationModal';

import LiveViewerNotification from '@/components/monetization/LiveViewerNotification';
import SuperLikeReceivedModal from '@/components/monetization/SuperLikeReceivedModal';

const PAGES_WITHOUT_NAV = ['Chat', 'Onboarding', 'EditProfile', 'Report', 'Settings', 'Landing', 'Login', 'AdminDashboard', 'CustomerView', 'Terms', 'Privacy', 'CommunityGuidelines', 'LegalAcceptance', 'Notifications', 'PhoneVerification', 'IDVerification', 'VerifyPhoto', 'VideoChat', 'VirtualGifts', 'DailyMatches', 'SuccessStories', 'EventDetails', 'CreateEvent', 'CompatibilityQuizzes', 'ReferralProgram', 'LanguageExchangeHub', 'VendorManagement', 'Marketplace', 'PasswordReset', 'Waitlist'];

function LayoutContent({ children, currentPageName }) {
  const navigate = useNavigate();
  const [myProfile, setMyProfile] = useState(null);
  const [hasProfile, setHasProfile] = useState(true);

  const [liveViewer, setLiveViewer] = useState(null);
  const [superLikeReceived, setSuperLikeReceived] = useState(null);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const { t } = useLanguage();



  // Check for new super likes (simulate real-time)
  useEffect(() => {
    if (!myProfile) return;

    const checkSuperLikes = async () => {
      try {
        const recentSuperLikes = await base44.entities.Like.filter({
          liked_id: myProfile.id,
          is_super_like: true,
          is_seen: false
        }, '-created_date', 1);

        if (recentSuperLikes.length > 0) {
          const like = recentSuperLikes[0];
          // Only show if created in last 5 minutes
          const createdAt = new Date(like.created_date);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

          if (createdAt > fiveMinutesAgo) {
            const likerProfiles = await base44.entities.UserProfile.filter({ id: like.liker_id });
            if (likerProfiles.length > 0) {
              setSuperLikeReceived({
                ...like,
                profile: likerProfiles[0]
              });
            }
          }
        }
      } catch (e) {
        // Silent fail
      }
    };

    checkSuperLikes();
    const interval = setInterval(checkSuperLikes, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [myProfile]);

  // PWA Meta Tags
  useEffect(() => {
    // Set theme color
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.name = "theme-color";
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = "#7c3aed";

    // iOS specific tags
    const metaTags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'Afrinnect' },
      { name: 'mobile-web-app-capable', content: 'yes' }
    ];

    metaTags.forEach(tag => {
      let el = document.querySelector(`meta[name="${tag.name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.name = tag.name;
        document.head.appendChild(el);
      }
      el.content = tag.content;
    });
  }, []);

  useEffect(() => {
    const checkProfile = async () => {
      // Skip all auth checks for public pages
      const publicPages = ['Landing', 'Login', 'Waitlist', 'Terms', 'Privacy', 'CommunityGuidelines', 'AmbassadorApply', 'PasswordReset'];
      if (publicPages.includes(currentPageName)) {
        return;
      }

      try {
        const user = await base44.auth.me();
        if (user) {
          // Check legal acceptance first for ALL authenticated users
          if (currentPageName !== 'LegalAcceptance') {
            const acceptances = await base44.entities.LegalAcceptance.filter({ user_id: user.id });
            if (acceptances.length === 0) {
              navigate(createPageUrl('LegalAcceptance'));
              return;
            }
          }

          // Then check profile
          const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });

          if (profiles.length > 0) {
            const profile = profiles[0];
            setMyProfile(profile);

            // Mandatory Photo Verification after 30 minutes (Bypass for Admin)
            const isAdmin = user.role === 'admin' || user.email === 'pivotngoyb@gmail.com';
            if (!isAdmin && currentPageName !== 'VerifyPhoto' && currentPageName !== 'Onboarding' && currentPageName !== 'LegalAcceptance') {
              const createdDate = new Date(profile.created_date || new Date().toISOString()); // Fallback for old accounts
              const now = new Date();
              const diffMinutes = (now - createdDate) / 1000 / 60;

              if (diffMinutes > 30 && !profile.verification_status?.photo_verified) {
                navigate(createPageUrl('VerifyPhoto'));
                return;
              }
            }
          }
          setHasProfile(profiles.length > 0);
        }
      } catch (e) {
        // Not logged in - no action needed for public pages
        console.error('Auth check error:', e);
      }
    };
    checkProfile();
  }, [currentPageName]);

  // Check Launch/Maintenance Mode
  const { data: launchSettings } = useQuery({
    queryKey: ['launch-settings'],
    queryFn: async () => {
      const settings = await base44.entities.SystemSettings.filter({ key: 'launch_configuration' });
      return settings[0]?.value || { is_live: false };
    },
    staleTime: 60000 // Check every minute
  });

  useEffect(() => {
    const checkLaunchStatus = async () => {
      if (launchSettings && !launchSettings.is_live) {
        // Allow public pages
        const allowedPages = ['Landing', 'Login', 'Waitlist', 'AdminDashboard', 'Terms', 'Privacy', 'CommunityGuidelines', 'AmbassadorApply', 'PasswordReset'];
        if (allowedPages.includes(currentPageName)) return;

        // Allow Admins
        try {
          const user = await base44.auth.me();
          const isSuperAdmin = user?.email === 'pivotngoyb@gmail.com' || user?.role === 'admin';
          if (isSuperAdmin) return;
        } catch (e) {
          // Not logged in
        }

        // Redirect everyone else to Waitlist
        navigate(createPageUrl('Waitlist'));
      }
    };
    checkLaunchStatus();
  }, [launchSettings, currentPageName, navigate]);

  // Notification count is handled by NotificationBell component
  // Removed duplicate query that was causing unnecessary API calls

  const showNav = !PAGES_WITHOUT_NAV.includes(currentPageName);

  const navItems = [
    { name: 'Home', icon: Compass, label: t('home.title') },
    { name: 'Stories', icon: Sparkles, label: 'Stories' },
    { name: 'Matches', icon: Heart, label: t('matches.title') },
    { name: 'Events', icon: Calendar, label: 'Events' },
    { name: 'Profile', icon: User, label: t('profile.editProfile').replace(' Profile', '').replace(' le Profil', '') }
  ];

  return (
    <>
      <NativeStyles />
      <OfflineIndicator />
      <div className="min-h-screen bg-gray-50">
        <style>{`
        :root {
          --color-primary: #7c3aed;
          --color-primary-dark: #6d28d9;
          --color-accent: #f59e0b;
          --color-accent-dark: #d97706;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes pulse-heart {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .animate-pulse-heart {
          animation: pulse-heart 1s ease-in-out infinite;
        }
      `}</style>

        {/* Global Ban/Suspension Check */}
        {myProfile && (myProfile.is_banned || myProfile.is_suspended) ? (
          <BannedScreen
            userProfile={myProfile}
            banReason={myProfile.ban_reason || myProfile.suspension_reason || 'Violation of community guidelines'}
            userEmail={myProfile.created_by}
          />
        ) : (
          <div className={`${showNav ? "pb-20" : ""} min-h-screen`} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            {children}
          </div>
        )}

        {/* Screenshot Alert Notifications */}
        {myProfile && <ScreenshotAlertNotif myProfileId={myProfile.id} />}

        {/* Subscription Expiry Reminder */}
        {myProfile && <SubscriptionReminder userProfile={myProfile} />}

        {/* Retention Rewards */}
        {myProfile && <RetentionRewards userProfile={myProfile} />}

        {/* Push Notifications */}
        <PushNotificationSetup userProfile={myProfile} />

        {/* Mobile Install Prompt */}
        <InstallPrompt />

        {/* Feature Reminders */}
        <FeatureReminders />

        {/* Feedback Widget - Only for logged in users with profile */}
        {myProfile && <FeedbackWidget />}

        {/* Streak Celebration */}
        <CelebrationModal
          isOpen={showStreakCelebration}
          onClose={() => setShowStreakCelebration(false)}
          title="Amazing Streak!"
          message={`${myProfile?.login_streak || 0} days in a row! Keep it up!`}
          emoji="🔥"
        />



        {/* Live Viewer Notification */}
        {liveViewer && (
          <LiveViewerNotification
            viewerName={liveViewer.display_name}
            viewerPhoto={liveViewer.primary_photo}
            isPremium={myProfile?.is_premium || ['premium', 'elite', 'vip'].includes(myProfile?.subscription_tier)}
            onDismiss={() => setLiveViewer(null)}
          />
        )}

        {/* Super Like Received Modal */}
        {superLikeReceived && (
          <SuperLikeReceivedModal
            isOpen={!!superLikeReceived}
            onClose={async () => {
              // Mark as seen
              if (superLikeReceived?.id) {
                try {
                  await base44.entities.Like.update(superLikeReceived.id, { is_seen: true });
                } catch (e) { }
              }
              setSuperLikeReceived(null);
            }}
            senderName={superLikeReceived?.profile?.display_name}
            senderPhoto={superLikeReceived?.profile?.primary_photo}
            isPremium={myProfile?.is_premium || ['premium', 'elite', 'vip'].includes(myProfile?.subscription_tier)}
          />
        )}

        {/* Cookie Consent */}
        <CookieConsent />

        {/* Bottom Navigation - Native Tab Bar */}
        {showNav && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex items-center justify-around py-1 max-w-lg mx-auto">
              {navItems.map(item => {
                const isActive = currentPageName === item.name;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.name)}
                    className={`flex flex-col items-center gap-0 px-3 py-1 rounded-lg transition-all active:scale-95 touch-manipulation ${isActive
                        ? 'text-purple-600'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(10);
                    }}
                  >
                    <Icon
                      size={20}
                      className={isActive ? 'fill-purple-100' : ''}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                    <span className={`text-[9px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </>
  );
}

export default function Layout(props) {
  useServiceWorker();
  const { isOnline } = useNetworkStatus();

  return (
    <ErrorBoundary>
      <ErrorLoggerProvider>
        <LanguageProvider>
          <GoogleAnalytics />
          <GlobalErrorHandler />
          <LayoutContent {...props} />
        </LanguageProvider>
      </ErrorLoggerProvider>
    </ErrorBoundary>
  );
}