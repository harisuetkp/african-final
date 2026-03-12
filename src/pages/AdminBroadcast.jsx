import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Megaphone, Send, Users, Crown, Star, RefreshCw, Bell,
  CheckCircle, AlertCircle, Clock, Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { toast } from "sonner";

export default function AdminBroadcast() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(false);
  
  const [broadcast, setBroadcast] = useState({
    title: '',
    message: '',
    type: 'admin_message',
    targetAudience: 'all',
    targetTiers: [],
    targetCountries: [],
    linkTo: ''
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
      setUser(currentUser);
      await loadData();
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [profs, history] = await Promise.all([
        base44.entities.UserProfile.list('-created_date', 2000),
        base44.entities.BroadcastMessage?.list('-created_date', 20) || []
      ]);
      setProfiles(profs.filter(p => p.is_active && !p.is_banned));
      setBroadcastHistory(history);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const getTargetCount = () => {
    let targets = profiles;
    
    if (broadcast.targetAudience === 'premium') {
      targets = targets.filter(p => p.is_premium);
    } else if (broadcast.targetAudience === 'free') {
      targets = targets.filter(p => !p.is_premium);
    } else if (broadcast.targetAudience === 'founding') {
      targets = targets.filter(p => p.is_founding_member);
    }
    
    if (broadcast.targetTiers?.length > 0) {
      targets = targets.filter(p => broadcast.targetTiers.includes(p.subscription_tier || 'free'));
    }
    
    if (broadcast.targetCountries?.length > 0) {
      targets = targets.filter(p => broadcast.targetCountries.includes(p.current_country));
    }
    
    return targets;
  };

  const targetUsers = getTargetCount();

  const sendBroadcast = async () => {
    setSending(true);
    try {
      // Create notifications for all target users
      const notifications = targetUsers.map(profile => ({
        user_profile_id: profile.id,
        user_id: profile.user_id,
        type: broadcast.type,
        title: broadcast.title,
        message: broadcast.message,
        link_to: broadcast.linkTo || null,
        is_admin: true,
        is_read: false
      }));

      // Batch create (in chunks of 50)
      for (let i = 0; i < notifications.length; i += 50) {
        const batch = notifications.slice(i, i + 50);
        await base44.entities.Notification.bulkCreate(batch);
      }

      // Record broadcast
      if (base44.entities.BroadcastMessage) {
        await base44.entities.BroadcastMessage.create({
          title: broadcast.title,
          message: broadcast.message,
          target_audience: broadcast.targetAudience,
          recipients_count: targetUsers.length,
          sent_by: user.email,
          sent_at: new Date().toISOString()
        });
      }

      toast.success(`Broadcast sent to ${targetUsers.length} users`);
      setBroadcast({
        title: '',
        message: '',
        type: 'admin_message',
        targetAudience: 'all',
        targetTiers: [],
        targetCountries: [],
        linkTo: ''
      });
      setConfirmDialog(false);
      await loadData();
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast.error('Failed to send broadcast');
    }
    setSending(false);
  };

  // Get unique countries
  const countries = [...new Set(profiles.map(p => p.current_country).filter(Boolean))].sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar activePage="AdminBroadcast" />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Broadcast Messages</h1>
              <p className="text-sm text-slate-400">Send notifications to users</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Compose */}
            <Card className="bg-slate-900 border-slate-800 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-orange-400" />
                  Compose Broadcast
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300">Title</Label>
                  <Input
                    value={broadcast.title}
                    onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                    placeholder="Notification title..."
                    className="mt-1 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-300">Message</Label>
                  <Textarea
                    value={broadcast.message}
                    onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
                    placeholder="Write your message..."
                    rows={4}
                    className="mt-1 bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Link To (optional)</Label>
                  <Select 
                    value={broadcast.linkTo} 
                    onValueChange={(v) => setBroadcast({ ...broadcast, linkTo: v })}
                  >
                    <SelectTrigger className="mt-1 bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select destination page" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value={null}>None</SelectItem>
                      <SelectItem value="Discover">Discover</SelectItem>
                      <SelectItem value="Matches">Matches</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Profile">Profile</SelectItem>
                      <SelectItem value="Settings">Settings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <Label className="text-slate-300 mb-3 block">Target Audience</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { value: 'all', label: 'All Users', icon: Users },
                      { value: 'premium', label: 'Premium Only', icon: Crown },
                      { value: 'free', label: 'Free Only', icon: Users },
                      { value: 'founding', label: 'Founding', icon: Star },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setBroadcast({ ...broadcast, targetAudience: opt.value })}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                          broadcast.targetAudience === opt.value
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <opt.icon className="w-4 h-4" />
                        <span className="text-sm">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Filter by Country (optional)</Label>
                  <Select
                    value={broadcast.targetCountries[0] || ''}
                    onValueChange={(v) => setBroadcast({ 
                      ...broadcast, 
                      targetCountries: v ? [v] : [] 
                    })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="All countries" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                      <SelectItem value={null}>All Countries</SelectItem>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-400" />
                    <span className="text-white font-medium">{targetUsers.length}</span>
                    <span className="text-slate-400">recipients</span>
                  </div>
                  <Button
                    onClick={() => setConfirmDialog(true)}
                    disabled={!broadcast.title || !broadcast.message || targetUsers.length === 0}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Broadcast
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats & History */}
            <div className="space-y-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Audience Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Active Users</span>
                    <span className="text-white font-medium">{profiles.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Premium Users</span>
                    <span className="text-white font-medium">{profiles.filter(p => p.is_premium).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Founding Members</span>
                    <span className="text-white font-medium">{profiles.filter(p => p.is_founding_member).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Free Users</span>
                    <span className="text-white font-medium">{profiles.filter(p => !p.is_premium).length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Recent Broadcasts</CardTitle>
                </CardHeader>
                <CardContent>
                  {broadcastHistory.length > 0 ? (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-3">
                        {broadcastHistory.map((msg) => (
                          <div key={msg.id} className="p-3 bg-slate-800 rounded-lg">
                            <p className="text-white font-medium text-sm">{msg.title}</p>
                            <p className="text-slate-400 text-xs mt-1">
                              {msg.recipients_count} recipients • {new Date(msg.sent_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-slate-400 text-center py-4">No broadcasts yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Broadcast</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <p className="text-white font-medium">{broadcast.title}</p>
              <p className="text-slate-300 text-sm mt-2">{broadcast.message}</p>
            </div>
            <div className="flex items-center gap-2 text-orange-400">
              <AlertCircle className="w-5 h-5" />
              <span>This will send notifications to <strong>{targetUsers.length}</strong> users</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)} className="border-slate-700 text-slate-300">
              Cancel
            </Button>
            <Button onClick={sendBroadcast} disabled={sending} className="bg-orange-500 hover:bg-orange-600">
              {sending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send to {targetUsers.length} users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}