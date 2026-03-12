import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Crown, Award, Star, XCircle, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function SubscriptionManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['admin-subscriptions-full'],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.list('-created_date', 500);
      const profileIds = [...new Set(subs.map(s => s.user_profile_id))];
      const profiles = await Promise.all(
        profileIds.map(id => base44.entities.UserProfile.filter({ id }))
      );
      return subs.map(sub => ({
        ...sub,
        profile: profiles.find(p => p[0]?.id === sub.user_profile_id)?.[0]
      }));
    }
  });

  const updateSubMutation = useMutation({
    mutationFn: ({ subId, data }) => base44.entities.Subscription.update(subId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-subscriptions-full']);
      queryClient.invalidateQueries(['admin-profiles']);
    }
  });

  const changeTierMutation = useMutation({
    mutationFn: async ({ profileId, subId, newTier }) => {
      // Update profile tier
      await base44.entities.UserProfile.update(profileId, {
        subscription_tier: newTier,
        is_premium: newTier !== 'free'
      });
      
      // Update subscription
      if (subId) {
        await base44.entities.Subscription.update(subId, {
          plan_type: `${newTier}_monthly`,
          status: newTier === 'free' ? 'cancelled' : 'active'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-subscriptions-full']);
      queryClient.invalidateQueries(['admin-profiles']);
    }
  });

  const filteredSubs = subscriptions.filter(sub => {
    const matchesSearch = sub.profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.profile?.user_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getTierIcon = (tier) => {
    if (tier?.includes('vip')) return <Star className="text-rose-500" size={16} />;
    if (tier?.includes('elite')) return <Award className="text-amber-500" size={16} />;
    if (tier?.includes('premium')) return <Crown className="text-purple-500" size={16} />;
    return null;
  };

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    revenue: subscriptions.reduce((sum, s) => sum + (s.amount_paid || 0), 0),
    premium: subscriptions.filter(s => s.plan_type?.includes('premium')).length,
    elite: subscriptions.filter(s => s.plan_type?.includes('elite')).length,
    vip: subscriptions.filter(s => s.plan_type?.includes('vip')).length
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Subs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.premium}</p>
            <p className="text-sm text-gray-600">Premium</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.elite}</p>
            <p className="text-sm text-gray-600">Elite</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-rose-600">{stats.vip}</p>
            <p className="text-sm text-gray-600">VIP</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">${stats.revenue.toFixed(0)}</p>
            <p className="text-sm text-gray-600">Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search by name or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subscriptions List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredSubs.map(sub => (
              <div key={sub.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={sub.profile?.primary_photo}
                  alt={sub.profile?.display_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{sub.profile?.display_name}</h3>
                    {getTierIcon(sub.plan_type)}
                  </div>
                  <div className="flex gap-2 mt-1 text-xs text-gray-600">
                    <span>{sub.plan_type}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={12} />
                      ${sub.amount_paid}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(sub.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      sub.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : sub.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }
                  >
                    {sub.status}
                  </Badge>
                  
                  {/* Change Tier */}
                  <Select
                    value={sub.profile?.subscription_tier || 'free'}
                    onValueChange={(newTier) =>
                      changeTierMutation.mutate({
                        profileId: sub.profile.id,
                        subId: sub.id,
                        newTier
                      })
                    }
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="elite">Elite</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Cancel */}
                  {sub.status === 'active' && (
                    <Button
                      onClick={() =>
                        updateSubMutation.mutate({
                          subId: sub.id,
                          data: { status: 'cancelled', auto_renew: false }
                        })
                      }
                      variant="destructive"
                      size="sm"
                    >
                      <XCircle size={14} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}