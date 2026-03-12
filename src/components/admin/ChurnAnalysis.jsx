import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, AlertCircle, Users } from 'lucide-react';

export default function ChurnAnalysis() {
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['churn-subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-end_date', 500)
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['churn-profiles'],
    queryFn: () => base44.entities.UserProfile.list('-last_active', 1000)
  });

  if (isLoading) {
    return <div className="animate-pulse"><Card className="h-64 bg-gray-100" /></div>;
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Churn metrics
  const expiredThisMonth = subscriptions.filter(s => 
    new Date(s.end_date) > thirtyDaysAgo && 
    new Date(s.end_date) < now &&
    s.status === 'expired'
  );

  const expiringsSoon = subscriptions.filter(s =>
    new Date(s.end_date) > now &&
    new Date(s.end_date) < sevenDaysFromNow &&
    s.status === 'active'
  );

  const inactiveUsers = profiles.filter(p => {
    if (!p.last_active) return false;
    return new Date(p.last_active) < thirtyDaysAgo;
  });

  const totalActiveSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  const churnRate = totalActiveSubscriptions > 0 
    ? ((expiredThisMonth.length / totalActiveSubscriptions) * 100).toFixed(1)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown size={20} className="text-red-500" />
          Churn Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-red-500" />
              <p className="text-sm text-gray-600">Churn Rate (30d)</p>
            </div>
            <p className="text-3xl font-bold text-red-600">{churnRate}%</p>
            <p className="text-xs text-gray-500 mt-1">{expiredThisMonth.length} churned</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-amber-500" />
              <p className="text-sm text-gray-600">Expiring Soon</p>
            </div>
            <p className="text-3xl font-bold text-amber-600">{expiringsSoon.length}</p>
            <p className="text-xs text-gray-500 mt-1">Next 7 days</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-gray-500" />
              <p className="text-sm text-gray-600">Inactive Users</p>
            </div>
            <p className="text-3xl font-bold text-gray-700">{inactiveUsers.length}</p>
            <p className="text-xs text-gray-500 mt-1">30+ days inactive</p>
          </div>
        </div>

        {expiringsSoon.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" />
              At-Risk Subscriptions
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {expiringsSoon.slice(0, 10).map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <p className="text-sm font-medium">{sub.user_profile_id}</p>
                    <p className="text-xs text-gray-500">
                      {sub.plan_type} • Expires {new Date(sub.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-amber-500">
                    {Math.ceil((new Date(sub.end_date) - now) / (1000 * 60 * 60 * 24))}d left
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}