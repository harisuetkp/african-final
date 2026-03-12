import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Flag, Plus, Percent } from 'lucide-react';

export default function FeatureFlags({ flags }) {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    feature_name: '',
    display_name: '',
    description: '',
    is_enabled: false,
    enabled_for_premium: false,
    rollout_percentage: 0
  });
  const queryClient = useQueryClient();

  const createFlagMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.FeatureFlag.create(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-feature-flags']);
      setShowDialog(false);
      setFormData({
        feature_name: '',
        display_name: '',
        description: '',
        is_enabled: false,
        enabled_for_premium: false,
        rollout_percentage: 0
      });
    }
  });

  const updateFlagMutation = useMutation({
    mutationFn: async ({ flagId, updates }) => {
      await base44.entities.FeatureFlag.update(flagId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-feature-flags']);
    }
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Flag size={24} className="text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{flags.length}</p>
                <p className="text-sm text-gray-600">Total Flags</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Flag size={24} className="text-green-600" />
              <div>
                <p className="text-2xl font-bold">{flags.filter(f => f.is_enabled).length}</p>
                <p className="text-sm text-gray-600">Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Percent size={24} className="text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {flags.filter(f => f.rollout_percentage > 0 && f.rollout_percentage < 100).length}
                </p>
                <p className="text-sm text-gray-600">Partial Rollout</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Button className="w-full" onClick={() => setShowDialog(true)}>
              <Plus size={18} className="mr-2" />
              Add Flag
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Flags List */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {flags.map(flag => (
              <div key={flag.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{flag.display_name}</h3>
                    <p className="text-sm text-gray-600">{flag.description}</p>
                    <p className="text-xs text-gray-500 font-mono mt-1">{flag.feature_name}</p>
                  </div>
                  <Switch
                    checked={flag.is_enabled}
                    onCheckedChange={(checked) => updateFlagMutation.mutate({
                      flagId: flag.id,
                      updates: { is_enabled: checked }
                    })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Premium Only</span>
                    <Switch
                      checked={flag.enabled_for_premium}
                      onCheckedChange={(checked) => updateFlagMutation.mutate({
                        flagId: flag.id,
                        updates: { enabled_for_premium: checked }
                      })}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Rollout Percentage</span>
                      <span className="text-sm font-medium">{flag.rollout_percentage}%</span>
                    </div>
                    <Slider
                      value={[flag.rollout_percentage]}
                      onValueChange={([value]) => updateFlagMutation.mutate({
                        flagId: flag.id,
                        updates: { rollout_percentage: value }
                      })}
                      max={100}
                      step={5}
                    />
                  </div>
                </div>
              </div>
            ))}
            {flags.length === 0 && (
              <p className="text-center text-gray-500 py-8">No feature flags configured</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Flag Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Feature Flag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Feature Name (Code)</label>
              <Input
                placeholder="e.g., ai_matchmaking"
                value={formData.feature_name}
                onChange={(e) => setFormData({...formData, feature_name: e.target.value})}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input
                placeholder="e.g., AI Matchmaking"
                value={formData.display_name}
                onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="What does this feature do?"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="mt-2"
                rows={3}
              />
            </div>

            <Button
              onClick={() => createFlagMutation.mutate()}
              disabled={!formData.feature_name || !formData.display_name || createFlagMutation.isPending}
              className="w-full"
            >
              Create Flag
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}