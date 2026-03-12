import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Tier requirements for features - Production tier matrix
export const TIER_FEATURES = {
  // Premium Features (Limited)
  limited_likes: ['premium'],        // Premium gets 50 likes/day
  see_who_liked: ['premium', 'elite', 'vip'],
  limited_messaging: ['premium'],    // Premium gets 100 messages/day
  advanced_filters: ['premium', 'elite', 'vip'],
  profile_boost: ['premium', 'elite', 'vip'],
  read_receipts: ['premium', 'elite', 'vip'],
  limited_rewind: ['premium'],       // Premium gets 5 rewinds/day
  priority_likes: ['premium', 'elite', 'vip'],
  
  // Elite Features (Unlimited)
  unlimited_likes: ['elite', 'vip'],
  unlimited_messaging: ['elite', 'vip'],
  rewind: ['elite', 'vip'],          // Unlimited rewind for Elite+
  virtual_gifts: ['elite', 'vip'],
  unlimited_boosts: ['elite', 'vip'],
  priority_ranking: ['elite', 'vip'],
  incognito_mode: ['elite', 'vip'],
  verified_badge: ['elite', 'vip'],
  super_likes_daily: ['elite', 'vip'],
  
  // VIP Features (includes all Elite)
  featured_profile: ['vip'],
  profile_insights: ['vip'],
  concierge_support: ['vip'],
  exclusive_events: ['vip'],
  dedicated_matchmaker: ['vip'],
  virtual_speed_dating: ['vip']      // New VIP feature
};

// Tier limits for Premium users
export const TIER_LIMITS = {
  premium: {
    daily_likes: 50,
    daily_messages: 100,
    daily_rewinds: 5
  },
  elite: {
    daily_likes: Infinity,
    daily_messages: Infinity,
    daily_rewinds: Infinity
  },
  vip: {
    daily_likes: Infinity,
    daily_messages: Infinity,
    daily_rewinds: Infinity
  }
};

export function hasAccess(userTier, feature) {
  const tier = userTier || 'free';
  const requiredTiers = TIER_FEATURES[feature] || [];
  return requiredTiers.includes(tier);
}

import { useLanguage } from '@/components/i18n/LanguageContext';

export default function TierGate({ 
  userTier, 
  requiredFeature, 
  children,
  fallback = null,
  showUpgradePrompt = true 
}) {
  const { t } = useLanguage();
  const tier = userTier || 'free';
  const access = hasAccess(tier, requiredFeature);

  if (access) {
    return <>{children}</>;
  }

  if (!showUpgradePrompt) {
    return fallback;
  }

  const requiredTiers = TIER_FEATURES[requiredFeature] || [];
  const lowestTier = requiredTiers[0];
  const tierName = lowestTier.charAt(0).toUpperCase() + lowestTier.slice(1);

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-purple-50">
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
          <Crown size={32} className="text-white" />
        </div>
        <h3 className="text-lg font-bold mb-2">{t('admin.tierGate.premiumFeature')}</h3>
        <p className="text-gray-600 mb-4">
          {t('admin.tierGate.upgradeToUnlock').replace('{tier}', tierName)}
        </p>
        <Link to={createPageUrl('PricingPlans')}>
          <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
            <Crown size={18} className="mr-2" />
            {t('admin.tierGate.upgradeNow')}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}