import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Users, Heart, DollarSign, Activity } from 'lucide-react';

export default function RobustAnalyticsDashboard() {
  // Fetch all analytics data
  const { data: analytics = [] } = useQuery({
    queryKey: ['robust-analytics'],
    queryFn: () => base44.entities.ProfileAnalytics.list('-created_date', 10000),
    refetchInterval: 60000 // Refresh every minute
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['analytics-profiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 5000)
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['analytics-subscriptions'],
    queryFn: () => base44.entities.Subscription.filter({ status: 'active' })
  });

  // Process analytics by event type
  const eventsByType = analytics.reduce((acc, item) => {
    if (item.event_type) {
      acc[item.event_type] = (acc[item.event_type] || 0) + 1;
    }
    return acc;
  }, {});

  // User activity over time
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const activityByDay = last30Days.map(date => {
    const dayAnalytics = analytics.filter(a => 
      a.created_date?.startsWith(date)
    );
    
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: dayAnalytics.filter(a => a.event_type?.includes('view')).length,
      likes: dayAnalytics.filter(a => a.event_type?.includes('like')).length,
      matches: dayAnalytics.filter(a => a.event_type?.includes('match')).length,
      messages: dayAnalytics.filter(a => a.event_type?.includes('message')).length
    };
  });

  // Conversion funnel
  const funnelData = [
    { stage: 'Signups', count: profiles.length, percentage: 100 },
    { 
      stage: 'Profile Complete', 
      count: profiles.filter(p => p.photos?.length >= 3).length,
      percentage: ((profiles.filter(p => p.photos?.length >= 3).length / profiles.length) * 100).toFixed(1)
    },
    {
      stage: 'First Match',
      count: profiles.filter(p => p.has_matched_before).length,
      percentage: ((profiles.filter(p => p.has_matched_before).length / profiles.length) * 100).toFixed(1)
    },
    {
      stage: 'Premium',
      count: subscriptions.length,
      percentage: ((subscriptions.length / profiles.length) * 100).toFixed(1)
    }
  ];

  // Subscription distribution
  const tierDistribution = [
    { name: 'Free', value: profiles.filter(p => !p.subscription_tier || p.subscription_tier === 'free').length },
    { name: 'Premium', value: profiles.filter(p => p.subscription_tier === 'premium').length },
    { name: 'Elite', value: profiles.filter(p => p.subscription_tier === 'elite').length },
    { name: 'VIP', value: profiles.filter(p => p.subscription_tier === 'vip').length }
  ];

  const COLORS = ['#94a3b8', '#a855f7', '#f59e0b', '#ef4444'];

  // Top events
  const topEvents = Object.entries(eventsByType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([event, count]) => ({ event, count }));

  // Engagement metrics
  const totalViews = analytics.filter(a => a.event_type?.includes('view')).length;
  const totalLikes = analytics.filter(a => a.event_type?.includes('like')).length;
  const totalMatches = analytics.filter(a => a.event_type?.includes('match')).length;
  const totalMessages = analytics.filter(a => a.event_type?.includes('message')).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">{profiles.length}</p>
              </div>
              <Users size={32} className="text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Profile Views</p>
                <p className="text-2xl font-bold">{totalViews}</p>
              </div>
              <Activity size={32} className="text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Matches</p>
                <p className="text-2xl font-bold">{totalMatches}</p>
              </div>
              <Heart size={32} className="text-pink-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Messages</p>
                <p className="text-2xl font-bold">{totalMessages}</p>
              </div>
              <TrendingUp size={32} className="text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>User Activity (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#8b5cf6" name="Views" />
              <Line type="monotone" dataKey="likes" stroke="#ec4899" name="Likes" />
              <Line type="monotone" dataKey="matches" stroke="#10b981" name="Matches" />
              <Line type="monotone" dataKey="messages" stroke="#3b82f6" name="Messages" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6">
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {funnelData.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.stage}</span>
                  <span className="font-medium">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tierDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Events */}
      <Card>
        <CardHeader>
          <CardTitle>Top Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topEvents.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm">{item.event}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}