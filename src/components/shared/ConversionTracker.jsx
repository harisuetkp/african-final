import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Track conversion events for monetization
export function useConversionTracker() {
  const trackEvent = async (eventName, properties = {}) => {
    try {
      // Track via Base44 analytics for all users (works for anonymous too)
      base44.analytics.track({
        eventName: eventName,
        properties: properties
      });

      // Only log to ProfileAnalytics for authenticated users with a profile
      const isAuth = await base44.auth.isAuthenticated();
      
      if (isAuth) {
        const user = await base44.auth.me();
        if (user) {
          const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
          const profile = profiles[0];
          
          // Only create if user has a profile
          if (profile?.id) {
            await base44.entities.ProfileAnalytics.create({
              user_profile_id: profile.id,
              event_type: eventName,
              event_data: properties,
              date: new Date().toISOString().split('T')[0]
            });
          }
        }
      }
    } catch (e) {
      // Silently fail for tracking - don't disrupt user experience
      console.debug('Conversion tracking skipped:', eventName);
    }
  };

  return { trackEvent };
}

// Revenue tracking for admin analytics
export function trackRevenue(amount, currency, source, userId) {
  try {
    base44.entities.ProfileAnalytics.create({
      user_profile_id: userId,
      event_type: 'revenue',
      event_data: {
        amount,
        currency,
        source,
        timestamp: new Date().toISOString()
      }
    });
  } catch (e) {
    console.error('Failed to track revenue:', e);
  }
}

// Conversion funnel tracking
export const CONVERSION_EVENTS = {
  // Registration funnel
  LANDING_VIEW: 'landing_viewed',
  SIGNUP_START: 'signup_started',
  SIGNUP_COMPLETE: 'signup_completed',
  PROFILE_CREATED: 'profile_created',
  
  // Engagement funnel
  FIRST_LIKE: 'first_like_sent',
  FIRST_MATCH: 'first_match_created',
  FIRST_MESSAGE: 'first_message_sent',
  
  // Premium funnel
  PREMIUM_VIEW: 'premium_page_viewed',
  PREMIUM_CLICK: 'premium_upgrade_clicked',
  PREMIUM_PURCHASE: 'premium_purchased',
  
  // Feature usage
  STORY_VIEW: 'story_viewed',
  STORY_POST: 'story_posted',
  EVENT_JOIN: 'event_joined',
  COMMUNITY_JOIN: 'community_joined',
  VERIFICATION_REQUEST: 'verification_requested'
};