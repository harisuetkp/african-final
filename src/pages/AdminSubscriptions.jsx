import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  DollarSign, TrendingUp, Users, Crown, RefreshCw, Download,
  Calendar, ArrowUp, ArrowDown, CreditCard, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import RefundsManager from "@/components/admin/RefundsManager";

export default function AdminSubscriptions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [period, setPeriod] = useState("30d");

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
      await loadData();
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [subs, profs] = await Promise.all([
        base44.entities.Subscription.list('-created_date', 500),
        base44.entities.UserProfile.list('-created_date', 2000)
      ]);
      setSubscriptions(subs);
      setProfiles(profs);

      // Calculate metrics
      const activeSubs = subs.filter(s => s.status === 'active');
      const totalRevenue = subs.reduce((sum, s) => sum + (s.amount_paid || 0), 0);
      const mrr = activeSubs.reduce((sum, s) => {
        // Estimate monthly value
        if (s.plan_type?.includes('yearly')) return sum + (s.amount_paid || 0) / 12;
        if (s.plan_type?.includes('quarterly')) return sum + (s.amount_paid || 0) / 3;
        if (s.plan_type?.includes('6months')) return sum + (s.amount_paid || 0) / 6;
        return sum + (s.amount_paid || 0);
      }, 0);

      const premiumCount = profs.filter(p => p.is_premium).length;
      const conversionRate = profs.length > 0 ? (premiumCount / profs.length * 100).toFixed(2) : 0;

      // Tier distribution
      const tierDist = { premium: 0, elite: 0, vip: 0 };
      activeSubs.forEach(s => {
        if (s.plan_type?.includes('vip')) tierDist.vip++;
        else if (s.plan_type?.includes('elite')) tierDist.elite++;
        else if (s.plan_type?.includes('premium')) tierDist.premium++;
      });

      // Churn (cancelled in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const cancelled = subs.filter(s => 
        s.status === 'cancelled' && 
        new Date(s.updated_date) >= thirtyDaysAgo
      ).length;
      const churnRate = activeSubs.length > 0 ? (cancelled / (activeSubs.length + cancelled) * 100).toFixed(1) : 0;

      setMetrics({
        totalRevenue,
        mrr,
        activeSubs: activeSubs.length,
        premiumUsers: premiumCount,
        conversionRate,
        churnRate,
        tierDist,
        avgRevPerUser: premiumCount > 0 ? (totalRevenue / premiumCount).toFixed(2) : 0
      });

    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const COLORS = ['#f97316', '#8b5cf6', '#ec4899'];
  const tierData = metrics ? [
    { name: 'Premium', value: metrics.tierDist.premium },
    { name: 'Elite', value: metrics.tierDist.elite },
    { name: 'VIP', value: metrics.tierDist.vip }
  ].filter(t => t.value > 0) : [];

  // Recent subscriptions
  const recentSubs = subscriptions.slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar activePage="AdminSubscriptions" />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Subscriptions & Revenue</h1>
              <p className="text-sm text-slate-400">Track monetization metrics</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="border-slate-700 text-slate-300"
                onClick={() => {
                  const csv = [
                    ['User', 'Plan', 'Status', 'Amount', 'Start Date', 'End Date'].join(','),
                    ...subscriptions.map(s => {
                      const profile = profiles.find(p => p.id === s.user_profile_id);
                      return [
                        `"${profile?.display_name || 'Unknown'}"`,
                        s.plan_type || '',
                        s.status || '',
                        s.amount_paid || 0,
                        s.start_date ? new Date(s.start_date).toLocaleDateString() : '',
                        s.end_date ? new Date(s.end_date).toLocaleDateString() : ''
                      ].join(',');
                    })
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `subscriptions-export-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button onClick={loadData} className="bg-orange-500 hover:bg-orange-600">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="refunds">Refunds</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">${metrics?.totalRevenue?.toLocaleString()}</p>
                    <p className="text-green-400 text-sm">All time</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">MRR</p>
                    <p className="text-2xl font-bold text-white">${metrics?.mrr?.toFixed(0)}</p>
                    <p className="text-slate-400 text-sm">Monthly recurring</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Conversion Rate</p>
                    <p className="text-2xl font-bold text-white">{metrics?.conversionRate}%</p>
                    <p className="text-orange-400 text-sm">{metrics?.premiumUsers} premium</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Churn Rate</p>
                    <p className="text-2xl font-bold text-white">{metrics?.churnRate}%</p>
                    <p className="text-slate-400 text-sm">Last 30 days</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <ArrowDown className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Tier Distribution */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {tierData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={tierData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {tierData.map((entry, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-slate-400">
                    No subscription data
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Subscriptions */}
            <Card className="bg-slate-900 border-slate-800 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Recent Subscriptions</CardTitle>
                <Badge className="bg-green-500">{metrics?.activeSubs} active</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentSubs.map((sub) => {
                    const profile = profiles.find(p => p.id === sub.user_profile_id);
                    return (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={profile?.primary_photo} />
                            <AvatarFallback className="bg-slate-700">
                              {profile?.display_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{profile?.display_name || 'Unknown'}</p>
                            <p className="text-slate-400 text-sm capitalize">
                              {sub.plan_type?.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">${sub.amount_paid || 0}</p>
                          <Badge className={sub.status === 'active' ? 'bg-green-500' : 'bg-slate-500'}>
                            {sub.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 text-center">
                <Crown className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{metrics?.tierDist?.premium || 0}</p>
                <p className="text-slate-400 text-sm">Premium</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 text-center">
                <Crown className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{metrics?.tierDist?.elite || 0}</p>
                <p className="text-slate-400 text-sm">Elite</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 text-center">
                <Crown className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{metrics?.tierDist?.vip || 0}</p>
                <p className="text-slate-400 text-sm">VIP</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 text-center">
                <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">${metrics?.avgRevPerUser}</p>
                <p className="text-slate-400 text-sm">Avg Revenue/User</p>
              </CardContent>
            </Card>
          </div>
            </TabsContent>

            <TabsContent value="refunds" className="mt-6">
              <RefundsManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}