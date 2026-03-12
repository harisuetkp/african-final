import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Filter, Eye, Ban, Trash2, Send, Shield, Crown, CheckCircle, Download, Award, Star, ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';

export default function UserManagement({ 
  profiles, 
  users, 
  searchTerm, 
  onSearchChange,
  onViewUser,
  onBanUser,
  onDeleteUser,
  onMessageUser,
  onToggleAdmin,
  onChangeTier,
  stats,
  page,
  setPage,
  filters,
  setFilters,
  hasMore,
  processingAction = { id: null, type: null }
}) {

  // Export only current view as we don't have all on client
  const handleExportCSV = () => {
    const headers = ['User ID', 'Display Name', 'Email', 'Country', 'Gender', 'Status', 'Tier', 'Login Streak', 'Last Active', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...profiles.map(p => {
        const u = users.find(user => user.id === p.user_id);
        return [
          p.user_id,
          `"${p.display_name || ''}"`,
          u?.email || '',
          `"${p.current_country || ''}"`,
          p.gender || '',
          p.is_active ? 'Active' : 'Banned',
          p.subscription_tier || 'free',
          p.login_streak || 0,
          p.last_active || '',
          p.created_date || ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
            <p className="text-sm text-gray-600">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">{stats?.activeUsers || 0}</p>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-600">{stats?.premiumUsers || 0}</p>
            <p className="text-sm text-gray-600">Premium</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-600">{stats?.verifiedUsers || 0}</p>
            <p className="text-sm text-gray-600">Verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-red-600">{stats?.bannedUsers || 0}</p>
            <p className="text-sm text-gray-600">Banned</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter size={20} />
              Filters & Search
            </span>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download size={16} className="mr-2" />
              Export Page CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Simplified Country Filter - Just an Input for now as we paginate */}
            <Input
                placeholder="Filter by Country"
                value={filters.country === 'all' ? '' : filters.country}
                onChange={(e) => setFilters({ ...filters, country: e.target.value || 'all' })}
            />

            <Select value={filters.status} onValueChange={(val) => setFilters({ ...filters, status: val })}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.tier} onValueChange={(val) => setFilters({ ...filters, tier: val })}>
              <SelectTrigger>
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Users List</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
            >
                <ChevronLeft size={16} /> Previous
            </Button>
            <span className="text-sm font-medium">Page {page}</span>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore}
            >
                Next <ChevronRight size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {profiles.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No users found"
                  description={searchTerm ? `No users match "${searchTerm}"` : "No users found with current filters"}
                  actionLabel="Clear Filters"
                  onAction={() => {
                    onSearchChange('');
                    setFilters({ status: 'all', tier: 'all', country: 'all' });
                  }}
                  className="py-4"
                />
            ) : (
                profiles.map(profile => {
              const user = users?.find(u => u.id === profile.user_id);
              // Show profile even if user record not found (display email as N/A)
              const isUserAdmin = user?.role === 'admin' || user?.email === 'pivotngoyb@gmail.com';
              const userEmail = user?.email || profile.created_by || 'N/A';
              
              return (
                <div key={profile.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border">
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={profile.primary_photo || profile.photos?.[0] || 'https://via.placeholder.com/50'}
                      alt={profile.display_name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{profile.display_name}</p>
                        {profile.verification_status?.photo_verified && (
                          <CheckCircle size={16} className="text-green-500" />
                        )}
                        {profile.subscription_tier === 'vip' && (
                          <Star size={16} className="text-rose-500" />
                        )}
                        {profile.subscription_tier === 'elite' && (
                          <Award size={16} className="text-amber-500" />
                        )}
                        {profile.subscription_tier === 'premium' && (
                          <Crown size={16} className="text-purple-500" />
                        )}
                        {isUserAdmin && (
                          <Badge className="bg-red-600">Admin</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{userEmail}</p>
                      <p className="text-xs text-gray-500">
                        {profile.current_city}, {profile.current_country} • {profile.gender} • Created {new Date(profile.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Streak Badge */}
                  {profile.login_streak > 0 && (
                    <div className="flex items-center gap-1 mr-4 text-orange-600 font-medium" title="Current Login Streak">
                      <span className="text-lg">🔥</span>
                      <span>{profile.login_streak}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Badge className={profile.is_active ? 'bg-green-600' : 'bg-red-600'}>
                      {profile.is_active ? 'Active' : 'Banned'}
                    </Badge>
                    
                    {/* Tier Selector */}
                    <div className="relative">
                      {processingAction?.id === profile.id && processingAction?.type === 'tier' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                          <Loader2 size={16} className="animate-spin text-purple-600" />
                        </div>
                      )}
                      <Select
                        value={profile.subscription_tier || 'free'}
                        onValueChange={(tier) => onChangeTier(profile.id, tier)}
                        disabled={processingAction?.id === profile.id && processingAction?.type === 'tier'}
                      >
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="elite">Elite</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {user && userEmail !== 'pivotngoyb@gmail.com' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onToggleAdmin(user.id, !isUserAdmin)}
                        disabled={processingAction?.id === user.id && processingAction?.type === 'admin'}
                      >
                        {processingAction?.id === user.id && processingAction?.type === 'admin' ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Shield size={16} className={isUserAdmin ? "text-purple-600 fill-purple-100" : ""} />
                        )}
                      </Button>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onMessageUser(profile)}
                          >
                            <Send size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Send Message</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewUser(profile.id)}
                          >
                            <Eye size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>View Profile</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => onBanUser(profile)}
                            disabled={userEmail === 'pivotngoyb@gmail.com'}
                          >
                            <Ban size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Ban User</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => onDeleteUser(profile)}
                            disabled={userEmail === 'pivotngoyb@gmail.com'}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Delete User</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              );
            }).filter(Boolean)
          )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}