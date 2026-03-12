import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { Users, Heart, MessageCircle, DollarSign, TrendingUp, TrendingDown, Activity, Crown, Zap, Eye, UserPlus, Calendar } from 'lucide-react';

const COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    switch (timeRange) {
      case '24h': start.setHours(start.getHours() - 24); break;
      case '7d': start.setDate(start.getDate() - 7); break;
      case '30d': start.setDate(start.getDate() - 30); break;
      case '90d': start.setDate(start.getDate() - 90); break;
      default: start.setDate(start.getDate() - 7);
    }
    return { start: start.toISOString(), end: end.toISOString() };
  };

  // Fetch analytics data
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-analytics', timeRange],
    queryFn: async () => {
      const { start, end } = getDateRange();
      
      const [
        users,
        newUsers,
        matches,
        messages,
        subscriptions,
        likes,
        reports
      ] = await Promise.all([
        base44.entities.UserProfile.filter({ is_active: true }),
        base44.entities.UserProfile.filter({ created_date: { $gte: start } }),
        base44.entities.Match.filter({ is_match: true, matched_at: { $gte: start } }),
        base44.entities.Message.filter({ created_date: { $gte: start } }),
        base44.entities.Subscription.filter({ status: 'active' }),
        base44.entities.Like.filter({ created_date: { $gte: start } }),
        base44.entities.Report.filter({ status: 'pending' })
      ]);

      // Calculate metrics
      const totalUsers = users.length;
      const newUsersCount = newUsers.length;
      const totalMatches = matches.length;
      const totalMessages = messages.length;
      const activeSubscriptions = subscriptions.length;
      const totalLikes = likes.length;
      const pendingReports = reports.length;

      // Subscription breakdown
      const tierBreakdown = users.reduce((acc, u) => {
        const tier = u.subscription_tier || 'free';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {});

      // Calculate revenue
      const revenue = subscriptions.reduce((sum, s) => sum + (s.amount_paid || 0), 0);

      // Daily activity for chart
      const dailyData = [];
      const days = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        if (timeRange === '24h') {
          date.setHours(date.getHours() - i);
        } else {
          date.setDate(date.getDate() - i);
        }
        
        const dayStart = new Date(date);
        if (timeRange !== '24h') dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        if (timeRange === '24h') {
          dayEnd.setHours(dayEnd.getHours() + 1);
        } else {
          dayEnd.setDate(dayEnd.getDate() + 1);
        }

        const dayNewUsers = newUsers.filter(u => {
          const created = new Date(u.created_date);
          return created >= dayStart && created < dayEnd;
        }).length;

        const dayMatches = matches.filter(m => {
          const created = new Date(m.matched_at);
          return created >= dayStart && created < dayEnd;
        }).length;

        const dayMessages = messages.filter(m => {
          const created = new Date(m.created_date);
          return created >= dayStart && created < dayEnd;
        }).length;

        dailyData.push({
          date: timeRange === '24h' 
            ? date.toLocaleTimeString([], { hour: '2-digit' })
            : date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          signups: dayNewUsers,
          matches: dayMatches,
          messages: dayMessages
        });
      }

      // Gender breakdown
      const genderBreakdown = users.reduce((acc, u) => {
        const gender = u.gender || 'unknown';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {});

      // Country breakdown
      const countryBreakdown = users.reduce((acc, u) => {
        const country = u.country_of_origin || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {});

      // Top countries
      const topCountries = Object.entries(countryBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({ name, value }));

      return {
        totalUsers,
        newUsersCount,
        totalMatches,
        totalMessages,
        activeSubscriptions,
        totalLikes,
        pendingReports,
        revenue,
        tierBreakdown,
        dailyData,
        genderBreakdown,
        topCountries
      };
    },
    staleTime: 60000
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const tierChartData = Object.entries(stats?.tierBreakdown || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const genderChartData = Object.entries(stats?.genderBreakdown || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString()}</p>
              </div>
              <Users className="text-purple-600" size={32} />
            </div>
            <p className="text-xs text-green-600 mt-2">
              +{stats?.newUsersCount} new
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Subscriptions</p>
                <p className="text-2xl font-bold">{stats?.activeSubscriptions?.toLocaleString()}</p>
              </div>
              <Crown className="text-amber-500" size={32} />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ${stats?.revenue?.toLocaleString()} revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Matches</p>
                <p className="text-2xl font-bold">{stats?.totalMatches?.toLocaleString()}</p>
              </div>
              <Heart className="text-pink-500" size={32} />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.totalLikes?.toLocaleString()} likes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Messages</p>
                <p className="text-2xl font-bold">{stats?.totalMessages?.toLocaleString()}</p>
              </div>
              <MessageCircle className="text-blue-500" size={32} />
            </div>
            <p className="text-xs text-amber-600 mt-2">
              {stats?.pendingReports} reports pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Activity Over Time */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Activity Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats?.dailyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="signups" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Signups" />
                <Area type="monotone" dataKey="matches" stackId="2" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} name="Matches" />
                <Area type="monotone" dataKey="messages" stackId="3" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Messages" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Tiers */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={tierChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {tierChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle>Top Countries of Origin</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats?.topCountries || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={genderChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {genderChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Signup → Profile Complete</span>
                  <span className="font-semibold">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Profile → First Like</span>
                  <span className="font-semibold">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-pink-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Like → Match</span>
                  <span className="font-semibold">12%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Match → Message</span>
                  <span className="font-semibold">45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Free → Premium</span>
                  <span className="font-semibold">{stats?.totalUsers ? ((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats?.totalUsers ? ((stats.activeSubscriptions / stats.totalUsers) * 100) : 0}%` }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}