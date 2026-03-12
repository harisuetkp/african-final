import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Settings, Save, RefreshCw, Shield, DollarSign, Bell, Users,
  Zap, Clock, AlertTriangle, Check, Globe, Lock, Smartphone, Crown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import AdminSidebar from "@/components/admin/AdminSidebar";
import TierConfigurationManager from "@/components/admin/TierConfigurationManager";
import OnboardingSettings from "@/components/admin/OnboardingSettings";
import FounderProgramManagement from "@/components/admin/FounderProgramManagement";
import { toast } from "sonner";

export default function AdminSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [featureFlags, setFeatureFlags] = useState([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser || currentUser.role !== 'admin') {
        navigate(createPageUrl('Home'));
        return;
      }
      setUser(currentUser);
      await loadSettings();
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [systemSettings, flags] = await Promise.all([
        base44.entities.SystemSettings.list('-created_date', 50),
        base44.entities.FeatureFlag.list('-created_date', 50)
      ]);

      // Convert array to object by key
      const settingsObj = {};
      systemSettings.forEach(s => {
        settingsObj[s.key] = { ...s.value, id: s.id };
      });
      setSettings(settingsObj);
      setFeatureFlags(flags);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    setLoading(false);
  };

  const updateSetting = async (key, value) => {
    setSaving(true);
    try {
      const existing = await base44.entities.SystemSettings.filter({ key });
      if (existing.length > 0) {
        await base44.entities.SystemSettings.update(existing[0].id, { 
          value,
          updated_by: user.email 
        });
      } else {
        await base44.entities.SystemSettings.create({ 
          key, 
          value,
          updated_by: user.email 
        });
      }
      await loadSettings();
      toast.success('Settings saved');
    } catch (error) {
      console.error('Error saving setting:', error);
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const toggleFeatureFlag = async (flag) => {
    try {
      await base44.entities.FeatureFlag.update(flag.id, {
        is_enabled: !flag.is_enabled
      });
      await loadSettings();
      toast.success(`${flag.display_name} ${!flag.is_enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling flag:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  const subscriptionLimits = settings.subscription_limits || {
    free: { daily_likes: 10, daily_messages: 20, daily_super_likes: 0 },
    premium: { daily_likes: 50, daily_messages: 100, daily_super_likes: 5 },
    elite: { daily_likes: -1, daily_messages: -1, daily_super_likes: 10 },
    vip: { daily_likes: -1, daily_messages: -1, daily_super_likes: -1 }
  };

  const rateLimits = settings.rate_limits || {
    message_cooldown_ms: 1000,
    auth_attempts_per_hour: 10,
    profile_views_per_minute: 30
  };

  const safetyThresholds = settings.safety_thresholds || {
    flag_risk_score: 50,
    auto_report_risk_score: 70,
    auto_enforce_risk_score: 85
  };

  const founderProgram = settings.founder_program || {
    founders_mode_enabled: true,
    auto_assign_new_users: true,
    trial_days: 183
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar activePage="AdminSettings" />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">System Settings</h1>
              <p className="text-sm text-slate-400">Configure app behavior and limits</p>
            </div>
            <Button onClick={loadSettings} variant="outline" className="border-slate-700 text-slate-300">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
        </header>

        <div className="p-6">
          <Tabs defaultValue="tiers" className="space-y-6">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="tiers" className="data-[state=active]:bg-orange-500">
                <Crown className="w-4 h-4 mr-2" /> Subscription Tiers
              </TabsTrigger>
              <TabsTrigger value="subscription" className="data-[state=active]:bg-orange-500">
                <DollarSign className="w-4 h-4 mr-2" /> Legacy Limits
              </TabsTrigger>
              <TabsTrigger value="safety" className="data-[state=active]:bg-orange-500">
                <Shield className="w-4 h-4 mr-2" /> Safety
              </TabsTrigger>
              <TabsTrigger value="features" className="data-[state=active]:bg-orange-500">
                <Zap className="w-4 h-4 mr-2" /> Features
              </TabsTrigger>
              <TabsTrigger value="founder" className="data-[state=active]:bg-orange-500">
                <Users className="w-4 h-4 mr-2" /> Founder Program
              </TabsTrigger>
              <TabsTrigger value="onboarding" className="data-[state=active]:bg-orange-500">
                <Users className="w-4 h-4 mr-2" /> Onboarding
              </TabsTrigger>
            </TabsList>

            {/* NEW: Tier Configuration Manager */}
            <TabsContent value="tiers">
              <TierConfigurationManager />
            </TabsContent>

            {/* Legacy Subscription Limits (kept for backwards compatibility) */}
            <TabsContent value="subscription" className="space-y-6">
              <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 mb-4">
                <p className="text-amber-200 text-sm">
                  ⚠️ <strong>Legacy Settings:</strong> These settings are deprecated. Use the new "Subscription Tiers" tab for managing tier limits and features.
                </p>
              </div>
              {['free', 'premium', 'elite', 'vip'].map((tier) => (
                <Card key={tier} className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white capitalize flex items-center gap-2">
                      {tier === 'vip' && <span className="text-purple-400">👑</span>}
                      {tier === 'elite' && <span className="text-orange-400">⭐</span>}
                      {tier === 'premium' && <span className="text-yellow-400">✨</span>}
                      {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Configure limits for {tier} users (-1 = unlimited)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-slate-300">Daily Likes</Label>
                        <Input
                          type="number"
                          value={subscriptionLimits[tier]?.daily_likes || 0}
                          onChange={(e) => {
                            const newLimits = { ...subscriptionLimits };
                            newLimits[tier] = { ...newLimits[tier], daily_likes: parseInt(e.target.value) };
                            updateSetting('subscription_limits', newLimits);
                          }}
                          className="mt-1 bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Daily Messages</Label>
                        <Input
                          type="number"
                          value={subscriptionLimits[tier]?.daily_messages || 0}
                          onChange={(e) => {
                            const newLimits = { ...subscriptionLimits };
                            newLimits[tier] = { ...newLimits[tier], daily_messages: parseInt(e.target.value) };
                            updateSetting('subscription_limits', newLimits);
                          }}
                          className="mt-1 bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Daily Super Likes</Label>
                        <Input
                          type="number"
                          value={subscriptionLimits[tier]?.daily_super_likes || 0}
                          onChange={(e) => {
                            const newLimits = { ...subscriptionLimits };
                            newLimits[tier] = { ...newLimits[tier], daily_super_likes: parseInt(e.target.value) };
                            updateSetting('subscription_limits', newLimits);
                          }}
                          className="mt-1 bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Profile Boosts</Label>
                        <Input
                          type="number"
                          value={subscriptionLimits[tier]?.profile_boosts || 0}
                          onChange={(e) => {
                            const newLimits = { ...subscriptionLimits };
                            newLimits[tier] = { ...newLimits[tier], profile_boosts: parseInt(e.target.value) };
                            updateSetting('subscription_limits', newLimits);
                          }}
                          className="mt-1 bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={subscriptionLimits[tier]?.can_see_who_likes || false}
                          onCheckedChange={(checked) => {
                            const newLimits = { ...subscriptionLimits };
                            newLimits[tier] = { ...newLimits[tier], can_see_who_likes: checked };
                            updateSetting('subscription_limits', newLimits);
                          }}
                        />
                        <Label className="text-slate-300">See Who Likes</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={subscriptionLimits[tier]?.can_rewind || false}
                          onCheckedChange={(checked) => {
                            const newLimits = { ...subscriptionLimits };
                            newLimits[tier] = { ...newLimits[tier], can_rewind: checked };
                            updateSetting('subscription_limits', newLimits);
                          }}
                        />
                        <Label className="text-slate-300">Rewind</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={subscriptionLimits[tier]?.incognito_mode || false}
                          onCheckedChange={(checked) => {
                            const newLimits = { ...subscriptionLimits };
                            newLimits[tier] = { ...newLimits[tier], incognito_mode: checked };
                            updateSetting('subscription_limits', newLimits);
                          }}
                        />
                        <Label className="text-slate-300">Incognito</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Safety Settings */}
            <TabsContent value="safety" className="space-y-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">AI Safety Thresholds</CardTitle>
                  <CardDescription className="text-slate-400">
                    Configure automatic moderation thresholds (0-100)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-slate-300">Flag Risk Score</Label>
                      <p className="text-xs text-slate-500 mb-2">Flag profiles for manual review</p>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={safetyThresholds.flag_risk_score}
                        onChange={(e) => updateSetting('safety_thresholds', {
                          ...safetyThresholds,
                          flag_risk_score: parseInt(e.target.value)
                        })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Auto-Report Score</Label>
                      <p className="text-xs text-slate-500 mb-2">Auto-create moderation report</p>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={safetyThresholds.auto_report_risk_score}
                        onChange={(e) => updateSetting('safety_thresholds', {
                          ...safetyThresholds,
                          auto_report_risk_score: parseInt(e.target.value)
                        })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Auto-Enforce Score</Label>
                      <p className="text-xs text-slate-500 mb-2">Auto-suspend account</p>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={safetyThresholds.auto_enforce_risk_score}
                        onChange={(e) => updateSetting('safety_thresholds', {
                          ...safetyThresholds,
                          auto_enforce_risk_score: parseInt(e.target.value)
                        })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Rate Limits</CardTitle>
                  <CardDescription className="text-slate-400">
                    Prevent abuse and spam
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-slate-300">Message Cooldown (ms)</Label>
                      <Input
                        type="number"
                        value={rateLimits.message_cooldown_ms}
                        onChange={(e) => updateSetting('rate_limits', {
                          ...rateLimits,
                          message_cooldown_ms: parseInt(e.target.value)
                        })}
                        className="mt-1 bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Auth Attempts/Hour</Label>
                      <Input
                        type="number"
                        value={rateLimits.auth_attempts_per_hour}
                        onChange={(e) => updateSetting('rate_limits', {
                          ...rateLimits,
                          auth_attempts_per_hour: parseInt(e.target.value)
                        })}
                        className="mt-1 bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Profile Views/Min</Label>
                      <Input
                        type="number"
                        value={rateLimits.profile_views_per_minute}
                        onChange={(e) => updateSetting('rate_limits', {
                          ...rateLimits,
                          profile_views_per_minute: parseInt(e.target.value)
                        })}
                        className="mt-1 bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Feature Flags */}
            <TabsContent value="features" className="space-y-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Feature Flags</CardTitle>
                  <CardDescription className="text-slate-400">
                    Enable or disable features across the app
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {featureFlags.map((flag) => (
                      <div key={flag.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{flag.display_name}</p>
                          <p className="text-slate-400 text-sm">{flag.description}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          {flag.rollout_percentage !== undefined && (
                            <span className="text-slate-400 text-sm">{flag.rollout_percentage}% rollout</span>
                          )}
                          <Switch
                            checked={flag.is_enabled}
                            onCheckedChange={() => toggleFeatureFlag(flag)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onboarding Settings */}
            <TabsContent value="onboarding">
              <OnboardingSettings />
            </TabsContent>

            {/* Founder Program */}
            <TabsContent value="founder" className="space-y-6">
              <FounderProgramManagement />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}