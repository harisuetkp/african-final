import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Default fallback configuration (used if database is empty)
const DEFAULT_TIERS = {
  free: {
    tier_id: 'free',
    display_name: 'Free',
    limits: {
      daily_likes: 15,
      daily_messages: 20,
      daily_rewinds: 0,
      daily_super_likes: 1,
      monthly_boosts: 0
    },
    features: []
  },
  premium: {
    tier_id: 'premium',
    display_name: 'Premium',
    limits: {
      daily_likes: 50,
      daily_messages: 100,
      daily_rewinds: 5,
      daily_super_likes: 5,
      monthly_boosts: 1
    },
    features: [
      { key: 'see_who_liked', enabled: true },
      { key: 'advanced_filters', enabled: true },
      { key: 'read_receipts', enabled: true }
    ]
  },
  elite: {
    tier_id: 'elite',
    display_name: 'Elite',
    limits: {
      daily_likes: -1,
      daily_messages: -1,
      daily_rewinds: -1,
      daily_super_likes: -1,
      monthly_boosts: -1
    },
    features: [
      { key: 'see_who_liked', enabled: true },
      { key: 'advanced_filters', enabled: true },
      { key: 'read_receipts', enabled: true },
      { key: 'virtual_gifts', enabled: true },
      { key: 'priority_ranking', enabled: true },
      { key: 'incognito_mode', enabled: true },
      { key: 'verified_badge', enabled: true }
    ]
  },
  vip: {
    tier_id: 'vip',
    display_name: 'VIP',
    limits: {
      daily_likes: -1,
      daily_messages: -1,
      daily_rewinds: -1,
      daily_super_likes: -1,
      monthly_boosts: -1
    },
    features: [
      { key: 'see_who_liked', enabled: true },
      { key: 'advanced_filters', enabled: true },
      { key: 'read_receipts', enabled: true },
      { key: 'virtual_gifts', enabled: true },
      { key: 'priority_ranking', enabled: true },
      { key: 'incognito_mode', enabled: true },
      { key: 'verified_badge', enabled: true },
      { key: 'featured_profile', enabled: true },
      { key: 'profile_insights', enabled: true },
      { key: 'concierge_support', enabled: true },
      { key: 'virtual_speed_dating', enabled: true }
    ]
  }
};

// Cache for tier config to avoid repeated fetches
let tierConfigCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to fetch tier configuration from the database
 * Falls back to defaults if no config exists
 */
export function useTierConfig() {
  const { data: tiers, isLoading, error } = useQuery({
    queryKey: ['tier-configuration'],
    queryFn: async () => {
      // Check cache first
      if (tierConfigCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
        return tierConfigCache;
      }

      try {
        const configs = await base44.entities.TierConfiguration.filter({}, 'sort_order');
        
        if (configs.length === 0) {
          // No config in DB, return defaults
          return DEFAULT_TIERS;
        }

        // Convert array to object keyed by tier_id
        const configMap = {};
        configs.forEach(config => {
          configMap[config.tier_id] = config;
        });

        // Merge with defaults for any missing tiers
        const merged = { ...DEFAULT_TIERS };
        Object.keys(configMap).forEach(tierId => {
          merged[tierId] = { ...DEFAULT_TIERS[tierId], ...configMap[tierId] };
        });

        tierConfigCache = merged;
        cacheTimestamp = Date.now();
        return merged;
      } catch (e) {
        console.error('Failed to fetch tier config:', e);
        return DEFAULT_TIERS;
      }
    },
    staleTime: CACHE_DURATION,
    gcTime: 10 * 60 * 1000,
    retry: 1
  });

  return {
    tiers: tiers || DEFAULT_TIERS,
    isLoading,
    error
  };
}

/**
 * Get the limit for a specific tier and limit type
 * Returns -1 for unlimited, actual number otherwise
 */
export function getTierLimit(tiers, tierId, limitType) {
  const tier = tiers?.[tierId] || DEFAULT_TIERS[tierId] || DEFAULT_TIERS.free;
  const limit = tier?.limits?.[limitType];
  return limit ?? 0;
}

/**
 * Check if a limit is unlimited (-1)
 */
export function isUnlimited(limit) {
  return limit === -1;
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(tiers, tierId, featureKey) {
  const tier = tiers?.[tierId] || DEFAULT_TIERS[tierId] || DEFAULT_TIERS.free;
  const feature = tier?.features?.find(f => f.key === featureKey);
  return feature?.enabled ?? false;
}

/**
 * Get display text for a limit (e.g., "50/day" or "Unlimited")
 */
export function formatLimitDisplay(limit, suffix = '/day') {
  if (limit === -1) return 'Unlimited';
  if (limit === 0) return '-';
  return `${limit}${suffix}`;
}

/**
 * Invalidate the cache (call after admin updates config)
 */
export function invalidateTierCache() {
  tierConfigCache = null;
  cacheTimestamp = 0;
}

export { DEFAULT_TIERS };