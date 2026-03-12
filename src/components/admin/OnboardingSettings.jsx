import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Save, Loader2 } from "lucide-react";

export default function OnboardingSettings() {
  const [settings, setSettings] = useState({
    min_photos: 2,
    min_interests: 3,
    require_location: true,
    require_heritage_country: true,
    enable_founder_codes: true,
    enable_ambassador_codes: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await base44.entities.SystemSettings.filter({ key: 'onboarding_config' });
      if (data.length > 0) {
        setSettings({ ...settings, ...data[0].value });
      }
    } catch (e) {
      console.error('Failed to load onboarding settings:', e);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const user = await base44.auth.me();
      const existing = await base44.entities.SystemSettings.filter({ key: 'onboarding_config' });
      
      if (existing.length > 0) {
        await base44.entities.SystemSettings.update(existing[0].id, {
          value: settings,
          updated_by: user.email
        });
      } else {
        await base44.entities.SystemSettings.create({
          key: 'onboarding_config',
          value: settings,
          updated_by: user.email,
          description: 'Onboarding flow configuration'
        });
      }
      
      toast.success('Onboarding settings saved');
    } catch (e) {
      console.error('Failed to save:', e);
      toast.error('Failed to save settings');
    }
    setSaving(false);
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users size={20} />
          Onboarding Configuration
        </CardTitle>
        <CardDescription className="text-slate-400">
          Control the simplified 4-step onboarding flow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-300">Minimum Photos Required</Label>
            <Input
              type="number"
              min="1"
              max="6"
              value={settings.min_photos}
              onChange={(e) => setSettings({ ...settings, min_photos: parseInt(e.target.value) })}
              className="mt-1 bg-slate-800 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-500 mt-1">Default: 2 (users can add up to 6)</p>
          </div>
          
          <div>
            <Label className="text-slate-300">Minimum Interests Required</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={settings.min_interests}
              onChange={(e) => setSettings({ ...settings, min_interests: parseInt(e.target.value) })}
              className="mt-1 bg-slate-800 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-500 mt-1">Default: 3</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <div>
              <p className="text-white font-medium text-sm">Require Location Verification</p>
              <p className="text-slate-400 text-xs">Force users to enable GPS during onboarding</p>
            </div>
            <Switch
              checked={settings.require_location}
              onCheckedChange={(checked) => setSettings({ ...settings, require_location: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <div>
              <p className="text-white font-medium text-sm">Require Heritage Country</p>
              <p className="text-slate-400 text-xs">Make country of origin mandatory</p>
            </div>
            <Switch
              checked={settings.require_heritage_country}
              onCheckedChange={(checked) => setSettings({ ...settings, require_heritage_country: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <div>
              <p className="text-white font-medium text-sm">Enable Founder Codes</p>
              <p className="text-slate-400 text-xs">Allow users to enter founding member codes</p>
            </div>
            <Switch
              checked={settings.enable_founder_codes}
              onCheckedChange={(checked) => setSettings({ ...settings, enable_founder_codes: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <div>
              <p className="text-white font-medium text-sm">Enable Ambassador Codes</p>
              <p className="text-slate-400 text-xs">Allow referral/ambassador code entry</p>
            </div>
            <Switch
              checked={settings.enable_ambassador_codes}
              onCheckedChange={(checked) => setSettings({ ...settings, enable_ambassador_codes: checked })}
            />
          </div>
        </div>

        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <p className="text-blue-200 text-sm">
            ℹ️ <strong>Flow Summary:</strong> Welcome → Basics (Name/DOB/Gender/Preferences) → Location & Goal → Photos & Interests
          </p>
        </div>

        <Button onClick={saveSettings} disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600">
          {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
          Save Onboarding Settings
        </Button>
      </CardContent>
    </Card>
  );
}