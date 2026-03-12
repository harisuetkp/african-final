import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, Search, Filter, MoreVertical, Eye, Ban, Clock, Shield,
  Mail, MessageSquare, ChevronLeft, ChevronRight, Download, 
  UserCheck, UserX, Crown, Star, AlertTriangle, RefreshCw, X, Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortBy, setSortBy] = useState("-created_date");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: null, user: null });
  const [actionReason, setActionReason] = useState("");
  const [actionDuration, setActionDuration] = useState("24");
  const [processing, setProcessing] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, statusFilter, tierFilter, sortBy]);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser || currentUser.role !== 'admin') {
        navigate(createPageUrl('Home'));
        return;
      }
      setUser(currentUser);
      await loadUsers();
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const profiles = await base44.entities.UserProfile.list('-created_date', 1000);
      setUsers(profiles);
    } catch (error) {
      console.error('Error loading users:', error);
    }
    setLoading(false);
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.display_name?.toLowerCase().includes(query) ||
        u.user_id?.toLowerCase().includes(query) ||
        u.current_city?.toLowerCase().includes(query) ||
        u.current_country?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter === 'active') filtered = filtered.filter(u => u.is_active && !u.is_banned && !u.is_suspended);
    else if (statusFilter === 'banned') filtered = filtered.filter(u => u.is_banned);
    else if (statusFilter === 'suspended') filtered = filtered.filter(u => u.is_suspended);
    else if (statusFilter === 'inactive') filtered = filtered.filter(u => !u.is_active);

    // Tier filter
    if (tierFilter === 'premium') filtered = filtered.filter(u => u.is_premium);
    else if (tierFilter === 'founding') filtered = filtered.filter(u => u.is_founding_member);
    else if (tierFilter === 'free') filtered = filtered.filter(u => !u.is_premium);

    // Sort
    filtered.sort((a, b) => {
      const asc = !sortBy.startsWith('-');
      const field = sortBy.replace('-', '');
      const aVal = a[field] || '';
      const bVal = b[field] || '';
      if (asc) return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    setFilteredUsers(filtered);
    setPage(1);
  };

  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const handleAction = async () => {
    if (!actionDialog.user || !actionDialog.type) return;
    setProcessing(true);

    try {
      const updateData = {};
      
      if (actionDialog.type === 'ban') {
        updateData.is_banned = true;
        updateData.ban_reason = actionReason;
        updateData.is_active = false;
      } else if (actionDialog.type === 'unban') {
        updateData.is_banned = false;
        updateData.ban_reason = null;
        updateData.is_active = true;
      } else if (actionDialog.type === 'suspend') {
        updateData.is_suspended = true;
        updateData.suspension_reason = actionReason;
        updateData.suspension_expires_at = new Date(Date.now() + parseInt(actionDuration) * 60 * 60 * 1000).toISOString();
      } else if (actionDialog.type === 'unsuspend') {
        updateData.is_suspended = false;
        updateData.suspension_reason = null;
        updateData.suspension_expires_at = null;
      } else if (actionDialog.type === 'verify') {
        updateData.verification_status = { ...actionDialog.user.verification_status, photo_verified: true };
        updateData.badges = [...(actionDialog.user.badges || []), 'verified'];
      } else if (actionDialog.type === 'premium') {
        updateData.is_premium = true;
        updateData.subscription_tier = 'premium';
        updateData.premium_until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (actionDialog.type === 'founding') {
        updateData.is_founding_member = true;
        updateData.founding_member_granted_at = new Date().toISOString();
        updateData.founding_member_source = 'manual_admin';
        updateData.badges = [...(actionDialog.user.badges || []), 'founding_member'];
      }

      await base44.entities.UserProfile.update(actionDialog.user.id, updateData);

      // Create moderation action record
      if (['ban', 'suspend'].includes(actionDialog.type)) {
        await base44.entities.ModerationAction.create({
          user_profile_id: actionDialog.user.id,
          moderator_id: user.id,
          action_type: actionDialog.type === 'ban' ? 'permanent_ban' : 'temporary_ban',
          reason: actionReason,
          duration_hours: actionDialog.type === 'suspend' ? parseInt(actionDuration) : null,
          is_active: true
        });
      }

      await loadUsers();
      setActionDialog({ open: false, type: null, user: null });
      setActionReason("");
    } catch (error) {
      console.error('Error performing action:', error);
    }
    setProcessing(false);
  };

  const getUserStatus = (u) => {
    if (u.is_banned) return { label: 'Banned', color: 'bg-red-500' };
    if (u.is_suspended) return { label: 'Suspended', color: 'bg-yellow-500' };
    if (!u.is_active) return { label: 'Inactive', color: 'bg-slate-500' };
    return { label: 'Active', color: 'bg-green-500' };
  };

  const getAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar activePage="AdminUsers" />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">User Management</h1>
              <p className="text-sm text-slate-400">{filteredUsers.length} users found</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="border-slate-700 text-slate-300"
                onClick={() => {
                  const csv = [
                    ['Name', 'Gender', 'Status', 'Tier', 'Location', 'Joined', 'Last Active'].join(','),
                    ...filteredUsers.map(u => [
                      `"${u.display_name || ''}"`,
                      u.gender || '',
                      u.is_banned ? 'Banned' : u.is_suspended ? 'Suspended' : u.is_active ? 'Active' : 'Inactive',
                      u.subscription_tier || 'free',
                      `"${u.current_city || ''}, ${u.current_country || ''}"`,
                      u.created_date ? new Date(u.created_date).toLocaleDateString() : '',
                      u.last_active ? new Date(u.last_active).toLocaleDateString() : 'Never'
                    ].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button onClick={loadUsers} className="bg-orange-500 hover:bg-orange-600">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Filters */}
          <Card className="bg-slate-900 border-slate-800 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by name, ID, city..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="founding">Founding</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-44 bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="-created_date">Newest First</SelectItem>
                    <SelectItem value="created_date">Oldest First</SelectItem>
                    <SelectItem value="-last_active">Recently Active</SelectItem>
                    <SelectItem value="display_name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left p-4 text-slate-400 font-medium">User</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Tier</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Location</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Joined</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Last Active</th>
                      <th className="text-right p-4 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u) => {
                      const status = getUserStatus(u);
                      const age = getAge(u.birth_date);
                      return (
                        <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={u.primary_photo} />
                                <AvatarFallback className="bg-slate-700 text-white">
                                  {u.display_name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-white font-medium flex items-center gap-2">
                                  {u.display_name}
                                  {u.verification_status?.photo_verified && (
                                    <Shield className="w-4 h-4 text-blue-400" />
                                  )}
                                </p>
                                <p className="text-slate-400 text-sm">
                                  {u.gender} {age ? `• ${age}` : ''}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={`${status.color} text-white`}>{status.label}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {u.is_founding_member && <Star className="w-4 h-4 text-yellow-400" />}
                              {u.is_premium && <Crown className="w-4 h-4 text-orange-400" />}
                              <span className="text-slate-300 capitalize">{u.subscription_tier || 'free'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-300">
                            {u.current_city ? `${u.current_city}, ` : ''}{u.current_country}
                          </td>
                          <td className="p-4 text-slate-400">
                            {new Date(u.created_date).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-slate-400">
                            {u.last_active ? new Date(u.last_active).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-slate-400">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                <DropdownMenuItem 
                                  onClick={() => setSelectedUser(u)}
                                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                                >
                                  <Eye className="w-4 h-4 mr-2" /> View Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-700" />
                                {!u.is_banned && (
                                  <DropdownMenuItem 
                                    onClick={() => setActionDialog({ open: true, type: 'suspend', user: u })}
                                    className="text-yellow-400 hover:text-yellow-300 hover:bg-slate-700"
                                  >
                                    <Clock className="w-4 h-4 mr-2" /> Suspend
                                  </DropdownMenuItem>
                                )}
                                {u.is_suspended && (
                                  <DropdownMenuItem 
                                    onClick={() => setActionDialog({ open: true, type: 'unsuspend', user: u })}
                                    className="text-green-400 hover:text-green-300 hover:bg-slate-700"
                                  >
                                    <Check className="w-4 h-4 mr-2" /> Remove Suspension
                                  </DropdownMenuItem>
                                )}
                                {!u.is_banned ? (
                                  <DropdownMenuItem 
                                    onClick={() => setActionDialog({ open: true, type: 'ban', user: u })}
                                    className="text-red-400 hover:text-red-300 hover:bg-slate-700"
                                  >
                                    <Ban className="w-4 h-4 mr-2" /> Ban User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => setActionDialog({ open: true, type: 'unban', user: u })}
                                    className="text-green-400 hover:text-green-300 hover:bg-slate-700"
                                  >
                                    <UserCheck className="w-4 h-4 mr-2" /> Unban User
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="bg-slate-700" />
                                {!u.verification_status?.photo_verified && (
                                  <DropdownMenuItem 
                                    onClick={() => setActionDialog({ open: true, type: 'verify', user: u })}
                                    className="text-blue-400 hover:text-blue-300 hover:bg-slate-700"
                                  >
                                    <Shield className="w-4 h-4 mr-2" /> Verify User
                                  </DropdownMenuItem>
                                )}
                                {!u.is_founding_member && (
                                  <DropdownMenuItem 
                                    onClick={() => setActionDialog({ open: true, type: 'founding', user: u })}
                                    className="text-yellow-400 hover:text-yellow-300 hover:bg-slate-700"
                                  >
                                    <Star className="w-4 h-4 mr-2" /> Grant Founding
                                  </DropdownMenuItem>
                                )}
                                {!u.is_premium && (
                                  <DropdownMenuItem 
                                    onClick={() => setActionDialog({ open: true, type: 'premium', user: u })}
                                    className="text-orange-400 hover:text-orange-300 hover:bg-slate-700"
                                  >
                                    <Crown className="w-4 h-4 mr-2" /> Grant Premium
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-slate-800">
                <p className="text-slate-400 text-sm">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                    className="border-slate-700 text-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-slate-400 px-2">Page {page} of {totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page === totalPages}
                    className="border-slate-700 text-slate-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, user: null })}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionDialog.type === 'ban' && 'Ban User'}
              {actionDialog.type === 'unban' && 'Unban User'}
              {actionDialog.type === 'suspend' && 'Suspend User'}
              {actionDialog.type === 'unsuspend' && 'Remove Suspension'}
              {actionDialog.type === 'verify' && 'Verify User'}
              {actionDialog.type === 'premium' && 'Grant Premium'}
              {actionDialog.type === 'founding' && 'Grant Founding Member'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {actionDialog.user && (
              <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                <Avatar>
                  <AvatarImage src={actionDialog.user.primary_photo} />
                  <AvatarFallback>{actionDialog.user.display_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium">{actionDialog.user.display_name}</p>
                  <p className="text-slate-400 text-sm">ID: {actionDialog.user.id}</p>
                </div>
              </div>
            )}

            {['ban', 'suspend'].includes(actionDialog.type) && (
              <>
                <div>
                  <Label className="text-slate-300">Reason</Label>
                  <Textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Enter reason for this action..."
                    className="mt-2 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                {actionDialog.type === 'suspend' && (
                  <div>
                    <Label className="text-slate-300">Duration</Label>
                    <Select value={actionDuration} onValueChange={setActionDuration}>
                      <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="72">3 days</SelectItem>
                        <SelectItem value="168">7 days</SelectItem>
                        <SelectItem value="336">14 days</SelectItem>
                        <SelectItem value="720">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {['verify', 'premium', 'founding'].includes(actionDialog.type) && (
              <p className="text-slate-300">
                Are you sure you want to {actionDialog.type === 'verify' ? 'verify' : `grant ${actionDialog.type} status to`} this user?
              </p>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setActionDialog({ open: false, type: null, user: null })}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAction}
              disabled={processing || (['ban', 'suspend'].includes(actionDialog.type) && !actionReason)}
              className={
                actionDialog.type === 'ban' ? 'bg-red-500 hover:bg-red-600' :
                actionDialog.type === 'suspend' ? 'bg-yellow-500 hover:bg-yellow-600' :
                'bg-orange-500 hover:bg-orange-600'
              }
            >
              {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Drawer */}
      {selectedUser && (
        <UserDetailDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}

function UserDetailDrawer({ user, onClose }) {
  const [matches, setMatches] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  const loadUserData = async () => {
    try {
      const [userMatches, userReports] = await Promise.all([
        base44.entities.Match.filter({ user1_id: user.id }, '-created_date', 20),
        base44.entities.Report.filter({ reported_id: user.id }, '-created_date', 10)
      ]);
      setMatches(userMatches);
      setReports(userReports);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-800 z-50 shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white">User Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-65px)]">
        <div className="p-4 space-y-6">
          {/* Profile Header */}
          <div className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={user.primary_photo} />
              <AvatarFallback className="text-2xl">{user.display_name?.[0]}</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold text-white">{user.display_name}</h3>
            <p className="text-slate-400">{user.gender} • {user.current_city}, {user.current_country}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              {user.is_premium && <Badge className="bg-orange-500">Premium</Badge>}
              {user.is_founding_member && <Badge className="bg-yellow-500">Founding</Badge>}
              {user.verification_status?.photo_verified && <Badge className="bg-blue-500">Verified</Badge>}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{matches.length}</p>
              <p className="text-xs text-slate-400">Matches</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{user.login_streak || 0}</p>
              <p className="text-xs text-slate-400">Streak</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{reports.length}</p>
              <p className="text-xs text-slate-400">Reports</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-400 uppercase">Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">User ID</span>
                <span className="text-white font-mono text-xs">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Auth ID</span>
                <span className="text-white font-mono text-xs">{user.user_id?.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Joined</span>
                <span className="text-white">{new Date(user.created_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Active</span>
                <span className="text-white">{user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tier</span>
                <span className="text-white capitalize">{user.subscription_tier || 'free'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Religion</span>
                <span className="text-white capitalize">{user.religion?.replace('_', ' ') || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Goal</span>
                <span className="text-white capitalize">{user.relationship_goal?.replace('_', ' ') || 'Not set'}</span>
              </div>
            </div>
          </div>

          {/* Reports against user */}
          {reports.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-400 uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Reports ({reports.length})
              </h4>
              <div className="space-y-2">
                {reports.map(r => (
                  <div key={r.id} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm font-medium capitalize">{r.report_type.replace('_', ' ')}</p>
                    <p className="text-slate-300 text-sm">{r.description}</p>
                    <p className="text-slate-500 text-xs mt-1">{new Date(r.created_date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {user.photos?.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-400 uppercase">Photos ({user.photos.length})</h4>
              <div className="grid grid-cols-3 gap-2">
                {user.photos.map((photo, i) => (
                  <img key={i} src={photo} alt="" className="w-full aspect-square object-cover rounded-lg" />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}