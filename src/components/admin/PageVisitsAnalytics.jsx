import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Eye, TrendingUp, Globe, Clock } from 'lucide-react';

export default function PageVisitsAnalytics() {
  // Fetch page visit analytics
  const { data: analytics = [], isLoading } = useQuery({
    queryKey: ['page-visits-analytics'],
    queryFn: () => base44.entities.ProfileAnalytics.list('-created_date', 5000),
    refetchInterval: 60000
  });

  // Filter for page visit events
  const pageVisits = analytics.filter(a => 
    a.event_type?.includes('page_view') || 
    a.event_type?.includes('visit') ||
    a.event_type === 'LANDING_VIEW'
  );

  // Calculate visits by day (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const visitsByDay = last30Days.map(date => {
    const dayVisits = analytics.filter(a => 
      a.created_date?.startsWith(date)
    );
    
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      visits: dayVisits.length,
      uniqueUsers: new Set(dayVisits.map(v => v.user_profile_id).filter(Boolean)).size
    };
  });

  // Total visits today
  const today = new Date().toISOString().split('T')[0];
  const visitsToday = analytics.filter(a => a.created_date?.startsWith(today)).length;

  // Total visits this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const visitsThisWeek = analytics.filter(a => 
    new Date(a.created_date) >= weekAgo
  ).length;

  // Total visits this month
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const visitsThisMonth = analytics.filter(a => 
    new Date(a.created_date) >= monthAgo
  ).length;

  // Top pages visited
  const pagesByType = analytics.reduce((acc, item) => {
    const page = item.event_type || 'unknown';
    acc[page] = (acc[page] || 0) + 1;
    return acc;
  }, {});

  const topPages = Object.entries(pagesByType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([page, count]) => ({ page: page.replace(/_/g, ' '), count }));

  // Unique visitors
  const uniqueVisitors = new Set(analytics.map(a => a.user_profile_id).filter(Boolean)).size;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Page Visits Analytics</h2>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Visits</p>
                <p className="text-2xl font-bold">{visitsToday}</p>
              </div>
              <Eye size={32} className="text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Week</p>
                <p className="text-2xl font-bold">{visitsThisWeek}</p>
              </div>
              <TrendingUp size={32} className="text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold">{visitsThisMonth}</p>
              </div>
              <Globe size={32} className="text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unique Visitors</p>
                <p className="text-2xl font-bold">{uniqueVisitors}</p>
              </div>
              <Clock size={32} className="text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visits Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Visits (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={visitsByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="visits" stroke="#8b5cf6" name="Total Visits" strokeWidth={2} />
              <Line type="monotone" dataKey="uniqueUsers" stroke="#10b981" name="Unique Users" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Top Events / Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPages} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="page" type="category" width={150} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Event</th>
                  <th className="text-left py-2 px-3">User</th>
                  <th className="text-left py-2 px-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {analytics.slice(0, 20).map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">
                      {item.event_type?.replace(/_/g, ' ') || 'Unknown'}
                    </td>
                    <td className="py-2 px-3 text-gray-500">
                      {item.user_profile_id ? item.user_profile_id.slice(0, 8) + '...' : 'Anonymous'}
                    </td>
                    <td className="py-2 px-3 text-gray-500">
                      {new Date(item.created_date).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}