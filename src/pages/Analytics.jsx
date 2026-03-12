import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Eye, MessageCircle, TrendingUp, Users, Globe, Heart, Crown, Lock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AfricanPattern from '@/components/shared/AfricanPattern';
import CountryFlag from '@/components/shared/CountryFlag';

const COLORS = ['#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];

export default function Analytics() {
  const [myProfile, setMyProfile] = useState(null);
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
          if (profiles.length > 0) setMyProfile(profiles[0]);
        }
      } catch (e) {
        console.log('Not logged in');
      }
    };
    fetchProfile();
  }, []);

  const isPremium = myProfile?.is_premium;

  // Fetch profile views
  const { data: profileViews = [] } = useQuery({
    queryKey: ['profile-views', myProfile?.id],
    queryFn: () => base44.entities.ProfileView.filter({ viewed_profile_id: myProfile.id }, '-created_date', 100),
    enabled: !!myProfile
  });

  // Fetch matches
  const { data: matches = [] } = useQuery({
    queryKey: ['my-matches', myProfile?.id],
    queryFn: async () => {
      const allMatches = await base44.entities.Match.filter({
        $or: [{ user1_id: myProfile.id }, { user2_id: myProfile.id }],
        is_match: true
      });
      return allMatches;
    },
    enabled: !!myProfile
  });

  // Fetch messages for response rate
  const { data: messages = [] } = useQuery({
    queryKey: ['my-messages', myProfile?.id],
    queryFn: async () => {
      return base44.entities.Message.filter({
        $or: [{ sender_id: myProfile.id }, { receiver_id: myProfile.id }]
      }, '-created_date', 200);
    },
    enabled: !!myProfile
  });

  // Fetch likes received
  const { data: likesReceived = [] } = useQuery({
    queryKey: ['likes-received', myProfile?.id],
    queryFn: () => base44.entities.Like.filter({ liked_id: myProfile.id }, '-created_date', 100),
    enabled: !!myProfile
  });

  // Fetch who liked me with profiles (Premium)
  const { data: whoLikedMe = [] } = useQuery({
    queryKey: ['who-liked-me', myProfile?.id],
    queryFn: async () => {
      const likes = await base44.entities.Like.filter({ liked_id: myProfile.id }, '-created_date', 20);
      const profileIds = likes.map(l => l.liker_id);
      if (profileIds.length === 0) return [];
      
      const profiles = await Promise.all(
        profileIds.map(id => base44.entities.UserProfile.filter({ id }))
      );
      
      return likes.map((like, idx) => ({
        ...like,
        profile: profiles[idx]?.[0]
      })).filter(l => l.profile);
    },
    enabled: !!myProfile && isPremium
  });

  // Calculate stats
  const calculateStats = () => {
    const now = new Date();
    const daysAgo = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const recentViews = profileViews.filter(v => new Date(v.created_date) >= startDate);
    const recentLikes = likesReceived.filter(l => new Date(l.created_date) >= startDate);
    const recentMatches = matches.filter(m => new Date(m.created_date) >= startDate);

    // Profile views over time
    const viewsByDay = {};
    const likesByDay = {};
    const matchesByDay = {};
    
    for (let i = daysAgo - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = date.toLocaleDateString();
      viewsByDay[dayKey] = 0;
      likesByDay[dayKey] = 0;
      matchesByDay[dayKey] = 0;
    }

    recentViews.forEach(view => {
      const day = new Date(view.created_date).toLocaleDateString();
      if (viewsByDay[day] !== undefined) viewsByDay[day]++;
    });

    recentLikes.forEach(like => {
      const day = new Date(like.created_date).toLocaleDateString();
      if (likesByDay[day] !== undefined) likesByDay[day]++;
    });

    recentMatches.forEach(match => {
      const day = new Date(match.created_date).toLocaleDateString();
      if (matchesByDay[day] !== undefined) matchesByDay[day]++;
    });

    const engagementChartData = Object.keys(viewsByDay).map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: viewsByDay[date],
      likes: likesByDay[date],
      matches: matchesByDay[date]
    }));

    // Message response rate
    const sentMessages = messages.filter(m => m.sender_id === myProfile.id);
    const receivedMessages = messages.filter(m => m.receiver_id === myProfile.id);
    const conversationsStarted = new Set(sentMessages.map(m => m.match_id)).size;
    const conversationsReplied = new Set(receivedMessages.map(m => m.match_id)).size;
    const responseRate = conversationsStarted > 0 ? Math.round((conversationsReplied / conversationsStarted) * 100) : 0;

    // View sources breakdown
    const viewSources = {};
    recentViews.forEach(view => {
      const source = view.view_source || 'discovery';
      viewSources[source] = (viewSources[source] || 0) + 1;
    });

    const viewSourceData = Object.entries(viewSources).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value
    }));

    // Engagement rate calculation
    const engagementRate = recentViews.length > 0 
      ? Math.round((recentLikes.length / recentViews.length) * 100) 
      : 0;

    return {
      totalViews: recentViews.length,
      totalLikes: recentLikes.length,
      totalMatches: recentMatches.length,
      responseRate,
      engagementRate,
      engagementChartData,
      viewSourceData,
      recentViews: recentViews.slice(0, 10)
    };
  };

  const stats = myProfile ? calculateStats() : null;

  // Cultural insights
  const getCulturalInsights = async () => {
    if (!matches.length) return [];

    const matchProfiles = await Promise.all(
      matches.map(async (match) => {
        const otherId = match.user1_id === myProfile.id ? match.user2_id : match.user1_id;
        const profiles = await base44.entities.UserProfile.filter({ id: otherId });
        return profiles[0];
      })
    );

    const countryCount = {};
    matchProfiles.forEach(profile => {
      if (profile?.country_of_origin) {
        countryCount[profile.country_of_origin] = (countryCount[profile.country_of_origin] || 0) + 1;
      }
    });

    return Object.entries(countryCount).map(([country, count]) => ({
      country,
      count,
      percentage: Math.round((count / matchProfiles.length) * 100)
    })).sort((a, b) => b.count - a.count).slice(0, 5);
  };

  const { data: culturalInsights = [] } = useQuery({
    queryKey: ['cultural-insights', myProfile?.id, matches.length],
    queryFn: getCulturalInsights,
    enabled: !!myProfile && matches.length > 0
  });

  if (!myProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-amber-50/20 relative pb-24">
      <AfricanPattern className="text-purple-600" opacity={0.03} />

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Profile')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">Analytics</h1>
            {isPremium && <Badge className="bg-amber-500">Premium</Badge>}
          </div>
          
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList className="bg-gray-100">
              <TabsTrigger value="7days">7d</TabsTrigger>
              <TabsTrigger value="30days">30d</TabsTrigger>
              <TabsTrigger value="90days">90d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {!isPremium && (
          <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-purple-50">
            <CardContent className="p-6 text-center">
              <Crown size={40} className="mx-auto mb-4 text-amber-600" />
              <h3 className="font-bold text-lg mb-2">Unlock Full Analytics</h3>
              <p className="text-gray-600 mb-4">
                Upgrade to Premium to see detailed insights and who viewed your profile
              </p>
              <Link to={createPageUrl('PricingPlans')}>
                <Button className="bg-gradient-to-r from-purple-600 to-purple-700">
                  Upgrade Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Eye size={20} className="text-purple-600" />
                <TrendingUp size={16} className="text-green-500" />
              </div>
              <p className="text-2xl font-bold">{stats?.totalViews || 0}</p>
              <p className="text-sm text-gray-500">Profile Views</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Heart size={20} className="text-pink-600" />
                <TrendingUp size={16} className="text-green-500" />
              </div>
              <p className="text-2xl font-bold">{stats?.totalLikes || 0}</p>
              <p className="text-sm text-gray-500">Likes Received</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users size={20} className="text-amber-600" />
                <TrendingUp size={16} className="text-green-500" />
              </div>
              <p className="text-2xl font-bold">{stats?.totalMatches || 0}</p>
              <p className="text-sm text-gray-500">New Matches</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <MessageCircle size={20} className="text-blue-600" />
                <TrendingUp size={16} className="text-green-500" />
              </div>
              <p className="text-2xl font-bold">{stats?.responseRate || 0}%</p>
              <p className="text-sm text-gray-500">Response Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Rate */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">Engagement Rate</h3>
                <p className="text-sm text-gray-500">Views to likes conversion</p>
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {stats?.engagementRate || 0}%
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats?.engagementRate || 0, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.engagementRate >= 20 ? '🔥 Great engagement!' : stats?.engagementRate >= 10 ? '👍 Good job!' : '💡 Tip: Update your photos for better engagement'}
            </p>
          </CardContent>
        </Card>

        {/* Engagement Trends Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} className="text-purple-600" />
              Engagement Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.engagementChartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.engagementChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#7c3aed" 
                    strokeWidth={2} 
                    name="Profile Views"
                    dot={{ fill: '#7c3aed', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="likes" 
                    stroke="#ec4899" 
                    strokeWidth={2} 
                    name="Likes Received"
                    dot={{ fill: '#ec4899', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="matches" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    name="New Matches"
                    dot={{ fill: '#f59e0b', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-8">No engagement data yet. Keep swiping!</p>
            )}
          </CardContent>
        </Card>

        {/* View Sources Pie Chart */}
        {stats?.viewSourceData?.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye size={20} className="text-purple-600" />
                How People Found You
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.viewSourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.viewSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {stats.viewSourceData.map((source, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-sm capitalize">{source.name}</span>
                      <span className="text-sm text-gray-500">({source.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Who Viewed Your Profile */}
        {isPremium ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} className="text-purple-600" />
                Recent Profile Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recentViews?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentViews.map((view, idx) => (
                    <Link key={idx} to={createPageUrl(`Profile?id=${view.viewer_profile_id}`)}>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Eye size={20} className="text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Profile viewed</p>
                          <p className="text-sm text-gray-500">
                            {new Date(view.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {view.view_source || 'discovery'}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No profile views yet</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 border-amber-200">
            <CardContent className="p-8 text-center">
              <Lock size={48} className="mx-auto mb-4 text-gray-400" />
              <h4 className="font-bold mb-2">See Who Viewed Your Profile</h4>
              <p className="text-sm text-gray-500 mb-4">Upgrade to Premium to unlock</p>
            </CardContent>
          </Card>
        )}

        {/* Who Liked You (Premium) */}
        {isPremium ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart size={20} className="text-pink-600" />
                Who Liked You
              </CardTitle>
            </CardHeader>
            <CardContent>
              {whoLikedMe?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {whoLikedMe.map((like) => (
                    <Link key={like.id} to={createPageUrl(`Profile?id=${like.liker_id}`)}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="relative rounded-xl overflow-hidden shadow-lg cursor-pointer group"
                      >
                        <div className="aspect-[3/4] relative">
                          <img
                            src={like.profile?.primary_photo || like.profile?.photos?.[0]}
                            alt={like.profile?.display_name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white font-bold text-sm">
                              {like.profile?.display_name}
                            </p>
                            <p className="text-white/80 text-xs">
                              {new Date(like.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          {like.is_super_like && (
                            <Badge className="absolute top-2 right-2 bg-amber-500 text-white border-0">
                              ⭐ Super
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No likes yet</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 border-pink-200">
            <CardContent className="p-8 text-center">
              <Heart size={48} className="mx-auto mb-4 text-pink-400" />
              <h4 className="font-bold mb-2">See Who Likes You</h4>
              <p className="text-sm text-gray-500 mb-4">Upgrade to Premium to see everyone who likes you</p>
              <Link to={createPageUrl('PricingPlans')}>
                <Button className="bg-gradient-to-r from-pink-600 to-purple-700">
                  Upgrade to Premium
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Cultural Compatibility Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe size={20} className="text-amber-600" />
              Cultural Compatibility Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {culturalInsights.length > 0 ? (
              <div className="space-y-4">
                {culturalInsights.map((insight, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CountryFlag country={insight.country} size="medium" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{insight.country}</span>
                        <span className="text-sm text-gray-500">{insight.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-amber-600 h-2 rounded-full"
                          style={{ width: `${insight.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-4">
                  Based on your {matches.length} match{matches.length !== 1 ? 'es' : ''}
                </p>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                Start matching to see cultural insights
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}