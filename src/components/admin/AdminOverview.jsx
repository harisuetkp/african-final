import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ConversionFunnel from './ConversionFunnel';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Crown, DollarSign, Heart, AlertTriangle, TrendingUp, CheckCircle, Globe, Info } from 'lucide-react';

export default function AdminOverview({ stats, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  const kpiCards = [
    {
      title: 'Total Users',
      value: stats.totalProfiles || 0,
      change: `+${stats.newUsersThisWeek || 0} this week`,
      icon: Users,
      color: 'blue',
      subtext: `${stats.activeUsers || 0} active • ${stats.bannedUsers || 0} banned`
    },
    {
      title: 'Paid Subscribers',
      value: stats.totalPaidUsers || 0,
      change: `${stats.conversionRate}% conversion`,
      icon: Crown,
      color: 'amber',
      subtext: `Premium: ${stats.premiumUsers || 0} • Elite: ${stats.eliteUsers || 0} • VIP: ${stats.vipUsers || 0}`
    },
    {
      title: 'Total Revenue',
      value: `$${(stats.totalRevenue || 0).toFixed(0)}`,
      change: `$${(stats.revenueThisMonth || 0).toFixed(0)} MTD`,
      icon: DollarSign,
      color: 'green',
      subtext: `${stats.activeSubscriptions || 0} active subscriptions`
    },
    {
      title: 'Total Matches',
      value: stats.totalMatches || 0,
      change: `+${stats.matchesThisMonth || 0} this month`,
      icon: Heart,
      color: 'pink',
      subtext: `${stats.matchRate}% match rate • ${stats.usersWithMatches || 0} users matched`
    },
    {
      title: 'Retention',
      value: `${stats.avgStreak || 0} days`,
      change: `${stats.streak7Plus || 0} users > 7 days`,
      icon: TrendingUp,
      color: 'purple',
      subtext: `${stats.streak30Plus || 0} users on 30+ day streak`
    }
  ];

  const healthMetrics = [
    { label: 'Active Users', value: stats.activeUsers || 0, total: stats.totalProfiles || 1, status: 'good' },
    { label: 'Verified Users', value: stats.verifiedUsers || 0, total: stats.totalProfiles || 1, status: 'good' },
    { label: 'Pending Reports', value: stats.pendingReports || 0, total: Math.max(stats.totalReports || 10, 10), status: (stats.pendingReports || 0) > 10 ? 'warning' : 'good' },
    { label: 'Open Support Tickets', value: stats.openTickets || 0, total: Math.max(stats.totalTickets || 10, 10), status: (stats.urgentTickets || 0) > 5 ? 'warning' : 'good' }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <TooltipProvider key={idx}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className={`cursor-help transition-transform hover:scale-105 ${
                    kpi.color === 'blue' ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20' :
                    kpi.color === 'amber' ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20' :
                    kpi.color === 'green' ? 'bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20' :
                    kpi.color === 'pink' ? 'bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20' :
                    'bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${
                          kpi.color === 'blue' ? 'bg-blue-500/20' :
                          kpi.color === 'amber' ? 'bg-amber-500/20' :
                          kpi.color === 'green' ? 'bg-green-500/20' :
                          kpi.color === 'pink' ? 'bg-pink-500/20' :
                          'bg-purple-500/20'
                        }`}>
                          <Icon size={24} className={
                            kpi.color === 'blue' ? 'text-blue-500' :
                            kpi.color === 'amber' ? 'text-amber-500' :
                            kpi.color === 'green' ? 'text-green-500' :
                            kpi.color === 'pink' ? 'text-pink-500' :
                            'text-purple-500'
                          } />
                        </div>
                        <Badge className={
                          kpi.color === 'blue' ? 'bg-blue-500/20 text-blue-700' :
                          kpi.color === 'amber' ? 'bg-amber-500/20 text-amber-700' :
                          kpi.color === 'green' ? 'bg-green-500/20 text-green-700' :
                          kpi.color === 'pink' ? 'bg-pink-500/20 text-pink-700' :
                          'bg-purple-500/20 text-purple-700'
                        }>
                          {kpi.change}
                        </Badge>
                      </div>
                      <h3 className="text-3xl font-bold mb-1">{kpi.value}</h3>
                      <p className="text-sm text-gray-600">{kpi.title}</p>
                      <p className="text-xs text-gray-500 mt-2">{kpi.subtext}</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Track key metrics for {kpi.title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Growth Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} className="text-green-500" />
              Platform Growth
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New This Week</span>
                <span className="text-xl font-bold text-blue-600">+{stats.newUsersThisWeek || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New This Month</span>
                <span className="text-xl font-bold text-blue-600">+{stats.newUsersThisMonth || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Growth Rate</span>
                <span className="text-xl font-bold text-green-600">{stats.growthRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Matches This Week</span>
                <span className="text-xl font-bold text-pink-600">+{stats.matchesThisWeek || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle size={20} className="text-blue-500" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {healthMetrics.map((metric, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{metric.label}</span>
                  <span className="text-sm font-semibold">
                    {metric.value} / {metric.total}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${metric.status === 'good' ? 'bg-green-500' : 'bg-yellow-500'}`}
                    style={{ width: `${(metric.value / metric.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <ConversionFunnel />

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign size={20} className="text-green-500" />
            Revenue Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold">${(stats.totalRevenue || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">This Month</p>
              <p className="text-2xl font-bold text-green-600">${(stats.revenueThisMonth || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">ARPU</p>
              <p className="text-2xl font-bold">
                ${(stats.totalProfiles || 0) > 0 ? ((stats.totalRevenue || 0) / stats.totalProfiles).toFixed(2) : '0.00'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-amber-600">{stats.conversionRate || 0}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}