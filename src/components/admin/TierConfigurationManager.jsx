import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Heart, Star, Sparkles, Settings, Save, RefreshCw, Plus,
  Check, X, Edit2, Infinity, AlertCircle, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { invalidateTierCache, DEFAULT_TIERS } from '@/components/shared/useTierConfig';

const TIER_ICONS = {
  free: Heart,
  premium: Heart,
  elite: Star,
  vip: Crown
};

const TIER_COLORS = {
  free: 'bg-gray-100 text-gray-600 border-gray-200',
  premium: 'bg-purple-100 text-purple-600 border-purple-200',
  elite: 'bg-amber-100 text-amber-600 border-amber-200',
  vip: 'bg-slate-900 text-white border-slate-700'
};

const FEATURE_OPTIONS = [
  { key: 'see_who_liked', label: 'See Who Liked You', tooltip: 'View profiles of people who liked you' },
  { key: 'advanced_filters', label: 'Advanced Filters', tooltip: 'Filter by ethnicity, religion, etc.' },
  { key: 'read_receipts', label: 'Read Receipts', tooltip: 'Know when messages are read' },
  { key: 'virtual_gifts', label: 'Virtual Gifts', tooltip: 'Send digital gifts to matches' },
  { key: 'priority_ranking', label: 'Priority Ranking', tooltip: 'Appear higher in discovery' },
  { key: 'incognito_mode', label: 'Incognito Mode', tooltip: 'Browse without being seen' },
  { key: 'verified_badge', label: 'Verified Badge', tooltip: 'Show verification status' },
  { key: 'featured_profile', label: 'Featured Profile', tooltip: 'Always shown first' },
  { key: 'profile_insights', label: 'Profile Insights', tooltip: 'Detailed analytics on your profile' },
  { key: 'concierge_support', label: 'Concierge Support', tooltip: '24/7 priority support' },
  { key: 'virtual_speed_dating', label: 'Virtual Speed Dating', tooltip: 'Access to live video events' },
  { key: 'exclusive_events', label: 'Exclusive Events', tooltip: 'VIP-only gatherings' }
];

function LimitInput({ label, value, onChange, isUnlimited, onUnlimitedChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Unlimited</span>
          <Switch
            checked={isUnlimited}
            onCheckedChange={(checked) => {
              onUnlimitedChange(checked);
              if (checked) onChange(-1);
            }}
          />
        </div>
      </div>
      {!isUnlimited && (
        <Input
          type="number"
          min="0"
          value={value === -1 ? '' : value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="h-10"
          placeholder="Enter limit"
        />
      )}
      {isUnlimited && (
        <div className="h-10 flex items-center gap-2 px-3 bg-green-50 border border-green-200 rounded-md text-green-700">
          <Infinity size={16} />
          <span className="text-sm font-medium">Unlimited</span>
        </div>
      )}
    </div>
  );
}

function TierCard({ tier, onSave, isSaving }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editData, setEditData] = useState(tier);

  const Icon = TIER_ICONS[tier.tier_id] || Heart;
  const colorClass = TIER_COLORS[tier.tier_id] || TIER_COLORS.free;

  useEffect(() => {
    setEditData(tier);
  }, [tier]);

  const handleSave = async () => {
    await onSave(editData);
    setIsEditing(false);
  };

  const updateLimit = (key, value) => {
    setEditData(prev => ({
      ...prev,
      limits: { ...prev.limits, [key]: value }
    }));
  };

  const toggleFeature = (featureKey) => {
    setEditData(prev => {
      const features = prev.features || [];
      const existingIndex = features.findIndex(f => f.key === featureKey);
      
      if (existingIndex >= 0) {
        const updated = [...features];
        updated[existingIndex] = { ...updated[existingIndex], enabled: !updated[existingIndex].enabled };
        return { ...prev, features: updated };
      } else {
        return { ...prev, features: [...features, { key: featureKey, enabled: true }] };
      }
    });
  };

  const isFeatureEnabled = (featureKey) => {
    return editData.features?.find(f => f.key === featureKey)?.enabled ?? false;
  };

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 ${isEditing ? 'ring-2 ring-purple-500' : ''}`}>
      {tier.is_popular && (
        <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
          POPULAR
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
              <Icon size={24} />
            </div>
            <div>
              <CardTitle className="text-xl">{tier.display_name}</CardTitle>
              <CardDescription>{tier.description || `${tier.tier_id} tier`}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => { setIsEditing(true); setIsExpanded(true); }}>
                <Edit2 size={14} className="mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setEditData(tier); }}>
                  <X size={14} className="mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                  {isSaving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />}
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {isExpanded ? 'Collapse' : 'Expand Details'}
        </Button>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="pt-0 space-y-6">
              {/* Limits Section */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings size={16} />
                  Daily Limits
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <LimitInput
                    label="Daily Likes"
                    value={editData.limits?.daily_likes ?? 0}
                    onChange={(v) => updateLimit('daily_likes', v)}
                    isUnlimited={editData.limits?.daily_likes === -1}
                    onUnlimitedChange={(u) => updateLimit('daily_likes', u ? -1 : 50)}
                  />
                  <LimitInput
                    label="Daily Messages"
                    value={editData.limits?.daily_messages ?? 0}
                    onChange={(v) => updateLimit('daily_messages', v)}
                    isUnlimited={editData.limits?.daily_messages === -1}
                    onUnlimitedChange={(u) => updateLimit('daily_messages', u ? -1 : 100)}
                  />
                  <LimitInput
                    label="Daily Rewinds"
                    value={editData.limits?.daily_rewinds ?? 0}
                    onChange={(v) => updateLimit('daily_rewinds', v)}
                    isUnlimited={editData.limits?.daily_rewinds === -1}
                    onUnlimitedChange={(u) => updateLimit('daily_rewinds', u ? -1 : 5)}
                  />
                  <LimitInput
                    label="Daily Super Likes"
                    value={editData.limits?.daily_super_likes ?? 0}
                    onChange={(v) => updateLimit('daily_super_likes', v)}
                    isUnlimited={editData.limits?.daily_super_likes === -1}
                    onUnlimitedChange={(u) => updateLimit('daily_super_likes', u ? -1 : 5)}
                  />
                  <LimitInput
                    label="Monthly Boosts"
                    value={editData.limits?.monthly_boosts ?? 0}
                    onChange={(v) => updateLimit('monthly_boosts', v)}
                    isUnlimited={editData.limits?.monthly_boosts === -1}
                    onUnlimitedChange={(u) => updateLimit('monthly_boosts', u ? -1 : 1)}
                  />
                </div>
              </div>

              {/* Features Section */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles size={16} />
                  Features
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {FEATURE_OPTIONS.map(feature => (
                    <div
                      key={feature.key}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                        isFeatureEnabled(feature.key)
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => isEditing && toggleFeature(feature.key)}
                    >
                      <div className="flex items-center gap-2">
                        {isFeatureEnabled(feature.key) ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          <X size={16} className="text-gray-400" />
                        )}
                        <span className={`text-sm font-medium ${isFeatureEnabled(feature.key) ? 'text-green-800' : 'text-gray-500'}`}>
                          {feature.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Section */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Crown size={16} />
                  Pricing (USD)
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Monthly</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.pricing?.monthly || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        pricing: { ...prev.pricing, monthly: parseFloat(e.target.value) || 0 }
                      }))}
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Quarterly</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.pricing?.quarterly || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        pricing: { ...prev.pricing, quarterly: parseFloat(e.target.value) || 0 }
                      }))}
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Yearly</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.pricing?.yearly || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        pricing: { ...prev.pricing, yearly: parseFloat(e.target.value) || 0 }
                      }))}
                      disabled={!isEditing}
                      className="mt-1"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="flex items-center gap-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editData.is_popular}
                    onCheckedChange={(checked) => setEditData(prev => ({ ...prev, is_popular: checked }))}
                    disabled={!isEditing}
                  />
                  <Label className="text-sm">Show "Most Popular" Badge</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editData.is_active !== false}
                    onCheckedChange={(checked) => setEditData(prev => ({ ...prev, is_active: checked }))}
                    disabled={!isEditing}
                  />
                  <Label className="text-sm">Active (Available for Purchase)</Label>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function TierConfigurationManager() {
  const queryClient = useQueryClient();
  const [savingTier, setSavingTier] = useState(null);

  // Fetch existing configurations
  const { data: tierConfigs, isLoading, refetch } = useQuery({
    queryKey: ['admin-tier-configs'],
    queryFn: async () => {
      const configs = await base44.entities.TierConfiguration.filter({}, 'sort_order');
      
      // Merge with defaults
      const merged = {};
      ['free', 'premium', 'elite', 'vip'].forEach((tierId, index) => {
        const existing = configs.find(c => c.tier_id === tierId);
        merged[tierId] = existing || {
          tier_id: tierId,
          display_name: DEFAULT_TIERS[tierId].display_name,
          limits: DEFAULT_TIERS[tierId].limits,
          features: DEFAULT_TIERS[tierId].features,
          pricing: { monthly: 0, quarterly: 0, yearly: 0 },
          sort_order: index,
          is_active: true
        };
      });
      
      return merged;
    },
    staleTime: 30000
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (tierData) => {
      setSavingTier(tierData.tier_id);
      
      // Check if config exists
      const existing = await base44.entities.TierConfiguration.filter({ tier_id: tierData.tier_id });
      
      if (existing.length > 0) {
        await base44.entities.TierConfiguration.update(existing[0].id, tierData);
      } else {
        await base44.entities.TierConfiguration.create(tierData);
      }
      
      // Invalidate cache
      invalidateTierCache();
    },
    onSuccess: () => {
      toast.success('Tier configuration saved successfully');
      queryClient.invalidateQueries(['admin-tier-configs']);
      queryClient.invalidateQueries(['tier-configuration']);
      setSavingTier(null);
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
      setSavingTier(null);
    }
  });

  // Initialize default configs if none exist
  const initializeMutation = useMutation({
    mutationFn: async () => {
      const existing = await base44.entities.TierConfiguration.filter({});
      if (existing.length === 0) {
        // Create all default tiers
        const tiers = ['free', 'premium', 'elite', 'vip'];
        for (let i = 0; i < tiers.length; i++) {
          const tierId = tiers[i];
          await base44.entities.TierConfiguration.create({
            tier_id: tierId,
            display_name: DEFAULT_TIERS[tierId].display_name,
            description: tierId === 'free' ? 'Basic access' : 
                        tierId === 'premium' ? 'Level up your dating' :
                        tierId === 'elite' ? 'For those serious about love' :
                        'The ultimate experience',
            limits: DEFAULT_TIERS[tierId].limits,
            features: DEFAULT_TIERS[tierId].features,
            pricing: tierId === 'free' ? { monthly: 0, quarterly: 0, yearly: 0 } :
                    tierId === 'premium' ? { monthly: 14.99, quarterly: 34.99, yearly: 119.99 } :
                    tierId === 'elite' ? { monthly: 24.99, quarterly: 59.99, yearly: 179.99 } :
                    { monthly: 99.99, quarterly: 499.99, yearly: 900.00 },
            sort_order: i,
            is_active: true,
            is_popular: tierId === 'elite'
          });
        }
        invalidateTierCache();
      }
    },
    onSuccess: () => {
      toast.success('Default configurations initialized');
      refetch();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const hasConfigs = tierConfigs && Object.values(tierConfigs).some(t => t.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subscription Tiers</h2>
          <p className="text-gray-500 mt-1">Configure limits, features, and pricing for each tier</p>
        </div>
        <div className="flex gap-2">
          {!hasConfigs && (
            <Button 
              onClick={() => initializeMutation.mutate()}
              disabled={initializeMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {initializeMutation.isPending ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Plus size={16} className="mr-2" />
              )}
              Initialize Defaults
            </Button>
          )}
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <h4 className="font-medium text-blue-900">How Tier Configuration Works</h4>
          <p className="text-sm text-blue-700 mt-1">
            Changes you make here will automatically apply across the entire app - pricing pages, 
            paywalls, feature gates, and backend enforcement. Use <strong>-1</strong> for unlimited access.
          </p>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="space-y-4">
        {['free', 'premium', 'elite', 'vip'].map(tierId => (
          <TierCard
            key={tierId}
            tier={tierConfigs?.[tierId] || DEFAULT_TIERS[tierId]}
            onSave={saveMutation.mutateAsync}
            isSaving={savingTier === tierId}
          />
        ))}
      </div>
    </div>
  );
}