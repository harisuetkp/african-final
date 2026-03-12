import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Crown, Users, DollarSign, TrendingUp, Copy, QrCode, Share2, 
  Clock, CheckCircle, Wallet, ArrowRight, Download, Gift, Target,
  BarChart3, Calendar, ExternalLink, Loader2, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AmbassadorPortal() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data, isLoading, error } = useQuery({
    queryKey: ['ambassador-portal'],
    queryFn: async () => {
      const response = await base44.functions.invoke('ambassadorGetPortalData', {});
      if (response.data.error) throw new Error(response.data.error);
      return response.data;
    }
  });

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Link to={createPageUrl('Home')}>
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { ambassador, stats, earnings, commission_plan, recent_activity, payouts, active_campaigns, content_assets, next_payout_date, payout_eligible } = data;

  const tierColors = {
    bronze: 'bg-amber-700',
    silver: 'bg-gray-400',
    gold: 'bg-yellow-500',
    platinum: 'bg-purple-600'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-700 to-amber-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Crown size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{ambassador.display_name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${tierColors[ambassador.tier]} text-white`}>
                    {ambassador.tier.charAt(0).toUpperCase() + ambassador.tier.slice(1)} Ambassador
                  </Badge>
                  <span className="text-white/80">@{ambassador.handle}</span>
                </div>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-white/80 text-sm">Total Earned</p>
              <p className="text-3xl font-bold">${earnings.total_earned.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Signups</p>
                  <p className="text-2xl font-bold">{stats.total_signups}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Subscribers</p>
                  <p className="text-2xl font-bold">{stats.total_subscribers}</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Conversion</p>
                  <p className="text-2xl font-bold">{stats.conversion_rate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Revenue Generated</p>
                  <p className="text-2xl font-bold">${stats.total_revenue_generated.toFixed(0)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="referrals">Referral Tools</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Earnings Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-600" />
                    Earnings Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span>Pending</span>
                    </div>
                    <span className="font-bold">${earnings.pending.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Available for Payout</span>
                    </div>
                    <span className="font-bold text-green-600">${earnings.approved.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-600" />
                      <span>Total Paid</span>
                    </div>
                    <span className="font-bold">${earnings.paid.toFixed(2)}</span>
                  </div>
                  
                  {earnings.founding_members_pending > 0 && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-700">
                        <Gift className="inline h-4 w-4 mr-1" />
                        {earnings.founding_members_pending} Founding Members in pipeline
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        Potential future earnings: ~${earnings.potential_pipeline.toFixed(0)}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-2">Next payout: {format(new Date(next_payout_date), 'MMM d, yyyy')}</p>
                    {payout_eligible ? (
                      <Badge className="bg-green-600">Eligible for Payout</Badge>
                    ) : (
                      <p className="text-xs text-gray-400">Min ${ambassador.payout_threshold || 50} required</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Commission Plan */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Your Commission Plan
                  </CardTitle>
                  <CardDescription>{commission_plan?.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {commission_plan?.cpa_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Per Subscriber (CPA)</span>
                      <span className="font-bold">${commission_plan.cpa_amount}</span>
                    </div>
                  )}
                  {commission_plan?.revenue_share_pct > 0 && (
                    <div className="flex justify-between">
                      <span>Revenue Share</span>
                      <span className="font-bold">{commission_plan.revenue_share_pct}%</span>
                    </div>
                  )}
                  {commission_plan?.recurring_share_pct > 0 && (
                    <div className="flex justify-between">
                      <span>Recurring ({commission_plan.recurring_months} mo)</span>
                      <span className="font-bold">{commission_plan.recurring_share_pct}%</span>
                    </div>
                  )}
                  {commission_plan?.activation_bonus > 0 && (
                    <div className="flex justify-between">
                      <span>Activation Bonus</span>
                      <span className="font-bold">${commission_plan.activation_bonus}</span>
                    </div>
                  )}
                  {commission_plan?.tier_multiplier > 1 && (
                    <div className="flex justify-between text-purple-600">
                      <span>Your Tier Multiplier</span>
                      <span className="font-bold">{commission_plan.tier_multiplier}x</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Active Campaigns */}
            {active_campaigns?.length > 0 && (
              <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Gift className="h-5 w-5" />
                    Active Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {active_campaigns.map(campaign => (
                      <div key={campaign.id} className="p-4 bg-white rounded-lg border border-amber-200">
                        <h4 className="font-bold text-amber-900">{campaign.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                        {campaign.bonus_multiplier && (
                          <Badge className="mt-2 bg-amber-600">{campaign.bonus_multiplier}x Bonus</Badge>
                        )}
                        {campaign.flat_bonus_amount && (
                          <Badge className="mt-2 bg-amber-600">+${campaign.flat_bonus_amount} per conversion</Badge>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Ends {format(new Date(campaign.ends_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recent_activity?.length > 0 ? (
                  <div className="space-y-2">
                    {recent_activity.slice(0, 10).map(event => (
                      <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">{event.event_type}</Badge>
                          <span className="text-sm text-gray-500">{event.user_ref}</span>
                        </div>
                        <div className="text-right">
                          {event.revenue_amount > 0 && (
                            <span className="text-green-600 font-medium">${event.revenue_amount}</span>
                          )}
                          <span className="text-xs text-gray-400 ml-2">
                            {format(new Date(event.created_date), 'MMM d')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No activity yet. Start sharing your referral link!</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referral Tools Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Referral Link & Code</CardTitle>
                <CardDescription>Share these to earn commissions on every signup and subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Referral Link (with code)</label>
                  <div className="flex gap-2 mt-1">
                    <input 
                      type="text" 
                      readOnly 
                      value={`https://afrinnect.com/Onboarding?a=${ambassador.referral_code}`}
                      className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                    />
                    <Button onClick={() => copyToClipboard(`https://afrinnect.com/Onboarding?a=${ambassador.referral_code}`, 'Link')}>
                      <Copy size={16} className="mr-2" /> Copy
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Share this link - the code is automatically applied!</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Referral Code (manual entry)</label>
                  <div className="flex gap-2 mt-1">
                    <input 
                      type="text" 
                      readOnly 
                      value={ambassador.referral_code}
                      className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 font-mono text-lg"
                    />
                    <Button onClick={() => copyToClipboard(ambassador.referral_code, 'Code')}>
                      <Copy size={16} className="mr-2" /> Copy
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Users can enter this code during signup</p>
                </div>

                {ambassador.qr_code_url && (
                  <div className="text-center pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">QR Code</p>
                    <img src={ambassador.qr_code_url} alt="QR Code" className="mx-auto w-48 h-48 border rounded-lg" />
                    <Button variant="outline" size="sm" className="mt-2">
                      <Download size={16} className="mr-2" /> Download QR
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-4">
                  <Button variant="outline" className="flex-col h-auto py-3" onClick={() => {
                    window.open(`https://twitter.com/intent/tweet?text=Join%20me%20on%20Afrinnect!%20${encodeURIComponent(ambassador.referral_link)}`, '_blank');
                  }}>
                    <Share2 size={20} />
                    <span className="text-xs mt-1">Twitter</span>
                  </Button>
                  <Button variant="outline" className="flex-col h-auto py-3" onClick={() => {
                    window.open(`https://wa.me/?text=Join%20me%20on%20Afrinnect!%20${encodeURIComponent(ambassador.referral_link)}`, '_blank');
                  }}>
                    <Share2 size={20} />
                    <span className="text-xs mt-1">WhatsApp</span>
                  </Button>
                  <Button variant="outline" className="flex-col h-auto py-3" onClick={() => {
                    navigator.share?.({ title: 'Join Afrinnect', url: ambassador.referral_link });
                  }}>
                    <Share2 size={20} />
                    <span className="text-xs mt-1">Share</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Your Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Link Clicks</span>
                      <span className="font-bold">{stats.total_clicks}</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Signups</span>
                      <span className="font-bold">{stats.total_signups}</span>
                    </div>
                    <Progress value={stats.total_clicks > 0 ? (stats.total_signups / stats.total_clicks * 100) : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Activated</span>
                      <span className="font-bold">{stats.total_activations}</span>
                    </div>
                    <Progress value={stats.total_signups > 0 ? (stats.total_activations / stats.total_signups * 100) : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Subscribed</span>
                      <span className="font-bold">{stats.total_subscribers}</span>
                    </div>
                    <Progress value={stats.total_activations > 0 ? (stats.total_subscribers / stats.total_activations * 100) : 0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
              </CardHeader>
              <CardContent>
                {payouts?.length > 0 ? (
                  <div className="space-y-2">
                    {payouts.map(payout => (
                      <div key={payout.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">${payout.total_amount.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(payout.period_start), 'MMM d')} - {format(new Date(payout.period_end), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge className={
                          payout.status === 'paid' ? 'bg-green-600' :
                          payout.status === 'processing' ? 'bg-blue-600' :
                          payout.status === 'failed' ? 'bg-red-600' : 'bg-gray-400'
                        }>
                          {payout.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No payouts yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Creator Content Library</CardTitle>
                <CardDescription>Download brand assets, scripts, and marketing materials</CardDescription>
              </CardHeader>
              <CardContent>
                {content_assets?.length > 0 ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    {content_assets.map(asset => (
                      <div key={asset.id} className="border rounded-lg p-4">
                        {asset.thumbnail_url && (
                          <img src={asset.thumbnail_url} alt={asset.name} className="w-full h-32 object-cover rounded mb-2" />
                        )}
                        <h4 className="font-medium">{asset.name}</h4>
                        <p className="text-sm text-gray-500">{asset.description}</p>
                        <Badge variant="outline" className="mt-2">{asset.asset_type}</Badge>
                        {asset.file_url && (
                          <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                            <a href={asset.file_url} target="_blank" rel="noopener noreferrer">
                              <Download size={14} className="mr-1" /> Download
                            </a>
                          </Button>
                        )}
                        {asset.content_text && (
                          <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => copyToClipboard(asset.content_text, 'Content')}>
                            <Copy size={14} className="mr-1" /> Copy Text
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No content assets available yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}