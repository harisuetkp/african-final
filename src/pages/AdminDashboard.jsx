import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, MessageSquare, Heart, Shield, TrendingUp, AlertTriangle,
  Settings, BarChart3, UserX, Eye, Clock, DollarSign, Activity,
  Flag, ChevronRight, RefreshCw, Search, Bell, Menu, LogOut
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      setUser(currentUser);
      await loadDashboardData();
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [profiles, matches, messages, reports, likes, subscriptions] = await Promise.all([
        base44.entities.UserProfile.list('-created_date', 1000),
        base44.entities.Match.filter({ is_match: true }, '-created_date', 1000),
        base44.entities.Message.list('-created_date', 500),
        base44.entities.Report.filter({ status: 'pending' }, '-created_date', 50),
        base44.entities.Like.list('-created_date', 1000),
        base44.entities.Subscription.filter({ status: 'active' }, '-created_date', 200)
      ]);

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const activeProfiles = profiles.filter(p => p.is_active && !p.is_banned);
      const newUsersToday = profiles.filter(p => new Date(p.created_date) >= today);
      const newUsersWeek = profiles.filter(p => new Date(p.created_date) >= weekAgo);
      const premiumUsers = profiles.filter(p => p.is_premium);
      const bannedUsers = profiles.filter(p => p.is_banned);
      const suspendedUsers = profiles.filter(p => p.is_suspended);

      const matchesToday = matches.filter(m => new Date(m.created_date) >= today);
      const messagesToday = messages.filter(m => new Date(m.created_date) >= today);

      // DAU calculation (users active in last 24 hours)
      const dau = profiles.filter(p => {
        if (!p.last_active) return false;
        return new Date(p.last_active) >= new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }).length;

      // MAU calculation (users active in last 30 days)
      const mau = profiles.filter(p => {
        if (!p.last_active) return false;
        return new Date(p.last_active) >= monthAgo;
      }).length;

      // Revenue (estimated from active subscriptions)
      const revenue = subscriptions.reduce((sum, sub) => sum + (sub.amount_paid || 0), 0);

      setStats({
        totalUsers: profiles.length,
        activeUsers: activeProfiles.length,
        newUsersToday: newUsersToday.length,
        newUsersWeek: newUsersWeek.length,
        premiumUsers: premiumUsers.length,
        conversionRate: profiles.length > 0 ? ((premiumUsers.length / profiles.length) * 100).toFixed(1) : 0,
        bannedUsers: bannedUsers.length,
        suspendedUsers: suspendedUsers.length,
        totalMatches: matches.length,
        matchesToday: matchesToday.length,
        totalMessages: messages.length,
        messagesToday: messagesToday.length,
        totalLikes: likes.length,
        pendingReports: reports.length,
        dau,
        mau,
        dauMauRatio: mau > 0 ? ((dau / mau) * 100).toFixed(1) : 0,
        revenue,
        activeSubscriptions: subscriptions.length
      });

      // Set alerts
      const newAlerts = [];
      if (reports.length > 10) {
        newAlerts.push({ type: 'danger', message: `${reports.length} pending reports need attention`, icon: AlertTriangle });
      }
      if (bannedUsers.length > 50) {
        newAlerts.push({ type: 'warning', message: `High ban rate: ${bannedUsers.length} users banned`, icon: UserX });
      }
      if (parseFloat(stats?.dauMauRatio || 0) < 20) {
        newAlerts.push({ type: 'info', message: 'DAU/MAU ratio below target (20%)', icon: TrendingUp });
      }
      setAlerts(newAlerts);

      // Recent activity
      const activities = [
        ...newUsersToday.slice(0, 5).map(u => ({ type: 'signup', user: u.display_name, time: u.created_date })),
        ...matchesToday.slice(0, 5).map(m => ({ type: 'match', time: m.matched_at || m.created_date })),
        ...reports.slice(0, 5).map(r => ({ type: 'report', reportType: r.report_type, time: r.created_date }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const navItems = [
    { label: 'Overview', icon: BarChart3, page: 'AdminDashboard', active: true },
    { label: 'Users', icon: Users, page: 'AdminUsers' },
    { label: 'Moderation', icon: Shield, page: 'AdminModeration', badge: stats?.pendingReports },
    { label: 'Analytics', icon: TrendingUp, page: 'AdminAnalytics' },
    { label: 'Subscriptions', icon: DollarSign, page: 'AdminSubscriptions' },
    { label: 'VIP Events', icon: Heart, page: 'AdminVIPEvents' },
    { label: 'Content', icon: MessageSquare, page: 'AdminContent' },
    { label: 'Settings', icon: Settings, page: 'AdminSettings' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-white">Afrinnect</h1>
                <p className="text-xs text-slate-400">Admin Console</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.page}>
                <button
                  onClick={() => navigate(createPageUrl(item.page))}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    item.active 
                      ? 'bg-orange-500/20 text-orange-400' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge > 0 && (
                        <Badge className="bg-red-500 text-white">{item.badge}</Badge>
                      )}
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-slate-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white font-medium">
                  {user?.full_name?.[0] || 'A'}
                </div>
                {sidebarOpen && (
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-white truncate">{user?.full_name || 'Admin'}</p>
                    <p className="text-xs text-slate-400">Administrator</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
              <DropdownMenuItem onClick={() => navigate(createPageUrl('Home'))} className="text-slate-300 hover:text-white hover:bg-slate-800">
                <Eye className="w-4 h-4 mr-2" /> View App
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-red-400 hover:text-red-300 hover:bg-slate-800">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400">
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">Dashboard Overview</h1>
                <p className="text-sm text-slate-400">Welcome back, {user?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search users..." 
                  className="w-64 pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <Button variant="ghost" size="icon" className="text-slate-400 relative">
                <Bell className="w-5 h-5" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Button>
              <Button onClick={handleRefresh} disabled={refreshing} className="bg-orange-500 hover:bg-orange-600">
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="mb-6 space-y-2">
              {alerts.map((alert, i) => (
                <div key={i} className={`flex items-center gap-3 p-4 rounded-lg ${
                  alert.type === 'danger' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                  alert.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                }`}>
                  <alert.icon className="w-5 h-5" />
                  <span>{alert.message}</span>
                  <Button variant="ghost" size="sm" className="ml-auto">View</Button>
                </div>
              ))}
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalUsers?.toLocaleString()}</p>
                    <p className="text-green-400 text-xs">+{stats?.newUsersToday} today</p>
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
                    <p className="text-2xl font-bold text-white">{stats?.dau} / {stats?.mau}</p>
                    <p className="text-slate-400 text-xs">{stats?.dauMauRatio}% ratio</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Premium Users</p>
                    <p className="text-2xl font-bold text-white">{stats?.premiumUsers}</p>
                    <p className="text-orange-400 text-xs">{stats?.conversionRate}% conversion</p>
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
                    <p className="text-slate-400 text-sm">Pending Reports</p>
                    <p className="text-2xl font-bold text-white">{stats?.pendingReports}</p>
                    <p className="text-red-400 text-xs">Needs review</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Flag className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            {[
              { label: 'Total Matches', value: stats?.totalMatches, sub: `+${stats?.matchesToday} today`, color: 'pink' },
              { label: 'Messages Sent', value: stats?.totalMessages, sub: `+${stats?.messagesToday} today`, color: 'purple' },
              { label: 'Total Likes', value: stats?.totalLikes, sub: 'All time', color: 'red' },
              { label: 'Active Subs', value: stats?.activeSubscriptions, sub: 'Paying users', color: 'green' },
              { label: 'Banned Users', value: stats?.bannedUsers, sub: 'Permanent', color: 'slate' },
              { label: 'Suspended', value: stats?.suspendedUsers, sub: 'Temporary', color: 'yellow' },
            ].map((metric, i) => (
              <Card key={i} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-xs">{metric.label}</p>
                  <p className="text-xl font-bold text-white">{metric.value?.toLocaleString()}</p>
                  <p className={`text-${metric.color}-400 text-xs`}>{metric.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions & Activity */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Review Reports', icon: Flag, page: 'AdminModeration', badge: stats?.pendingReports, color: 'red' },
                  { label: 'Manage Users', icon: Users, page: 'AdminUsers', color: 'blue' },
                  { label: 'View Analytics', icon: TrendingUp, page: 'AdminAnalytics', color: 'green' },
                  { label: 'System Settings', icon: Settings, page: 'AdminSettings', color: 'slate' },
                  { label: 'Send Broadcast', icon: Bell, page: 'AdminBroadcast', color: 'purple' },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(createPageUrl(action.page))}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-${action.color}-500/20 flex items-center justify-center`}>
                      <action.icon className={`w-4 h-4 text-${action.color}-400`} />
                    </div>
                    <span className="text-white flex-1 text-left">{action.label}</span>
                    {action.badge > 0 && (
                      <Badge className="bg-red-500 text-white">{action.badge}</Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-slate-900 border-slate-800 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" className="text-slate-400">View All</Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'signup' ? 'bg-green-500/20' :
                          activity.type === 'match' ? 'bg-pink-500/20' :
                          'bg-red-500/20'
                        }`}>
                          {activity.type === 'signup' ? <Users className="w-5 h-5 text-green-400" /> :
                           activity.type === 'match' ? <Heart className="w-5 h-5 text-pink-400" /> :
                           <Flag className="w-5 h-5 text-red-400" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">
                            {activity.type === 'signup' ? `${activity.user} signed up` :
                             activity.type === 'match' ? 'New match created' :
                             `New report: ${activity.reportType}`}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {new Date(activity.time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}