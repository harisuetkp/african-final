import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Crown, Users, TrendingUp, AlertTriangle, Copy, Plus, Trash2, 
  UserPlus, UserMinus, Clock, CheckCircle, XCircle, Loader2, Search,
  Calendar, Percent, Gift
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function FounderProgramManagement() {
  const queryClient = useQueryClient();
  const [showAddCodeDialog, setShowAddCodeDialog] = useState(false);
  const [showManageUserDialog, setShowManageUserDialog] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [newCode, setNewCode] = useState({
    code: '',
    max_redemptions: 100,
    trial_days: 183,
    expires_at: ''
  });
  const [manageAction, setManageAction] = useState({ action: '', email: '', trial_days: 183, extend_days: 30 });

  // Fetch settings
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['founder-settings'],
    queryFn: async () => {
      const records = await base44.entities.SystemSettings.filter({ key: 'founder_program' });
      return records[0]?.value || {
        founders_mode_enabled: false,
        auto_assign_new_users: false,
        trial_days: 183
      };
    }
  });

  // Fetch stats - try backend function first, fallback to local calculation
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['founder-stats'],
    queryFn: async () => {
      // Try backend function first (if available)
      try {
        const response = await base44.functions.invoke('getFounderStats', {});
        if (response.success && response.data) {
          return {
            total_founders: response.data.summary?.total || 0,
            active_trials: response.data.summary?.active || 0,
            converted: response.data.summary?.converted || 0,
            churned: response.data.summary?.expired || 0,
            conversion_rate: response.data.summary?.conversionRate || 0,
            trial_ending_soon: response.data.expiringThisWeek || [],
            invite_codes: response.data.inviteCodes || []
          };
        }
      } catch (e) {
        console.log('Backend function unavailable, using local calculation');
      }

      // Fallback: Calculate stats locally
      const [founders, codes, redemptions] = await Promise.all([
        base44.entities.UserProfile.filter({ is_founding_member: true }),
        base44.entities.FounderInviteCode.list('-created_date', 50),
        base44.entities.FounderCodeRedemption.list('-created_date', 100)
      ]);

      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const activeTrials = founders.filter(f => {
        const trialEnd = f.founding_member_trial_ends_at ? new Date(f.founding_member_trial_ends_at) : null;
        return trialEnd && trialEnd > now;
      });

      const converted = founders.filter(f => f.founding_member_converted);
      const churned = founders.filter(f => {
        const trialEnd = f.founding_member_trial_ends_at ? new Date(f.founding_member_trial_ends_at) : null;
        return trialEnd && trialEnd < now && !f.founding_member_converted;
      });

      const trialEndingSoon = founders.filter(f => {
        const trialEnd = f.founding_member_trial_ends_at ? new Date(f.founding_member_trial_ends_at) : null;
        return trialEnd && trialEnd > now && trialEnd < weekFromNow;
      }).map(f => ({
        profile_id: f.id,
        display_name: f.display_name,
        email: f.created_by,
        trial_ends_at: f.founding_member_trial_ends_at,
        days_remaining: Math.ceil((new Date(f.founding_member_trial_ends_at) - now) / (1000 * 60 * 60 * 24))
      }));

      const inviteCodes = codes.map(c => {
        const codeRedemptions = redemptions.filter(r => r.code_id === c.id);
        return {
          code: c.code,
          max: c.max_redemptions,
          redemptions: codeRedemptions.length,
          trial_days: c.trial_days,
          is_active: c.is_active,
          expires_at: c.expires_at
        };
      });

      return {
        total_founders: founders.length,
        active_trials: activeTrials.length,
        converted: converted.length,
        churned: churned.length,
        conversion_rate: founders.length > 0 ? Math.round((converted.length / founders.length) * 100) : 0,
        trial_ending_soon: trialEndingSoon,
        invite_codes: inviteCodes
      };
    }
  });

  // Fetch founding members list
  const { data: foundingMembers, isLoading: loadingMembers } = useQuery({
    queryKey: ['founding-members'],
    queryFn: async () => {
      return await base44.entities.UserProfile.filter({ is_founding_member: true });
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings) => {
      const records = await base44.entities.SystemSettings.filter({ key: 'founder_program' });
      if (records.length > 0) {
        await base44.entities.SystemSettings.update(records[0].id, { value: newSettings });
      } else {
        await base44.entities.SystemSettings.create({
          key: 'founder_program',
          value: newSettings,
          description: 'Founding Member Program Configuration'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['founder-settings'] });
      toast.success('Settings updated');
    }
  });

  // Create invite code mutation
  const createCodeMutation = useMutation({
    mutationFn: async (codeData) => {
      await base44.entities.FounderInviteCode.create({
        code: codeData.code.toUpperCase(),
        max_redemptions: codeData.max_redemptions,
        trial_days: codeData.trial_days,
        expires_at: codeData.expires_at || null,
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['founder-stats'] });
      setShowAddCodeDialog(false);
      setNewCode({ code: '', max_redemptions: 100, trial_days: 183, expires_at: '' });
      toast.success('Invite code created');
    }
  });

  // Manage user mutation - try backend function first, fallback to local
  const manageUserMutation = useMutation({
    mutationFn: async (data) => {
      // Try backend function first
      try {
        const actionMap = {
          'grant': 'grant_status',
          'revoke': 'revoke_status',
          'extend': 'extend_trial'
        };

        // Find profile by email first
        const profiles = await base44.entities.UserProfile.filter({ created_by: data.email });
        if (profiles.length === 0) {
          throw new Error('User not found');
        }
        const profile = profiles[0];

        const response = await base44.functions.invoke('adminManageFounder', {
          action: actionMap[data.action],
          data: {
            userProfileId: profile.id,
            trialDays: data.trial_days,
            additionalDays: data.extend_days
          }
        });

        if (response.success) {
          return { action: `${data.action} completed successfully` };
        }
        throw new Error(response.error || 'Action failed');
      } catch (e) {
        console.log('Backend function unavailable, using local update');
      }

      // Fallback: Local update
      const profiles = await base44.entities.UserProfile.filter({ created_by: data.email });
      if (profiles.length === 0) {
        throw new Error('User not found');
      }
      const profile = profiles[0];

      if (data.action === 'grant') {
        const trialDays = data.trial_days || 183;
        const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
        
        await base44.entities.UserProfile.update(profile.id, {
          is_founding_member: true,
          founding_member_granted_at: new Date().toISOString(),
          founding_member_trial_ends_at: trialEndsAt.toISOString(),
          founding_member_source: 'manual_admin',
          is_premium: true,
          subscription_tier: 'premium',
          premium_until: trialEndsAt.toISOString(),
          badges: [...(profile.badges || []).filter(b => b !== 'founding_member'), 'founding_member']
        });
        return { action: 'Founding member status granted' };
      } else if (data.action === 'revoke') {
        await base44.entities.UserProfile.update(profile.id, {
          is_founding_member: false,
          founding_trial_consumed: true,
          is_premium: false,
          subscription_tier: 'free',
          premium_until: null,
          badges: (profile.badges || []).filter(b => b !== 'founding_member')
        });
        return { action: 'Founding member status revoked' };
      } else if (data.action === 'extend') {
        const currentEnd = profile.founding_member_trial_ends_at 
          ? new Date(profile.founding_member_trial_ends_at) 
          : new Date();
        const newEnd = new Date(currentEnd.getTime() + (data.extend_days || 30) * 24 * 60 * 60 * 1000);
        
        await base44.entities.UserProfile.update(profile.id, {
          founding_member_trial_ends_at: newEnd.toISOString(),
          premium_until: newEnd.toISOString()
        });
        return { action: `Trial extended by ${data.extend_days} days` };
      }
      throw new Error('Invalid action');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['founding-members'] });
      queryClient.invalidateQueries({ queryKey: ['founder-stats'] });
      setShowManageUserDialog(false);
      toast.success(`Action completed: ${data.action}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Action failed');
    }
  });

  const toggleSetting = (key) => {
    if (!settings) return;
    updateSettingsMutation.mutate({ ...settings, [key]: !settings[key] });
  };

  const updateTrialDays = (days) => {
    if (!settings) return;
    updateSettingsMutation.mutate({ ...settings, trial_days: parseInt(days) || 183 });
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'FOUNDER';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode({ ...newCode, code });
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  if (loadingSettings || loadingStats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="text-amber-500" />
            Founding Member Program
          </h2>
          <p className="text-gray-500">Manage founding member settings, invite codes, and track conversions</p>
        </div>
      </div>

      {/* Main Toggle Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className={`border-2 ${settings?.founders_mode_enabled ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Founders Mode</h3>
                <p className="text-sm text-gray-500">Enable founding member program</p>
              </div>
              <Switch 
                checked={settings?.founders_mode_enabled || false}
                onCheckedChange={() => toggleSetting('founders_mode_enabled')}
              />
            </div>
            <Badge className={`mt-3 ${settings?.founders_mode_enabled ? 'bg-green-600' : 'bg-gray-400'}`}>
              {settings?.founders_mode_enabled ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </CardContent>
        </Card>

        <Card className={`border-2 ${settings?.auto_assign_new_users ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Auto-Assign New Users</h3>
                <p className="text-sm text-gray-500">Automatically grant to all new signups</p>
              </div>
              <Switch 
                checked={settings?.auto_assign_new_users || false}
                onCheckedChange={() => toggleSetting('auto_assign_new_users')}
                disabled={!settings?.founders_mode_enabled}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              When off, only invite codes grant status
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">Trial Length</h3>
                <p className="text-sm text-gray-500">Days of free premium</p>
              </div>
              <Calendar className="text-gray-400" size={20} />
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings?.trial_days || 183}
                onChange={(e) => updateTrialDays(e.target.value)}
                className="w-24"
                min={1}
                max={365}
              />
              <span className="text-gray-500">days</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              ≈ {Math.round((settings?.trial_days || 183) / 30)} months
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="mx-auto text-purple-600 mb-2" size={24} />
            <div className="text-2xl font-bold">{stats?.total_founders || 0}</div>
            <div className="text-xs text-gray-500">Total Founders</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto text-blue-600 mb-2" size={24} />
            <div className="text-2xl font-bold">{stats?.active_trials || 0}</div>
            <div className="text-xs text-gray-500">Active Trials</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="mx-auto text-green-600 mb-2" size={24} />
            <div className="text-2xl font-bold">{stats?.converted || 0}</div>
            <div className="text-xs text-gray-500">Converted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="mx-auto text-red-600 mb-2" size={24} />
            <div className="text-2xl font-bold">{stats?.churned || 0}</div>
            <div className="text-xs text-gray-500">Churned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Percent className="mx-auto text-amber-600 mb-2" size={24} />
            <div className="text-2xl font-bold">{stats?.conversion_rate || 0}%</div>
            <div className="text-xs text-gray-500">Conversion Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="codes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="codes">Invite Codes</TabsTrigger>
          <TabsTrigger value="members">Founding Members</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
        </TabsList>

        {/* Invite Codes Tab */}
        <TabsContent value="codes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Invite Codes</h3>
            <Dialog open={showAddCodeDialog} onOpenChange={setShowAddCodeDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus size={16} /> Create Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Invite Code</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Code</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newCode.code}
                        onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                        placeholder="FOUNDER2026"
                      />
                      <Button variant="outline" onClick={generateRandomCode}>Generate</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Max Redemptions</Label>
                      <Input
                        type="number"
                        value={newCode.max_redemptions}
                        onChange={(e) => setNewCode({ ...newCode, max_redemptions: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Trial Days</Label>
                      <Input
                        type="number"
                        value={newCode.trial_days}
                        onChange={(e) => setNewCode({ ...newCode, trial_days: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Expires At (optional)</Label>
                    <Input
                      type="datetime-local"
                      value={newCode.expires_at}
                      onChange={(e) => setNewCode({ ...newCode, expires_at: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddCodeDialog(false)}>Cancel</Button>
                  <Button 
                    onClick={() => createCodeMutation.mutate(newCode)}
                    disabled={!newCode.code || createCodeMutation.isPending}
                  >
                    {createCodeMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                    Create Code
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Redemptions</TableHead>
                <TableHead>Trial Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.invite_codes?.map((code) => (
                <TableRow key={code.code}>
                  <TableCell className="font-mono font-bold">{code.code}</TableCell>
                  <TableCell>{code.redemptions} / {code.max}</TableCell>
                  <TableCell>{code.trial_days || settings?.trial_days} days</TableCell>
                  <TableCell>
                    <Badge className={code.is_active ? 'bg-green-600' : 'bg-gray-400'}>
                      {code.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {code.expires_at ? format(new Date(code.expires_at), 'MMM d, yyyy') : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => copyCode(code.code)}>
                      <Copy size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!stats?.invite_codes || stats.invite_codes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No invite codes yet. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Founding Members ({foundingMembers?.length || 0})</h3>
            <Dialog open={showManageUserDialog} onOpenChange={setShowManageUserDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <UserPlus size={16} /> Manage User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage Founding Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>User Email</Label>
                    <Input
                      value={manageAction.email}
                      onChange={(e) => setManageAction({ ...manageAction, email: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant={manageAction.action === 'grant' ? 'default' : 'outline'}
                      onClick={() => setManageAction({ ...manageAction, action: 'grant' })}
                      className="flex-col h-auto py-3"
                    >
                      <UserPlus size={20} />
                      <span className="text-xs mt-1">Grant</span>
                    </Button>
                    <Button 
                      variant={manageAction.action === 'revoke' ? 'default' : 'outline'}
                      onClick={() => setManageAction({ ...manageAction, action: 'revoke' })}
                      className="flex-col h-auto py-3"
                    >
                      <UserMinus size={20} />
                      <span className="text-xs mt-1">Revoke</span>
                    </Button>
                    <Button 
                      variant={manageAction.action === 'extend' ? 'default' : 'outline'}
                      onClick={() => setManageAction({ ...manageAction, action: 'extend' })}
                      className="flex-col h-auto py-3"
                    >
                      <Clock size={20} />
                      <span className="text-xs mt-1">Extend</span>
                    </Button>
                  </div>
                  {manageAction.action === 'grant' && (
                    <div>
                      <Label>Trial Days</Label>
                      <Input
                        type="number"
                        value={manageAction.trial_days}
                        onChange={(e) => setManageAction({ ...manageAction, trial_days: parseInt(e.target.value) })}
                      />
                    </div>
                  )}
                  {manageAction.action === 'extend' && (
                    <div>
                      <Label>Extend By (days)</Label>
                      <Input
                        type="number"
                        value={manageAction.extend_days}
                        onChange={(e) => setManageAction({ ...manageAction, extend_days: parseInt(e.target.value) })}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowManageUserDialog(false)}>Cancel</Button>
                  <Button 
                    onClick={() => manageUserMutation.mutate(manageAction)}
                    disabled={!manageAction.email || !manageAction.action || manageUserMutation.isPending}
                  >
                    {manageUserMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                    Execute
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Granted</TableHead>
                <TableHead>Trial Ends</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foundingMembers?.slice(0, 50).map((member) => {
                const trialEnd = member.founding_member_trial_ends_at ? new Date(member.founding_member_trial_ends_at) : null;
                const isExpired = trialEnd && trialEnd < new Date();
                
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{member.display_name}</div>
                        <div className="text-xs text-gray-500">{member.created_by}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {member.founding_member_source || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.founding_member_granted_at 
                        ? format(new Date(member.founding_member_granted_at), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {trialEnd ? format(trialEnd, 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {member.founding_member_converted ? (
                        <Badge className="bg-green-600">Converted</Badge>
                      ) : isExpired ? (
                        <Badge className="bg-red-600">Expired</Badge>
                      ) : (
                        <Badge className="bg-blue-600">Active Trial</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!foundingMembers || foundingMembers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    No founding members yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Expiring Soon Tab */}
        <TabsContent value="expiring" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-amber-500" size={20} />
            <h3 className="font-semibold">Trials Expiring in 7 Days</h3>
          </div>

          {stats?.trial_ending_soon?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Days Remaining</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.trial_ending_soon.map((user) => (
                  <TableRow key={user.profile_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.display_name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.days_remaining <= 3 ? 'bg-red-600' : 'bg-amber-600'}>
                        {user.days_remaining} days
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.trial_ends_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setManageAction({ action: 'extend', email: user.email, extend_days: 30 });
                          setShowManageUserDialog(true);
                        }}
                      >
                        Extend
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
                No trials expiring in the next 7 days
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}