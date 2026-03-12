import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, MapPin, Phone, User, Clock, Ban, Flag, MessageSquare, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import AIRecommendations from '@/components/admin/AIRecommendations';
import AutomationStatus from '@/components/admin/AutomationStatus';

export default function SafetyMonitorDashboard() {
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (e) {
        console.error("Failed to fetch admin user", e);
      }
    };
    fetchUser();
  }, []);

  // Fetch all active safety checks
  const { data: activeSafetyChecks = [] } = useQuery({
    queryKey: ['admin-safety-checks'],
    queryFn: () => base44.entities.SafetyCheck.filter(
      { status: { $in: ['active', 'alert_triggered'] } },
      '-created_date'
    ),
    refetchInterval: 5000 // Poll every 5 seconds
  });

  // Fetch flagged messages
  const { data: flaggedMessages = [] } = useQuery({
    queryKey: ['flagged-messages'],
    queryFn: () => base44.entities.Message.filter(
      { is_flagged: true },
      '-created_date',
      50
    ),
    refetchInterval: 10000
  });

  // Fetch AI moderation alerts
  const { data: moderationAlerts = [] } = useQuery({
    queryKey: ['moderation-alerts'],
    queryFn: () => base44.entities.ModerationAction.filter(
      { action_taken: 'pending' },
      '-created_date',
      50
    ),
    refetchInterval: 10000
  });

  const respondToAlertMutation = useMutation({
    mutationFn: async ({ checkId, action, notes }) => {
      const check = activeSafetyChecks.find(c => c.id === checkId);
      
      await base44.entities.SafetyCheck.update(checkId, {
        status: action === 'resolved' ? 'completed' : 'alert_triggered',
        moderator_notes: notes
      });

      // Log admin action
      await base44.entities.AdminAuditLog.create({
        admin_user_id: currentUser?.id || 'unknown_admin',
        admin_email: currentUser?.email || 'unknown_admin@afrinnect.com',
        action_type: 'safety_alert_response',
        target_user_id: check.user_profile_id,
        details: { action, notes }
      });

      // If emergency, contact authorities
      if (action === 'emergency') {
        await base44.integrations.Core.SendEmail({
          to: 'emergency@afrinnect.com',
          subject: '🚨 URGENT: Safety Emergency Escalated',
          body: `Safety check ${checkId} has been escalated to emergency. User: ${check.user_profile_id}. Location: ${check.date_location}. Admin notes: ${notes}`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-safety-checks']);
      setSelectedCheck(null);
      setAdminNotes('');
    }
  });

  const reviewMessageMutation = useMutation({
    mutationFn: async ({ messageId, action }) => {
      await base44.entities.Message.update(messageId, {
        is_flagged: action === 'keep_flagged',
        is_deleted: action === 'delete'
      });

      await base44.entities.AdminAuditLog.create({
        admin_user_id: currentUser?.id || 'unknown_admin',
        admin_email: currentUser?.email || 'unknown_admin@afrinnect.com',
        action_type: 'message_moderation',
        details: { messageId, action }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['flagged-messages']);
    }
  });

  const alerts = activeSafetyChecks.filter(c => c.status === 'alert_triggered');
  const active = activeSafetyChecks.filter(c => c.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Safety Monitor</h2>
          <p className="text-gray-600">Real-time safety check monitoring and AI-powered automation</p>
        </div>
        <Badge className={alerts.length > 0 ? 'bg-red-600 animate-pulse' : 'bg-green-600'}>
          {alerts.length} Active Alerts
        </Badge>
      </div>

      {/* Automation Status */}
      <AutomationStatus />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Checks</p>
                <p className="text-3xl font-bold">{active.length}</p>
              </div>
              <Shield className="text-blue-600" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card className={alerts.length > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emergency Alerts</p>
                <p className="text-3xl font-bold text-red-600">{alerts.length}</p>
              </div>
              <AlertTriangle className="text-red-600" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Flagged Messages</p>
                <p className="text-3xl font-bold">{flaggedMessages.length}</p>
              </div>
              <MessageSquare className="text-amber-600" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Alerts</p>
                <p className="text-3xl font-bold">{moderationAlerts.length}</p>
              </div>
              <Eye className="text-purple-600" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts">
            Emergency Alerts ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Checks ({active.length})
          </TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged Content ({flaggedMessages.length})
          </TabsTrigger>
        </TabsList>

        {/* Emergency Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
                <p className="text-gray-600">No active emergency alerts</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map(check => (
              <motion.div
                key={check.id}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="border-2 border-red-500 rounded-xl overflow-hidden bg-red-50"
              >
                <Card>
                  <CardHeader className="bg-red-100">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-red-900 flex items-center gap-2">
                        <AlertTriangle className="animate-pulse" />
                        EMERGENCY ALERT
                      </CardTitle>
                      <Badge className="bg-red-600 animate-pulse">URGENT</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 font-medium">User ID</p>
                        <p className="text-sm">{check.user_profile_id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Meeting With</p>
                        <p className="text-sm">{check.meeting_with_profile_id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Location</p>
                        <p className="text-sm">{check.date_location}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Alert Time</p>
                        <p className="text-sm">{new Date(check.updated_date).toLocaleString()}</p>
                      </div>
                    </div>

                    {check.panic_location && (
                      <div className="bg-white rounded-lg p-3 border border-red-200">
                        <p className="text-xs text-gray-600 font-medium mb-1">Live Location</p>
                        <a
                          href={`https://maps.google.com/?q=${check.panic_location.lat},${check.panic_location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                        >
                          <MapPin size={14} />
                          {check.panic_location.lat}, {check.panic_location.lng}
                        </a>
                      </div>
                    )}

                    <div className="bg-white rounded-lg p-3 border border-red-200">
                      <p className="text-xs text-gray-600 font-medium mb-1">Emergency Contact</p>
                      <p className="text-sm font-medium">{check.emergency_contact_name}</p>
                      <p className="text-sm text-gray-600">{check.emergency_contact_phone}</p>
                    </div>

                    <div className="flex gap-2 pt-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => setSelectedCheck(check)}
                              variant="outline"
                              size="sm"
                            >
                              Add Notes
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Add administrative notes to this case</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => respondToAlertMutation.mutate({
                                checkId: check.id,
                                action: 'emergency',
                                notes: 'Escalated to emergency services'
                              })}
                              className="bg-red-600 hover:bg-red-700"
                              size="sm"
                            >
                              Escalate to Emergency
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Notify emergency contacts and services immediately</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => respondToAlertMutation.mutate({
                                checkId: check.id,
                                action: 'resolved',
                                notes: 'False alarm - user confirmed safe'
                              })}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              Mark Resolved
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Close this alert as resolved</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* Active Checks Tab */}
        <TabsContent value="active">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {active.map(check => {
                const checkInTime = new Date(check.check_in_time);
                const now = new Date();
                const isOverdue = now >= checkInTime;

                return (
                  <Card key={check.id} className={isOverdue ? 'border-amber-300 bg-amber-50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Shield className={isOverdue ? 'text-amber-600' : 'text-green-600'} size={20} />
                          <span className="font-medium text-sm">User: {check.user_profile_id.slice(0, 8)}...</span>
                        </div>
                        {isOverdue && <Badge className="bg-amber-600">Check-in Overdue</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Location:</span>
                          <p className="font-medium">{check.date_location}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Check-in:</span>
                          <p className="font-medium">{checkInTime.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Flagged Content Tab */}
        <TabsContent value="flagged">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {flaggedMessages.map(msg => (
                <Card key={msg.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="bg-amber-600">AI Flagged</Badge>
                      <p className="text-xs text-gray-500">{new Date(msg.created_date).toLocaleString()}</p>
                    </div>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg mb-3">{msg.content}</p>
                    
                    {/* AI Recommendation */}
                    <AIRecommendations
                      item={msg}
                      type="message"
                      onAction={(action) => {
                        if (action === 'delete') {
                          reviewMessageMutation.mutate({ messageId: msg.id, action: 'delete' });
                        } else if (action === 'clear') {
                          reviewMessageMutation.mutate({ messageId: msg.id, action: 'clear' });
                        }
                      }}
                    />
                    
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={() => reviewMessageMutation.mutate({ messageId: msg.id, action: 'delete' })}
                        variant="destructive"
                        size="sm"
                      >
                        Delete Message
                      </Button>
                      <Button
                        onClick={() => reviewMessageMutation.mutate({ messageId: msg.id, action: 'clear' })}
                        variant="outline"
                        size="sm"
                      >
                        Clear Flag
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Admin Notes Dialog */}
      <Dialog open={!!selectedCheck} onOpenChange={() => setSelectedCheck(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Enter notes about this safety check..."
              rows={4}
            />
            <Button
              onClick={() => respondToAlertMutation.mutate({
                checkId: selectedCheck?.id,
                action: 'resolved',
                notes: adminNotes
              })}
              className="w-full"
            >
              Save Notes & Resolve
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}