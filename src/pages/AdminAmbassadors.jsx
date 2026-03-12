import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Star, Users, DollarSign, TrendingUp, RefreshCw, Plus,
  Eye, Check, X, MoreVertical, Link2, QrCode, Mail
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { toast } from "sonner";

export default function AdminAmbassadors() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ambassadors, setAmbassadors] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [createDialog, setCreateDialog] = useState(false);
  const [newAmbassador, setNewAmbassador] = useState({
    handle: '',
    display_name: '',
    email: ''
  });

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
      await loadData();
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [ambs, refs, comms] = await Promise.all([
        base44.entities.Ambassador.list('-created_date', 100),
        base44.entities.AmbassadorReferral?.list('-created_date', 500) || [],
        base44.entities.AmbassadorCommission?.list('-created_date', 500) || []
      ]);
      setAmbassadors(ambs);
      setReferrals(refs);
      setCommissions(comms);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const createAmbassador = async () => {
    try {
      const referralCode = `AMBA_${newAmbassador.handle.toUpperCase()}`;
      await base44.entities.Ambassador.create({
        ...newAmbassador,
        referral_code: referralCode,
        referral_link: `https://afrinnect.app/join?ref=${referralCode}`,
        status: 'active',
        tier: 'bronze',
        stats: {
          total_clicks: 0,
          total_signups: 0,
          total_subscribers: 0,
          total_revenue_generated: 0,
          total_commissions_earned: 0,
          total_commissions_paid: 0
        }
      });
      toast.success('Ambassador created');
      setCreateDialog(false);
      setNewAmbassador({ handle: '', display_name: '', email: '' });
      await loadData();
    } catch (error) {
      console.error('Error creating ambassador:', error);
      toast.error('Failed to create ambassador');
    }
  };

  const updateAmbassadorStatus = async (ambassador, status) => {
    try {
      await base44.entities.Ambassador.update(ambassador.id, { status });
      toast.success(`Ambassador ${status}`);
      await loadData();
    } catch (error) {
      console.error('Error updating ambassador:', error);
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: 'bg-amber-600',
      silver: 'bg-slate-400',
      gold: 'bg-yellow-500',
      platinum: 'bg-purple-500'
    };
    return colors[tier] || 'bg-slate-500';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      active: 'bg-green-500',
      suspended: 'bg-red-500',
      terminated: 'bg-slate-500'
    };
    return colors[status] || 'bg-slate-500';
  };

  // Calculate totals
  const totalSignups = referrals.length;
  const totalRevenue = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const pendingPayouts = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.amount || 0), 0);
  const activeAmbassadors = ambassadors.filter(a => a.status === 'active').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar activePage="AdminAmbassadors" />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Ambassador Program</h1>
              <p className="text-sm text-slate-400">Manage referral partners</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setCreateDialog(true)} className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" /> Add Ambassador
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Active Ambassadors</p>
                    <p className="text-2xl font-bold text-white">{activeAmbassadors}</p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Referrals</p>
                    <p className="text-2xl font-bold text-white">{totalSignups}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Commissions</p>
                    <p className="text-2xl font-bold text-white">${totalRevenue.toFixed(0)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Pending Payouts</p>
                    <p className="text-2xl font-bold text-white">${pendingPayouts.toFixed(0)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ambassadors Table */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">All Ambassadors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left p-4 text-slate-400 font-medium">Ambassador</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Tier</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Signups</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Revenue</th>
                      <th className="text-left p-4 text-slate-400 font-medium">Commissions</th>
                      <th className="text-right p-4 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ambassadors.map((amb) => (
                      <tr key={amb.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={amb.profile_image_url} />
                              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-pink-600 text-white">
                                {amb.display_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-white font-medium">{amb.display_name}</p>
                              <p className="text-slate-400 text-sm">@{amb.handle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(amb.status)}>{amb.status}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={getTierColor(amb.tier)}>{amb.tier}</Badge>
                        </td>
                        <td className="p-4 text-white">
                          {amb.stats?.total_signups || 0}
                        </td>
                        <td className="p-4 text-white">
                          ${(amb.stats?.total_revenue_generated || 0).toFixed(0)}
                        </td>
                        <td className="p-4 text-white">
                          ${(amb.stats?.total_commissions_earned || 0).toFixed(0)}
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-slate-400">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                              <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                                <Eye className="w-4 h-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  navigator.clipboard.writeText(amb.referral_link || `https://afrinnect.app/join?ref=${amb.referral_code}`);
                                  toast.success('Link copied');
                                }}
                                className="text-slate-300 hover:text-white hover:bg-slate-700"
                              >
                                <Link2 className="w-4 h-4 mr-2" /> Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-700" />
                              {amb.status === 'active' ? (
                                <DropdownMenuItem 
                                  onClick={() => updateAmbassadorStatus(amb, 'suspended')}
                                  className="text-red-400 hover:text-red-300 hover:bg-slate-700"
                                >
                                  <X className="w-4 h-4 mr-2" /> Suspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => updateAmbassadorStatus(amb, 'active')}
                                  className="text-green-400 hover:text-green-300 hover:bg-slate-700"
                                >
                                  <Check className="w-4 h-4 mr-2" /> Activate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {ambassadors.length === 0 && (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No ambassadors yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Ambassador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-300">Handle (username)</Label>
              <Input
                value={newAmbassador.handle}
                onChange={(e) => setNewAmbassador({ ...newAmbassador, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                placeholder="joelle"
                className="mt-1 bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-slate-500 text-xs mt-1">Referral code will be: AMBA_{newAmbassador.handle.toUpperCase() || 'HANDLE'}</p>
            </div>
            <div>
              <Label className="text-slate-300">Display Name</Label>
              <Input
                value={newAmbassador.display_name}
                onChange={(e) => setNewAmbassador({ ...newAmbassador, display_name: e.target.value })}
                placeholder="Joelle Smith"
                className="mt-1 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Email</Label>
              <Input
                type="email"
                value={newAmbassador.email}
                onChange={(e) => setNewAmbassador({ ...newAmbassador, email: e.target.value })}
                placeholder="joelle@example.com"
                className="mt-1 bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)} className="border-slate-700 text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={createAmbassador}
              disabled={!newAmbassador.handle || !newAmbassador.email}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Create Ambassador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}