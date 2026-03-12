import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  TrendingUp, Users, Heart, MessageSquare, DollarSign, 
  Calendar, RefreshCw, Download, ArrowUp, ArrowDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [metrics, setMetrics] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [demographics, setDemographics] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) loadAnalytics();
  }, [period, user]);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser || currentUser.role !== 'admin') {
        navigate(createPageUrl('Home'));
        return;
      }
      setUser(currentUser);
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [profiles, matches, messages, likes, subscriptions] = await Promise.all([
        base44.entities.UserProfile.list('-created_date', 2000),
        base44.entities.Match.filter({ is_match: true }, '-created_date', 2000),
        base44.entities.Message.list('-created_date', 5000),
        base44.entities.Like.list('-created_date', 5000),
        base44.entities.Subscription.filter({ status: 'active' }, '-created_date', 500)
      ]);

      const now = new Date();
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // Calculate daily metrics
      const dailyData = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const daySignups = profiles.filter(p => {
          const d = new Date(p.created_date);
          return d >= dayStart && d < dayEnd;
        }).length;

        const dayMatches = matches.filter(m => {
          const d = new Date(m.created_date);
          return d >= dayStart && d < dayEnd;
        }).length;

        const dayMessages = messages.filter(m => {
          const d = new Date(m.created_date);
          return d >= dayStart && d < dayEnd;
        }).length;

        const dayLikes = likes.filter(l => {
          const d = new Date(l.created_date);
          return d >= dayStart && d < dayEnd;
        }).length;

        const dayActive = profiles.filter(p => {
          if (!p.last_active) return false;
          const d = new Date(p.last_active);
          return d >= dayStart && d < dayEnd;
        }).length;

        dailyData.push({
          date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          signups: daySignups,
          matches: dayMatches,
          messages: dayMessages,
          likes: dayLikes,
          dau: dayActive
        });
      }

      setChartData(dailyData);

      // Calculate period metrics
      const periodProfiles = profiles.filter(p => new Date(p.created_date) >= startDate);
      const periodMatches = matches.filter(m => new Date(m.created_date) >= startDate);
      const periodMessages = messages.filter(m => new Date(m.created_date) >= startDate);
      const previousStart = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
      
      const prevPeriodProfiles = profiles.filter(p => {
        const d = new Date(p.created_date);
        return d >= previousStart && d < startDate;
      });

      // Calculate growth rates
      const signupGrowth = prevPeriodProfiles.length > 0 
        ? ((periodProfiles.length - prevPeriodProfiles.length) / prevPeriodProfiles.length * 100).toFixed(1)
        : 0;

      // Calculate averages
      const avgDailySignups = (periodProfiles.length / days).toFixed(1);
      const avgDailyMatches = (periodMatches.length / days).toFixed(1);
      const avgDailyMessages = (periodMessages.length / days).toFixed(1);

      // DAU / MAU
      const dauProfiles = profiles.filter(p => {
        if (!p.last_active) return false;
        return new Date(p.last_active) >= new Date(now.getTime() - 24 * 60 * 60 * 1000);
      });
      const mauProfiles = profiles.filter(p => {
        if (!p.last_active) return false;
        return new Date(p.last_active) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      });

      // Conversion funnel
      const matchedUsers = new Set(matches.flatMap(m => [m.user1_id, m.user2_id]));
      const messagedUsers = new Set(messages.map(m => m.sender_id));
      const premiumUsers = profiles.filter(p => p.is_premium);

      setMetrics({
        totalUsers: profiles.length,
        newUsers: periodProfiles.length,
        signupGrowth: parseFloat(signupGrowth),
        avgDailySignups: parseFloat(avgDailySignups),
        totalMatches: matches.length,
        periodMatches: periodMatches.length,
        avgDailyMatches: parseFloat(avgDailyMatches),
        totalMessages: messages.length,
        periodMessages: periodMessages.length,
        avgDailyMessages: parseFloat(avgDailyMessages),
        dau: dauProfiles.length,
        mau: mauProfiles.length,
        dauMauRatio: mauProfiles.length > 0 ? ((dauProfiles.length / mauProfiles.length) * 100).toFixed(1) : 0,
        premiumUsers: premiumUsers.length,
        conversionRate: profiles.length > 0 ? ((premiumUsers.length / profiles.length) * 100).toFixed(2) : 0,
        matchRate: profiles.length > 0 ? ((matchedUsers.size / profiles.length) * 100).toFixed(1) : 0,
        messageRate: matchedUsers.size > 0 ? ((messagedUsers.size / matchedUsers.size) * 100).toFixed(1) : 0,
        revenue: subscriptions.reduce((sum, s) => sum + (s.amount_paid || 0), 0)
      });

      // Demographics
      const genderDist = {};
      const countryDist = {};
      const religionDist = {};
      const goalDist = {};
      const tierDist = { free: 0, premium: 0, elite: 0, vip: 0 };

      profiles.forEach(p => {
        genderDist[p.gender] = (genderDist[p.gender] || 0) + 1;
        countryDist[p.country_of_origin] = (countryDist[p.country_of_origin] || 0) + 1;
        if (p.religion) religionDist[p.religion] = (religionDist[p.religion] || 0) + 1;
        if (p.relationship_goal) goalDist[p.relationship_goal] = (goalDist[p.relationship_goal] || 0) + 1;
        tierDist[p.subscription_tier || 'free']++;
      });

      setDemographics({
        gender: Object.entries(genderDist).map(([name, value]) => ({ name, value })),
        countries: Object.entries(countryDist)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, value]) => ({ name, value })),
        religion: Object.entries(religionDist)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, value]) => ({ name: name.replace('_', ' '), value })),
        goals: Object.entries(goalDist).map(([name, value]) => ({ name: name.replace('_', ' '), value })),
        tiers: Object.entries(tierDist).map(([name, value]) => ({ name, value }))
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    }
    setLoading(false);
  };

  const COLORS = ['#f97316', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar activePage="AdminAnalytics" />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Analytics</h1>
              <p className="text-sm text-slate-400">Platform performance metrics</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                className="border-slate-700 text-slate-300"
                onClick={() => {
                  const csv = [
                    ['Date', 'Signups', 'DAU', 'Matches', 'Likes', 'Messages'].join(','),
                    ...chartData.map(d => [d.date, d.signups, d.dau, d.matches, d.likes, d.messages].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `analytics-export-${period}-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-white">{metrics?.totalUsers?.toLocaleString()}</p>
                    <div className="flex items-center gap-1 text-sm">
                      {metrics?.signupGrowth >= 0 ? (
                        <ArrowUp className="w-3 h-3 text-green-400" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-red-400" />
                      )}
                      <span className={metrics?.signupGrowth >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {Math.abs(metrics?.signupGrowth)}%
                      </span>
                      <span className="text-slate-500">vs prev</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">DAU / MAU</p>
                    <p className="text-2xl font-bold text-white">{metrics?.dau} / {metrics?.mau}</p>
                    <p className="text-green-400 text-sm">{metrics?.dauMauRatio}% stickiness</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-400" />
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
                    <DollarSign className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">${metrics?.revenue?.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">All time</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* User Growth */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                      labelStyle={{ color: '#f8fafc' }}
                    />
                    <Area type="monotone" dataKey="signups" stroke="#f97316" fill="url(#signupGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Daily Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                      labelStyle={{ color: '#f8fafc' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="dau" name="DAU" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="matches" name="Matches" stroke="#ec4899" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="likes" name="Likes" stroke="#f97316" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Funnel Metrics */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {[
                  { label: 'Total Users', value: metrics?.totalUsers, pct: '100%' },
                  { label: 'Matched', value: Math.round(metrics?.totalUsers * (metrics?.matchRate / 100)), pct: `${metrics?.matchRate}%` },
                  { label: 'Messaged', value: Math.round(metrics?.totalUsers * (metrics?.matchRate / 100) * (metrics?.messageRate / 100)), pct: `${metrics?.messageRate}%` },
                  { label: 'Premium', value: metrics?.premiumUsers, pct: `${metrics?.conversionRate}%` },
                ].map((step, i, arr) => (
                  <React.Fragment key={i}>
                    <div className="flex-1 text-center">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center mb-2">
                        <span className="text-2xl font-bold text-white">{step.value?.toLocaleString()}</span>
                      </div>
                      <p className="text-white font-medium">{step.label}</p>
                      <p className="text-orange-400 text-sm">{step.pct}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="w-16 h-0.5 bg-gradient-to-r from-orange-500 to-pink-500" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Demographics */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Gender Distribution */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={demographics?.gender || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(demographics?.gender || []).map((entry, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Subscription Tiers */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Subscription Tiers</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={demographics?.tiers || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(demographics?.tiers || []).map((entry, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Countries */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Top Countries</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={(demographics?.countries || []).slice(0, 5)} layout="vertical">
                    <XAxis type="number" stroke="#64748b" />
                    <YAxis dataKey="name" type="category" stroke="#64748b" width={80} fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}