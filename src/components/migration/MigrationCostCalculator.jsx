import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, Globe, Mail, Brain, CreditCard, Bell, 
  TrendingUp, DollarSign, Users, MessageSquare, Heart,
  Calculator, Sparkles, Server, Cloud
} from 'lucide-react';

const PRICING = {
  supabase: {
    free: { cost: 0, mau: 50000, storage: 1, bandwidth: 2, database: 0.5 },
    pro: { cost: 25, mau: 100000, storage: 100, bandwidth: 250, database: 8 },
    overages: { mau: 0.00325, storage: 0.021, bandwidth: 0.09 }
  },
  vercel: {
    hobby: { cost: 0, bandwidth: 100 },
    pro: { cost: 20, bandwidth: 1000 },
    overages: { bandwidth: 0.15 }
  },
  resend: {
    free: { cost: 0, emails: 3000 },
    pro: { cost: 20, emails: 50000 },
    scale: { cost: 90, emails: 500000 },
    overages: { email: 0.0004 }
  },
  openai: {
    mini: { input: 0.00015, output: 0.0006 }, // per 1K tokens
    standard: { input: 0.0025, output: 0.01 }
  },
  firebase: {
    free: { notifications: 10000 },
    perThousand: 0.01
  }
};

export default function MigrationCostCalculator() {
  const [users, setUsers] = useState(5000);
  const [monthlyActiveUsers, setMonthlyActiveUsers] = useState(3000);
  const [messagesPerDay, setMessagesPerDay] = useState(5000);
  const [matchesPerDay, setMatchesPerDay] = useState(200);
  const [aiCallsPerDay, setAiCallsPerDay] = useState(500);
  const [emailsPerMonth, setEmailsPerMonth] = useState(10000);
  const [storageGB, setStorageGB] = useState(20);
  const [useAdvancedAI, setUseAdvancedAI] = useState(false);

  const costs = useMemo(() => {
    // Supabase
    let supabaseCost = PRICING.supabase.pro.cost;
    if (monthlyActiveUsers > PRICING.supabase.pro.mau) {
      supabaseCost += (monthlyActiveUsers - PRICING.supabase.pro.mau) * PRICING.supabase.overages.mau;
    }
    if (storageGB > PRICING.supabase.pro.storage) {
      supabaseCost += (storageGB - PRICING.supabase.pro.storage) * PRICING.supabase.overages.storage;
    }
    // Estimate bandwidth: ~50KB per page view, 10 views/user/month
    const estimatedBandwidthGB = (monthlyActiveUsers * 10 * 0.05) / 1000;
    if (estimatedBandwidthGB > PRICING.supabase.pro.bandwidth) {
      supabaseCost += (estimatedBandwidthGB - PRICING.supabase.pro.bandwidth) * PRICING.supabase.overages.bandwidth;
    }

    // Vercel
    let vercelCost = PRICING.vercel.pro.cost;
    // Frontend bandwidth estimate
    const frontendBandwidthGB = (monthlyActiveUsers * 15 * 0.5) / 1000; // 500KB per visit, 15 visits
    if (frontendBandwidthGB > PRICING.vercel.pro.bandwidth) {
      vercelCost += (frontendBandwidthGB - PRICING.vercel.pro.bandwidth) * PRICING.vercel.overages.bandwidth;
    }

    // Resend
    let resendCost = 0;
    if (emailsPerMonth <= PRICING.resend.free.emails) {
      resendCost = 0;
    } else if (emailsPerMonth <= PRICING.resend.pro.emails) {
      resendCost = PRICING.resend.pro.cost;
    } else if (emailsPerMonth <= PRICING.resend.scale.emails) {
      resendCost = PRICING.resend.scale.cost;
    } else {
      resendCost = PRICING.resend.scale.cost + 
        (emailsPerMonth - PRICING.resend.scale.emails) * PRICING.resend.overages.email;
    }

    // OpenAI
    const aiModel = useAdvancedAI ? PRICING.openai.standard : PRICING.openai.mini;
    const monthlyAiCalls = aiCallsPerDay * 30;
    const avgTokensPerCall = 500; // input + output
    const openaiCost = monthlyAiCalls * avgTokensPerCall * (aiModel.input + aiModel.output) / 1000;

    // Firebase
    const notificationsPerMonth = (matchesPerDay + messagesPerDay * 0.3) * 30; // matches + some message notifs
    let firebaseCost = 0;
    if (notificationsPerMonth > PRICING.firebase.free.notifications * 30) {
      firebaseCost = ((notificationsPerMonth - PRICING.firebase.free.notifications * 30) / 1000) * PRICING.firebase.perThousand;
    }

    // Stripe (estimate based on conversions)
    const estimatedMonthlyRevenue = users * 0.05 * 15; // 5% convert at $15 avg
    const stripeFees = estimatedMonthlyRevenue * 0.029 + (users * 0.05 * 0.30);

    const total = supabaseCost + vercelCost + resendCost + openaiCost + firebaseCost;

    return {
      supabase: supabaseCost,
      vercel: vercelCost,
      resend: resendCost,
      openai: openaiCost,
      firebase: firebaseCost,
      stripe: stripeFees,
      total,
      estimatedRevenue: estimatedMonthlyRevenue
    };
  }, [users, monthlyActiveUsers, messagesPerDay, matchesPerDay, aiCallsPerDay, emailsPerMonth, storageGB, useAdvancedAI]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Calculator className="w-8 h-8 text-purple-600" />
          Migration Cost Calculator
        </h1>
        <p className="text-gray-500 mt-2">Estimate your monthly costs after migrating from Base44</p>
      </div>

      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          {/* Input Sliders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Total Registered Users</label>
                  <span className="text-sm font-bold text-purple-600">{users.toLocaleString()}</span>
                </div>
                <Slider
                  value={[users]}
                  onValueChange={(v) => setUsers(v[0])}
                  min={100}
                  max={100000}
                  step={100}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Monthly Active Users (MAU)</label>
                  <span className="text-sm font-bold text-purple-600">{monthlyActiveUsers.toLocaleString()}</span>
                </div>
                <Slider
                  value={[monthlyActiveUsers]}
                  onValueChange={(v) => setMonthlyActiveUsers(v[0])}
                  min={100}
                  max={50000}
                  step={100}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Activity Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Messages per Day</label>
                  <span className="text-sm font-bold text-purple-600">{messagesPerDay.toLocaleString()}</span>
                </div>
                <Slider
                  value={[messagesPerDay]}
                  onValueChange={(v) => setMessagesPerDay(v[0])}
                  min={100}
                  max={50000}
                  step={100}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Matches per Day</label>
                  <span className="text-sm font-bold text-purple-600">{matchesPerDay.toLocaleString()}</span>
                </div>
                <Slider
                  value={[matchesPerDay]}
                  onValueChange={(v) => setMatchesPerDay(v[0])}
                  min={10}
                  max={2000}
                  step={10}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">AI Calls per Day</label>
                  <span className="text-sm font-bold text-purple-600">{aiCallsPerDay.toLocaleString()}</span>
                </div>
                <Slider
                  value={[aiCallsPerDay]}
                  onValueChange={(v) => setAiCallsPerDay(v[0])}
                  min={0}
                  max={5000}
                  step={50}
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="advancedAI"
                    checked={useAdvancedAI}
                    onChange={(e) => setUseAdvancedAI(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="advancedAI" className="text-sm text-gray-600">
                    Use GPT-4o instead of GPT-4o-mini (10x more expensive)
                  </label>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Emails per Month</label>
                  <span className="text-sm font-bold text-purple-600">{emailsPerMonth.toLocaleString()}</span>
                </div>
                <Slider
                  value={[emailsPerMonth]}
                  onValueChange={(v) => setEmailsPerMonth(v[0])}
                  min={0}
                  max={100000}
                  step={1000}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Storage (GB) - Photos, Videos</label>
                  <span className="text-sm font-bold text-purple-600">{storageGB} GB</span>
                </div>
                <Slider
                  value={[storageGB]}
                  onValueChange={(v) => setStorageGB(v[0])}
                  min={1}
                  max={500}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                Estimated Monthly Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-purple-600 mb-2">
                  {formatCurrency(costs.total)}
                </div>
                <p className="text-gray-600">per month</p>
                
                {costs.estimatedRevenue > 0 && (
                  <div className="mt-4 p-4 bg-white rounded-lg">
                    <p className="text-sm text-gray-500">Estimated Revenue (5% conversion @ $15/mo avg)</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(costs.estimatedRevenue)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Profit Margin: <span className="font-bold text-green-600">
                        {((1 - (costs.total + costs.stripe) / costs.estimatedRevenue) * 100).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4">
            {/* Supabase */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Database className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Supabase</h3>
                      <p className="text-sm text-gray-500">Database, Auth, Storage, Realtime</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{formatCurrency(costs.supabase)}</p>
                    <Badge variant="outline" className="text-green-600">Pro Plan</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vercel */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-black rounded-lg">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Vercel</h3>
                      <p className="text-sm text-gray-500">Frontend Hosting, Edge Functions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{formatCurrency(costs.vercel)}</p>
                    <Badge variant="outline">Pro Plan</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resend */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Resend</h3>
                      <p className="text-sm text-gray-500">Transactional Emails</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{formatCurrency(costs.resend)}</p>
                    <Badge variant="outline" className="text-blue-600">
                      {emailsPerMonth <= 3000 ? 'Free' : emailsPerMonth <= 50000 ? 'Pro' : 'Scale'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* OpenAI */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Brain className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">OpenAI</h3>
                      <p className="text-sm text-gray-500">AI Features ({useAdvancedAI ? 'GPT-4o' : 'GPT-4o-mini'})</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{formatCurrency(costs.openai)}</p>
                    <Badge variant="outline" className="text-purple-600">Pay-as-you-go</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Firebase */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Bell className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Firebase FCM</h3>
                      <p className="text-sm text-gray-500">Push Notifications</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{formatCurrency(costs.firebase)}</p>
                    <Badge variant="outline" className="text-orange-600">
                      {costs.firebase === 0 ? 'Free Tier' : 'Blaze'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stripe */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Stripe Fees</h3>
                      <p className="text-sm text-gray-500">2.9% + $0.30 per transaction</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{formatCurrency(costs.stripe)}</p>
                    <Badge variant="outline" className="text-indigo-600">Per Transaction</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total */}
            <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Total Infrastructure Cost</h3>
                      <p className="text-sm text-white/70">Excluding Stripe (deducted from revenue)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{formatCurrency(costs.total)}</p>
                    <p className="text-sm text-white/70">/month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Comparison with Base44 */}
      <Card className="border-2 border-dashed border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Base44 vs Self-Hosted Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-500">Base44 (estimated)</p>
              <p className="text-2xl font-bold text-gray-700">
                {formatCurrency(Math.max(29, users * 0.01))}
              </p>
              <p className="text-xs text-gray-400">+ platform lock-in</p>
            </div>
            <div className="p-4 bg-purple-100 rounded-lg">
              <p className="text-sm text-purple-600">Self-Hosted</p>
              <p className="text-2xl font-bold text-purple-700">
                {formatCurrency(costs.total)}
              </p>
              <p className="text-xs text-purple-500">Full ownership</p>
            </div>
            <div className="p-4 bg-green-100 rounded-lg">
              <p className="text-sm text-green-600">Savings</p>
              <p className="text-2xl font-bold text-green-700">
                {costs.total < Math.max(29, users * 0.01) ? formatCurrency(Math.max(29, users * 0.01) - costs.total) : 'N/A'}
              </p>
              <p className="text-xs text-green-500">/month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}