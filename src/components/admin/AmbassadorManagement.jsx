import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, DollarSign, TrendingUp, Plus, Edit, Trash2, Ban, CheckCircle,
  AlertTriangle, Download, Loader2, Crown, Target, Gift, FileText, Upload
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AmbassadorManagement() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreatePlanDialog, setShowCreatePlanDialog] = useState(false);
  const [showCreateCampaignDialog, setShowCreateCampaignDialog] = useState(false);
  const [selectedAmbassador, setSelectedAmbassador] = useState(null);
  const [newAmbassador, setNewAmbassador] = useState({ handle: '', email: '', display_name: '', country: '' });
  const [newPlan, setNewPlan] = useState({
    name: '', plan_type: 'cpa', cpa_amount: 10, revenue_share_pct: 0,
    recurring_share_pct: 0, recurring_months: 6, activation_bonus: 0, signup_bonus: 0, is_default: false
  });
  const [newCampaign, setNewCampaign] = useState({
    name: '', description: '', campaign_type: 'bonus_multiplier',
    bonus_multiplier: 2, flat_bonus_amount: 0, starts_at: '', ends_at: ''
  });

  // Fetch stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['ambassador-admin-stats'],
    queryFn: async () => {
      const response = await base44.functions.invoke('ambassadorAdmin', { action: 'get_stats' });
      return response.data;
    }
  });

  // Fetch ambassadors
  const { data: ambassadors = [], isLoading: loadingAmbassadors } = useQuery({
    queryKey: ['ambassadors-list'],
    queryFn: () => base44.entities.Ambassador.list('-created_date', 200)
  });

  // Fetch commission plans
  const { data: plans = [] } = useQuery({
    queryKey: ['commission-plans'],
    queryFn: () => base44.entities.AmbassadorCommissionPlan.list('-created_date', 50)
  });

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ['ambassador-campaigns'],
    queryFn: () => base44.entities.AmbassadorCampaign.list('-created_date', 50)
  });

  // Fetch suspicious referrals
  const { data: suspiciousData } = useQuery({
    queryKey: ['suspicious-referrals'],
    queryFn: async () => {
      const response = await base44.functions.invoke('ambassadorAdmin', { action: 'get_suspicious_referrals' });
      return response.data;
    }
  });

  // Mutations
  const createAmbassadorMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('ambassadorAdmin', { action: 'create_ambassador', ...data });
      if (response.data.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ambassadors-list'] });
      setShowCreateDialog(false);
      setNewAmbassador({ handle: '', email: '', display_name: '', country: '' });
      toast.success('Ambassador created');
    },
    onError: (error) => toast.error(error.message)
  });

  const updateAmbassadorMutation = useMutation({
    mutationFn: async ({ ambassador_id, updates }) => {
      const response = await base44.functions.invoke('ambassadorAdmin', { action: 'update_ambassador', ambassador_id, updates });
      if (response.data.error) throw new Error(response.data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ambassadors-list'] });
      toast.success('Ambassador updated');
    }
  });

  const suspendAmbassadorMutation = useMutation({
    mutationFn: async ({ ambassador_id, reason }) => {
      const response = await base44.functions.invoke('ambassadorAdmin', { action: 'suspend_ambassador', ambassador_id, reason });
      if (response.data.error) throw new Error(response.data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ambassadors-list'] });
      toast.success('Ambassador suspended');
    }
  });

  const activateAmbassadorMutation = useMutation({
    mutationFn: async (ambassador_id) => {
      const response = await base44.functions.invoke('ambassadorAdmin', { action: 'activate_ambassador', ambassador_id });
      if (response.data.error) throw new Error(response.data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ambassadors-list'] });
      toast.success('Ambassador activated');
    }
  });

  const approveCommissionsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('ambassadorAdmin', { action: 'approve_commissions' });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ambassador-admin-stats'] });
      toast.success(`${data.approved_count} commissions approved`);
    }
  });

  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutAmbassadorId, setPayoutAmbassadorId] = useState(null);
  const [payoutMethod, setPayoutMethod] = useState('stripe');

  const createPayoutMutation = useMutation({
    mutationFn: async (ambassador_id) => {
      const response = await base44.functions.invoke('ambassadorAdmin', { action: 'process_payout', ambassador_id });
      if (response.data.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ambassadors-list'] });
      toast.success('Payout record created');
      return data.payout;
    },
    onError: (error) => toast.error(error.message)
  });

  const processStripePayoutMutation = useMutation({
    mutationFn: async (payout_id) => {
      const response = await base44.functions.invoke('processAmbassadorPayout', { 
        payout_id, 
        action: 'process_stripe' 
      });
      if (response.data.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ambassadors-list'] });
      queryClient.invalidateQueries({ queryKey: ['ambassador-admin-stats'] });
      setShowPayoutDialog(false);
      toast.success('Stripe payout sent successfully!');
    },
    onError: (error) => toast.error(error.message)
  });

  const markManualPaidMutation = useMutation({
    mutationFn: async ({ payout_id, transaction_id }) => {
      const response = await base44.functions.invoke('processAmbassadorPayout', { 
        payout_id, 
        action: 'mark_manual_paid',
        transaction_id
      });
      if (response.data.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ambassadors-list'] });
      queryClient.invalidateQueries({ queryKey: ['ambassador-admin-stats'] });
      setShowPayoutDialog(false);
      toast.success('Payout marked as paid');
    },
    onError: (error) => toast.error(error.message)
  });

  const handleInitiatePayout = async (ambassador_id) => {
    setPayoutAmbassadorId(ambassador_id);
    setShowPayoutDialog(true);
  };

  const handleProcessPayout = async () => {
    try {
      // First create the payout record
      const result = await createPayoutMutation.mutateAsync(payoutAmbassadorId);
      
      if (payoutMethod === 'stripe') {
        // Process via Stripe Connect
        await processStripePayoutMutation.mutateAsync(result.payout?.id);
      } else {
        // Show manual transaction ID input
        const txId = prompt('Enter transaction ID for manual payout:');
        if (txId) {
          await markManualPaidMutation.mutateAsync({ payout_id: result.payout?.id, transaction_id: txId });
        }
      }
    } catch (error) {
      console.error('Payout error:', error);
    }
  };

  const createPlanMutation = useMutation({
    mutationFn: async (plan) => {
      const response = await base44.functions.invoke('ambassadorAdmin', { action: 'create_commission_plan', plan });
      if (response.data.error) throw new Error(response.data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-plans'] });
      setShowCreatePlanDialog(false);
      toast.success('Commission plan created');
    }
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (campaign) => {
      const response = await base44.functions.invoke('ambassadorAdmin', { action: 'create_campaign', campaign });
      if (response.data.error) throw new Error(response.data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ambassador-campaigns'] });
      setShowCreateCampaignDialog(false);
      toast.success('Campaign created');
    }
  });

  const tierColors = {
    bronze: 'bg-amber-700',
    silver: 'bg-gray-400',
    gold: 'bg-yellow-500',
    platinum: 'bg-purple-600'
  };

  if (loadingStats || loadingAmbassadors) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="text-purple-600" />
            Ambassador Program
          </h2>
          <p className="text-gray-500">Manage ambassadors, commissions, and campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => approveCommissionsMutation.mutate()}>
            <CheckCircle size={16} className="mr-2" />
            Approve Pending
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus size={16} className="mr-2" />
            Add Ambassador
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="mx-auto text-purple-600 mb-2" size={24} />
            <div className="text-2xl font-bold">{stats?.active_ambassadors || 0}</div>
            <div className="text-xs text-gray-500">Active Ambassadors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="mx-auto text-blue-600 mb-2" size={24} />
            <div className="text-2xl font-bold">{stats?.total_signups || 0}</div>
            <div className="text-xs text-gray-500">Total Signups</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="mx-auto text-green-600 mb-2" size={24} />
            <div className="text-2xl font-bold">${stats?.total_revenue?.toFixed(0) || 0}</div>
            <div className="text-xs text-gray-500">Revenue Generated</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto text-amber-600 mb-2" size={24} />
            <div className="text-2xl font-bold">{stats?.conversion_rate || 0}%</div>
            <div className="text-xs text-gray-500">Conversion Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="mx-auto text-red-600 mb-2" size={24} />
            <div className="text-2xl font-bold">{stats?.suspicious_referrals || 0}</div>
            <div className="text-xs text-gray-500">Flagged Referrals</div>
          </CardContent>
        </Card>
      </div>

      {/* Commissions Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800">Pending Commissions</p>
            <p className="text-2xl font-bold text-yellow-900">${stats?.pending_commissions?.toFixed(2) || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <p className="text-sm text-green-800">Approved (Awaiting Payout)</p>
            <p className="text-2xl font-bold text-green-900">${stats?.approved_commissions?.toFixed(2) || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">Total Paid Out</p>
            <p className="text-2xl font-bold text-blue-900">${stats?.paid_commissions?.toFixed(2) || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ambassadors">
        <TabsList>
          <TabsTrigger value="ambassadors">Ambassadors</TabsTrigger>
          <TabsTrigger value="plans">Commission Plans</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Review</TabsTrigger>
        </TabsList>

        {/* Ambassadors Tab */}
        <TabsContent value="ambassadors">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ambassador</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Signups</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Commissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ambassadors.map(amb => (
                <TableRow key={amb.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{amb.display_name}</div>
                      <div className="text-xs text-gray-500">@{amb.handle} • {amb.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={tierColors[amb.tier]}>{amb.tier}</Badge>
                  </TableCell>
                  <TableCell>{amb.stats?.total_signups || 0}</TableCell>
                  <TableCell>{amb.stats?.total_subscribers || 0}</TableCell>
                  <TableCell>${(amb.stats?.total_revenue_generated || 0).toFixed(0)}</TableCell>
                  <TableCell>${(amb.stats?.total_commissions_earned || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={
                      amb.status === 'active' ? 'bg-green-600' :
                      amb.status === 'suspended' ? 'bg-red-600' :
                      amb.status === 'pending' ? 'bg-yellow-600' : 'bg-gray-400'
                    }>
                      {amb.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {amb.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => activateAmbassadorMutation.mutate(amb.id)}>
                          Activate
                        </Button>
                      )}
                      {amb.status === 'active' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleInitiatePayout(amb.id)}>
                            Payout
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => suspendAmbassadorMutation.mutate({ ambassador_id: amb.id, reason: 'Admin action' })}>
                            <Ban size={14} />
                          </Button>
                        </>
                      )}
                      {amb.status === 'suspended' && (
                        <Button size="sm" variant="outline" onClick={() => activateAmbassadorMutation.mutate(amb.id)}>
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowCreatePlanDialog(true)}>
              <Plus size={16} className="mr-2" /> Create Plan
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map(plan => (
              <Card key={plan.id} className={plan.is_default ? 'border-purple-500' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {plan.is_default && <Badge>Default</Badge>}
                  </CardTitle>
                  <CardDescription>{plan.plan_type}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {plan.cpa_amount > 0 && <p>CPA: ${plan.cpa_amount}</p>}
                  {plan.revenue_share_pct > 0 && <p>Revenue Share: {plan.revenue_share_pct}%</p>}
                  {plan.recurring_share_pct > 0 && <p>Recurring: {plan.recurring_share_pct}% for {plan.recurring_months} mo</p>}
                  {plan.activation_bonus > 0 && <p>Activation Bonus: ${plan.activation_bonus}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowCreateCampaignDialog(true)}>
              <Plus size={16} className="mr-2" /> Create Campaign
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {campaigns.map(campaign => (
              <Card key={campaign.id} className={campaign.is_active ? 'border-green-500' : ''}>
                <CardHeader>
                  <CardTitle>{campaign.name}</CardTitle>
                  <CardDescription>{campaign.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{campaign.campaign_type}</Badge>
                    {campaign.bonus_multiplier && <Badge variant="outline">{campaign.bonus_multiplier}x</Badge>}
                    {campaign.flat_bonus_amount && <Badge variant="outline">+${campaign.flat_bonus_amount}</Badge>}
                  </div>
                  <p className="text-sm text-gray-500">
                    {format(new Date(campaign.starts_at), 'MMM d')} - {format(new Date(campaign.ends_at), 'MMM d, yyyy')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Fraud Tab */}
        <TabsContent value="fraud">
          {suspiciousData?.referrals?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Ambassador</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspiciousData.referrals.map(ref => (
                  <TableRow key={ref.id}>
                    <TableCell>{ref.user_id?.slice(-8)}</TableCell>
                    <TableCell>{ref.ambassador_id}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ref.fraud_flags?.map((flag, i) => (
                          <Badge key={i} variant="destructive" className="text-xs">{flag}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(ref.created_date), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
                No suspicious referrals detected
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Ambassador Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Ambassador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Handle (unique)</Label>
              <Input
                value={newAmbassador.handle}
                onChange={(e) => setNewAmbassador({ ...newAmbassador, handle: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                placeholder="joelle"
              />
              <p className="text-xs text-gray-500 mt-1">Code will be: AMBA_{newAmbassador.handle.toUpperCase()}</p>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newAmbassador.email}
                onChange={(e) => setNewAmbassador({ ...newAmbassador, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Display Name</Label>
              <Input
                value={newAmbassador.display_name}
                onChange={(e) => setNewAmbassador({ ...newAmbassador, display_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input
                value={newAmbassador.country}
                onChange={(e) => setNewAmbassador({ ...newAmbassador, country: e.target.value })}
              />
            </div>
            <div>
              <Label>Commission Plan</Label>
              <Select
                value={newAmbassador.commission_plan_id}
                onValueChange={(v) => setNewAmbassador({ ...newAmbassador, commission_plan_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => createAmbassadorMutation.mutate(newAmbassador)}
              disabled={!newAmbassador.handle || !newAmbassador.email || createAmbassadorMutation.isPending}
            >
              {createAmbassadorMutation.isPending && <Loader2 className="animate-spin mr-2" size={16} />}
              Create Ambassador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Plan Dialog */}
      <Dialog open={showCreatePlanDialog} onOpenChange={setShowCreatePlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Commission Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Plan Name</Label>
              <Input
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Plan Type</Label>
              <Select value={newPlan.plan_type} onValueChange={(v) => setNewPlan({ ...newPlan, plan_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpa">CPA (Fixed per subscriber)</SelectItem>
                  <SelectItem value="revenue_share">Revenue Share</SelectItem>
                  <SelectItem value="recurring_share">Recurring Share</SelectItem>
                  <SelectItem value="hybrid">Hybrid (CPA + Share)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CPA Amount ($)</Label>
                <Input type="number" value={newPlan.cpa_amount} onChange={(e) => setNewPlan({ ...newPlan, cpa_amount: parseFloat(e.target.value) })} />
              </div>
              <div>
                <Label>Revenue Share (%)</Label>
                <Input type="number" value={newPlan.revenue_share_pct} onChange={(e) => setNewPlan({ ...newPlan, revenue_share_pct: parseFloat(e.target.value) })} />
              </div>
              <div>
                <Label>Recurring Share (%)</Label>
                <Input type="number" value={newPlan.recurring_share_pct} onChange={(e) => setNewPlan({ ...newPlan, recurring_share_pct: parseFloat(e.target.value) })} />
              </div>
              <div>
                <Label>Recurring Months</Label>
                <Input type="number" value={newPlan.recurring_months} onChange={(e) => setNewPlan({ ...newPlan, recurring_months: parseInt(e.target.value) })} />
              </div>
              <div>
                <Label>Activation Bonus ($)</Label>
                <Input type="number" value={newPlan.activation_bonus} onChange={(e) => setNewPlan({ ...newPlan, activation_bonus: parseFloat(e.target.value) })} />
              </div>
              <div>
                <Label>Signup Bonus ($)</Label>
                <Input type="number" value={newPlan.signup_bonus} onChange={(e) => setNewPlan({ ...newPlan, signup_bonus: parseFloat(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePlanDialog(false)}>Cancel</Button>
            <Button onClick={() => createPlanMutation.mutate(newPlan)}>Create Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payout Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Payout Method</Label>
              <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">Stripe Connect (Automatic)</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer (Manual)</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money (Manual)</SelectItem>
                  <SelectItem value="crypto">Crypto (Manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {payoutMethod === 'stripe' && (
              <p className="text-sm text-gray-500">
                The payout will be sent automatically via Stripe Connect. Ambassador must have a connected Stripe account.
              </p>
            )}
            {payoutMethod !== 'stripe' && (
              <p className="text-sm text-amber-600">
                You'll need to process this payment manually and then enter the transaction ID.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleProcessPayout}
              disabled={createPayoutMutation.isPending || processStripePayoutMutation.isPending}
            >
              {(createPayoutMutation.isPending || processStripePayoutMutation.isPending) && (
                <Loader2 className="animate-spin mr-2" size={16} />
              )}
              {payoutMethod === 'stripe' ? 'Send Stripe Payout' : 'Create Payout Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateCampaignDialog} onOpenChange={setShowCreateCampaignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Campaign Name</Label>
              <Input value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newCampaign.description} onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })} />
            </div>
            <div>
              <Label>Campaign Type</Label>
              <Select value={newCampaign.campaign_type} onValueChange={(v) => setNewCampaign({ ...newCampaign, campaign_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bonus_multiplier">Bonus Multiplier</SelectItem>
                  <SelectItem value="flat_bonus">Flat Bonus</SelectItem>
                  <SelectItem value="challenge">Challenge</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bonus Multiplier</Label>
                <Input type="number" step="0.1" value={newCampaign.bonus_multiplier} onChange={(e) => setNewCampaign({ ...newCampaign, bonus_multiplier: parseFloat(e.target.value) })} />
              </div>
              <div>
                <Label>Flat Bonus ($)</Label>
                <Input type="number" value={newCampaign.flat_bonus_amount} onChange={(e) => setNewCampaign({ ...newCampaign, flat_bonus_amount: parseFloat(e.target.value) })} />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="datetime-local" value={newCampaign.starts_at} onChange={(e) => setNewCampaign({ ...newCampaign, starts_at: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="datetime-local" value={newCampaign.ends_at} onChange={(e) => setNewCampaign({ ...newCampaign, ends_at: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCampaignDialog(false)}>Cancel</Button>
            <Button onClick={() => createCampaignMutation.mutate(newCampaign)}>Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}