import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Users, CreditCard, RefreshCw, Crown } from 'lucide-react';

export default function RevenueAnalytics({ subscriptions, profiles }) {
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.amount_paid || 0), 0);
  
  // Calculate accurate MRR
  const mrr = activeSubscriptions.reduce((sum, sub) => {
    let monthlyAmount = 0;
    if (sub.plan_type.includes('yearly')) {
      monthlyAmount = (sub.amount_paid || 0) / 12;
    } else if (sub.plan_type.includes('quarterly')) {
      monthlyAmount = (sub.amount_paid || 0) / 3;
    } else if (sub.plan_type.includes('6months')) {
      monthlyAmount = (sub.amount_paid || 0) / 6;
    } else {
      monthlyAmount = sub.amount_paid || 0;
    }
    return sum + monthlyAmount;
  }, 0);

  const subscriptionsByTier = {
    premium: activeSubscriptions.filter(s => s.plan_type.includes('premium')),
    elite: activeSubscriptions.filter(s => s.plan_type.includes('elite')),
    vip: activeSubscriptions.filter(s => s.plan_type.includes('vip'))
  };

  const revenueByTier = {
    premium: subscriptions.filter(s => s.plan_type.includes('premium')).reduce((sum, s) => sum + (s.amount_paid || 0), 0),
    elite: subscriptions.filter(s => s.plan_type.includes('elite')).reduce((sum, s) => sum + (s.amount_paid || 0), 0),
    vip: subscriptions.filter(s => s.plan_type.includes('vip')).reduce((sum, s) => sum + (s.amount_paid || 0), 0)
  };

  const arpu = profiles.length > 0 ? totalRevenue / profiles.length : 0;
  const arppu = activeSubscriptions.length > 0 ? totalRevenue / activeSubscriptions.length : 0;
  const conversionRate = profiles.length > 0 ? (activeSubscriptions.length / profiles.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-500 rounded-xl">
                <DollarSign size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-700">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-500 rounded-xl">
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">MRR</p>
                <p className="text-3xl font-bold text-blue-700">${mrr.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-500 rounded-xl">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ARPU / ARPPU</p>
                <p className="text-3xl font-bold text-purple-700">${arpu.toFixed(2)} / ${arppu.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-amber-500 rounded-xl">
                <Crown size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversion</p>
                <p className="text-3xl font-bold text-amber-700">{conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Tiers */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Premium</span>
              <Badge className="bg-purple-600">{subscriptionsByTier.premium.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600 mb-2">
              ${revenueByTier.premium.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              {totalRevenue > 0 ? ((revenueByTier.premium / totalRevenue) * 100).toFixed(1) : 0}% of total revenue
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Monthly</span>
                <span className="font-semibold">
                  {subscriptionsByTier.premium.filter(s => s.plan_type.includes('monthly')).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Yearly</span>
                <span className="font-semibold">
                  {subscriptionsByTier.premium.filter(s => s.plan_type.includes('yearly')).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Elite</span>
              <Badge className="bg-amber-600">{subscriptionsByTier.elite.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600 mb-2">
              ${revenueByTier.elite.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              {totalRevenue > 0 ? ((revenueByTier.elite / totalRevenue) * 100).toFixed(1) : 0}% of total revenue
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Monthly</span>
                <span className="font-semibold">
                  {subscriptionsByTier.elite.filter(s => s.plan_type.includes('monthly')).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Quarterly</span>
                <span className="font-semibold">
                  {subscriptionsByTier.elite.filter(s => s.plan_type.includes('quarterly')).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>VIP</span>
              <Badge className="bg-rose-600">{subscriptionsByTier.vip.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-600 mb-2">
              ${revenueByTier.vip.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              {totalRevenue > 0 ? ((revenueByTier.vip / totalRevenue) * 100).toFixed(1) : 0}% of total revenue
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Monthly</span>
                <span className="font-semibold">
                  {subscriptionsByTier.vip.filter(s => s.plan_type.includes('monthly')).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>6 Months</span>
                <span className="font-semibold">
                  {subscriptionsByTier.vip.filter(s => s.plan_type.includes('6months')).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard size={20} />
            Recent Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {activeSubscriptions.slice(0, 20).map(sub => (
              <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div>
                  <p className="font-semibold capitalize">
                    {sub.plan_type.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-600">User: {sub.user_profile_id}</p>
                  <p className="text-xs text-gray-500">
                    Started: {new Date(sub.start_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    ${sub.amount_paid} {sub.currency}
                  </p>
                  <Badge className={sub.auto_renew ? 'bg-green-600' : 'bg-gray-600'}>
                    {sub.auto_renew ? 'Auto-renew' : 'Manual'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}