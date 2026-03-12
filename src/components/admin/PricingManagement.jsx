import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DollarSign, Plus, Edit, Trash, Tag, Gift, TestTube, TrendingUp, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PricingManagement({ plans: initialPlans }) {
  const [activeTab, setActiveTab] = useState('plans');
  const [editDialog, setEditDialog] = useState({ open: false, type: null, item: null });
  const queryClient = useQueryClient();

  const { data: plans = initialPlans || [] } = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: () => base44.entities.PricingPlan.list('-created_date', 100),
    initialData: initialPlans
  });

  const { data: promotions = [] } = useQuery({
    queryKey: ['promotions'],
    queryFn: () => base44.entities.Promotion.list('-created_date', 100)
  });

  const { data: abTests = [] } = useQuery({
    queryKey: ['ab-tests'],
    queryFn: () => base44.entities.ABTest.list('-created_date', 50)
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => base44.entities.Referral.list('-created_date', 200)
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await base44.entities.PricingPlan.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pricing-plans']);
      queryClient.invalidateQueries(['admin-pricing-plans']);
      setEditDialog({ open: false, type: null, item: null });
      alert('Plan updated successfully!');
    }
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.PricingPlan.create({
        ...data,
        plan_id: `${data.tier}_${data.billing_period}_${Date.now()}`,
        features: data.features || [],
        is_active: data.is_active !== undefined ? data.is_active : true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pricing-plans']);
      queryClient.invalidateQueries(['admin-pricing-plans']);
      setEditDialog({ open: false, type: null, item: null });
      alert('Plan created successfully!');
    }
  });

  const createPromotionMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Promotion.create({
        ...data,
        is_active: true,
        current_uses: 0,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['promotions']);
      setEditDialog({ open: false, type: null, item: null });
      alert('Promotion created successfully!');
    }
  });

  const createABTestMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.ABTest.create({
        ...data,
        is_active: true,
        winner: 'no_winner',
        metrics: {
          variant_a_views: 0,
          variant_a_conversions: 0,
          variant_b_views: 0,
          variant_b_conversions: 0
        },
        start_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ab-tests']);
      setEditDialog({ open: false, type: null, item: null });
      alert('A/B Test created successfully!');
    }
  });

  const activePromos = promotions.filter(p => p.is_active);
  const activeTests = abTests.filter(t => t.is_active);
  const completedReferrals = referrals.filter(r => r.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Pricing & Monetization</h2>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Plans</p>
                <p className="text-2xl font-bold text-white">{plans.filter(p => p.is_active).length}</p>
              </div>
              <DollarSign size={24} className="text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Promos</p>
                <p className="text-2xl font-bold text-white">{activePromos.length}</p>
              </div>
              <Tag size={24} className="text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">A/B Tests</p>
                <p className="text-2xl font-bold text-white">{activeTests.length}</p>
              </div>
              <TestTube size={24} className="text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Referrals</p>
                <p className="text-2xl font-bold text-white">{completedReferrals.length}</p>
              </div>
              <Gift size={24} className="text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/10">
          <TabsTrigger value="plans">Pricing Plans</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="abtests">A/B Tests</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <Button
            onClick={() => setEditDialog({ open: true, type: 'plan', item: null })}
            className="mb-4"
          >
            <Plus size={18} className="mr-2" />
            Create Plan
          </Button>

          {plans.map(plan => (
            <Card key={plan.id} className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <Badge className={plan.tier === 'vip' ? 'bg-amber-500' : 'bg-purple-500'}>
                        {plan.tier}
                      </Badge>
                      {plan.is_featured && <Badge className="bg-green-500">Featured</Badge>}
                      <Switch
                        checked={plan.is_active}
                        onCheckedChange={(checked) => 
                          updatePlanMutation.mutate({ id: plan.id, data: { is_active: checked } })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-gray-300">
                      <div>
                        <p className="text-sm text-gray-400">Price</p>
                        <p className="text-lg font-semibold">${plan.price_usd}/{plan.billing_period}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Features</p>
                        <p className="text-sm">{plan.features?.length || 0} features</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditDialog({ open: true, type: 'plan', item: plan })}
                  >
                    <Edit size={18} className="text-gray-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="promotions" className="space-y-4">
          <Button
            onClick={() => setEditDialog({ open: true, type: 'promo', item: null })}
            className="mb-4"
          >
            <Plus size={18} className="mr-2" />
            Create Promotion
          </Button>

          {promotions.map(promo => (
            <Card key={promo.id} className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{promo.promo_code}</h3>
                      <Badge className="bg-purple-500">{promo.promo_type}</Badge>
                      <Switch
                        checked={promo.is_active}
                        onCheckedChange={async (checked) => {
                          try {
                            await base44.entities.Promotion.update(promo.id, { is_active: checked });
                            queryClient.invalidateQueries(['promotions']);
                          } catch (e) {
                            alert('Failed to update promotion');
                          }
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-gray-300 text-sm">
                      {promo.discount_percentage && (
                        <div>
                          <p className="text-gray-400">Discount</p>
                          <p>{promo.discount_percentage}% off</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-400">Uses</p>
                        <p>{promo.current_uses}/{promo.max_uses || '∞'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Audience</p>
                        <p className="capitalize">{promo.target_audience.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="abtests" className="space-y-4">
          <Button
            onClick={() => setEditDialog({ open: true, type: 'abtest', item: null })}
            className="mb-4"
          >
            <Plus size={18} className="mr-2" />
            Create A/B Test
          </Button>

          {abTests.map(test => {
            const aConvRate = test.metrics?.variant_a_views > 0
              ? ((test.metrics.variant_a_conversions / test.metrics.variant_a_views) * 100).toFixed(1)
              : 0;
            const bConvRate = test.metrics?.variant_b_views > 0
              ? ((test.metrics.variant_b_conversions / test.metrics.variant_b_views) * 100).toFixed(1)
              : 0;

            return (
              <Card key={test.id} className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{test.test_name}</h3>
                        <Badge className="bg-blue-500">{test.test_type}</Badge>
                        {test.winner !== 'no_winner' && (
                          <Badge className="bg-green-500">Winner: {test.winner}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">Split: {test.traffic_split}% B / {100 - test.traffic_split}% A</p>
                    </div>
                    <Switch checked={test.is_active} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Variant A (Control)</h4>
                      <div className="space-y-1 text-sm text-gray-300">
                        <p>Views: {test.metrics?.variant_a_views || 0}</p>
                        <p>Conversions: {test.metrics?.variant_a_conversions || 0}</p>
                        <p className="font-bold text-white">Rate: {aConvRate}%</p>
                      </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg">
                      <h4 className="text-white font-semibold mb-2">Variant B (Test)</h4>
                      <div className="space-y-1 text-sm text-gray-300">
                        <p>Views: {test.metrics?.variant_b_views || 0}</p>
                        <p>Conversions: {test.metrics?.variant_b_conversions || 0}</p>
                        <p className="font-bold text-white">Rate: {bConvRate}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <Card className="bg-white/5 border-white/10 mb-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Referral Program Settings</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Reward for Referrer</Label>
                  <Select defaultValue="free_week">
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free_week">1 Week Free Premium</SelectItem>
                      <SelectItem value="discount">20% Discount</SelectItem>
                      <SelectItem value="boosts">5 Free Boosts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Reward for New User</Label>
                  <Select defaultValue="discount">
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free_week">1 Week Free Premium</SelectItem>
                      <SelectItem value="discount">10% First Month</SelectItem>
                      <SelectItem value="boosts">3 Free Boosts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <p className="text-gray-400">Total Referrals</p>
                <p className="text-2xl font-bold text-white">{referrals.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <p className="text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-400">{completedReferrals.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <p className="text-gray-400">Conversion Rate</p>
                <p className="text-2xl font-bold text-white">
                  {referrals.length > 0 ? ((completedReferrals.length / referrals.length) * 100).toFixed(1) : 0}%
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit/Create Dialogs */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent className="bg-gray-900 border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editDialog.type === 'plan' && (editDialog.item ? 'Edit Plan' : 'Create Plan')}
              {editDialog.type === 'promo' && 'Create Promotion'}
              {editDialog.type === 'abtest' && 'Create A/B Test'}
            </DialogTitle>
          </DialogHeader>
          {editDialog.type === 'plan' && (
            <PlanForm 
              plan={editDialog.item} 
              onSubmit={editDialog.item ? updatePlanMutation.mutate : createPlanMutation.mutate} 
            />
          )}
          {editDialog.type === 'promo' && <PromoForm onSubmit={createPromotionMutation.mutate} />}
          {editDialog.type === 'abtest' && <ABTestForm onSubmit={createABTestMutation.mutate} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlanForm({ plan, onSubmit }) {
  const [formData, setFormData] = useState(plan || {
    plan_id: '',
    name: '',
    tier: 'premium',
    billing_period: 'monthly',
    price_usd: 14.99,
    features: [
      'Unlimited Likes',
      'See Who Likes You',
      'Advanced Filters',
      '5 Super Likes/day',
      'Profile Boost',
      'No Ads'
    ],
    is_active: true,
    is_featured: false
  });

  const handleSubmit = () => {
    if (plan) {
      onSubmit({ id: plan.id, data: formData });
    } else {
      onSubmit(formData);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-gray-300">Plan Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Premium Monthly"
          className="bg-white/10 border-white/20 text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-300">Tier</Label>
          <Select value={formData.tier} onValueChange={(v) => setFormData({ ...formData, tier: v })}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="elite">Elite</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-gray-300">Billing Period</Label>
          <Select value={formData.billing_period} onValueChange={(v) => setFormData({ ...formData, billing_period: v })}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-gray-300">Price (USD)</Label>
        <Input
          type="number"
          step="0.01"
          value={formData.price_usd}
          onChange={(e) => setFormData({ ...formData, price_usd: parseFloat(e.target.value) })}
          className="bg-white/10 border-white/20 text-white"
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label className="text-gray-300">Active</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_featured}
            onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
          />
          <Label className="text-gray-300">Featured</Label>
        </div>
      </div>
      <Button onClick={handleSubmit} className="w-full">
        {plan ? 'Update Plan' : 'Create Plan'}
      </Button>
    </div>
  );
}

function PromoForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    promo_code: '',
    promo_type: 'discount',
    discount_percentage: 20,
    trial_days: 7,
    max_uses: 100,
    target_audience: 'all'
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Promo Code</Label>
        <Input
          value={formData.promo_code}
          onChange={(e) => setFormData({ ...formData, promo_code: e.target.value.toUpperCase() })}
          placeholder="SUMMER2025"
          className="bg-white/10 border-white/20"
        />
      </div>
      <div>
        <Label>Type</Label>
        <Select value={formData.promo_type} onValueChange={(v) => setFormData({ ...formData, promo_type: v })}>
          <SelectTrigger className="bg-white/10 border-white/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="discount">Discount</SelectItem>
            <SelectItem value="free_trial">Free Trial</SelectItem>
            <SelectItem value="free_boost">Free Boosts</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {formData.promo_type === 'discount' && (
        <div>
          <Label>Discount %</Label>
          <Input
            type="number"
            value={formData.discount_percentage}
            onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
            className="bg-white/10 border-white/20"
          />
        </div>
      )}
      <Button onClick={() => onSubmit(formData)} className="w-full">Create Promotion</Button>
    </div>
  );
}

function ABTestForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    test_name: '',
    test_type: 'pricing',
    variant_a: { price: 9.99 },
    variant_b: { price: 7.99 },
    traffic_split: 50
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Test Name</Label>
        <Input
          value={formData.test_name}
          onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
          placeholder="Premium Pricing Test"
          className="bg-white/10 border-white/20"
        />
      </div>
      <div>
        <Label>Test Type</Label>
        <Select value={formData.test_type} onValueChange={(v) => setFormData({ ...formData, test_type: v })}>
          <SelectTrigger className="bg-white/10 border-white/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pricing">Pricing</SelectItem>
            <SelectItem value="paywall_copy">Paywall Copy</SelectItem>
            <SelectItem value="cta_placement">CTA Placement</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Variant A (Control)</Label>
          <Input
            type="number"
            placeholder="9.99"
            className="bg-white/10 border-white/20"
          />
        </div>
        <div>
          <Label>Variant B (Test)</Label>
          <Input
            type="number"
            placeholder="7.99"
            className="bg-white/10 border-white/20"
          />
        </div>
      </div>
      <Button onClick={() => onSubmit(formData)} className="w-full">Create A/B Test</Button>
    </div>
  );
}