import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, XCircle, Eye, Ban, MessageCircle, Image, Flag, Clock, History, EyeOff } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ModerationCenter({ reports, onResolveReport }) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [viewingContent, setViewingContent] = useState(null);
  const [blurContent, setBlurContent] = useState(true);
  const [historyDialog, setHistoryDialog] = useState({ open: false, userId: null });
  const [muteDialog, setMuteDialog] = useState({ open: false, report: null });
  const [muteDuration, setMuteDuration] = useState(24);

  const { data: moderationHistory = [] } = useQuery({
    queryKey: ['moderation-history', historyDialog.userId],
    queryFn: () => base44.entities.ModerationAction.filter(
      { user_profile_id: historyDialog.userId },
      '-created_date',
      100
    ),
    enabled: !!historyDialog.userId
  });

  const reportsByStatus = {
    pending: reports.filter(r => r.status === 'pending'),
    under_review: reports.filter(r => r.status === 'under_review'),
    resolved: reports.filter(r => r.status === 'resolved')
  };

  const reportTypeColors = {
    fake_profile: 'bg-orange-600',
    harassment: 'bg-red-600',
    inappropriate_content: 'bg-purple-600',
    scam: 'bg-red-700',
    underage: 'bg-red-800',
    spam: 'bg-yellow-600',
    hate_speech: 'bg-red-900',
    other: 'bg-gray-600'
  };

  const handleResolve = async (report, action) => {
    onResolveReport({
      reportId: report.id,
      action,
      notes: moderatorNotes
    });

    // Log moderation action
    const currentUser = await base44.auth.me();
    await base44.entities.ModerationAction.create({
      user_profile_id: report.reported_id,
      moderator_id: currentUser.id,
      action_type: action,
      reason: moderatorNotes || report.report_type,
      related_report_id: report.id
    });

    // Update user's violation tracking
    const reportedProfile = await base44.entities.UserProfile.filter({ id: report.reported_id });
    if (reportedProfile.length > 0) {
      const profile = reportedProfile[0];
      const violationCount = (profile.violation_count || 0) + 1;
      const warningCount = action === 'warning' ? (profile.warning_count || 0) + 1 : (profile.warning_count || 0);
      
      let updateData = {
        violation_count: violationCount,
        warning_count: warningCount
      };

      // Auto-escalation logic
      if (action === 'warning' && warningCount >= 2 && !profile.is_suspended) {
        // 2nd warning = 7 day suspension
        updateData.is_suspended = true;
        updateData.suspension_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        updateData.suspension_reason = 'Automatic suspension after 2 warnings';
        
        await base44.entities.Notification.create({
          user_profile_id: report.reported_id,
          type: 'suspension',
          title: 'Account Suspended',
          message: 'Your account has been suspended for 7 days due to multiple violations.'
        });
      } else if (action === 'temporary_ban' || (action === 'warning' && violationCount >= 3)) {
        // 3rd violation or temp ban = permanent ban
        updateData.is_banned = true;
        updateData.is_active = false;
        updateData.ban_reason = moderatorNotes || 'Multiple community guideline violations';
        
        await base44.entities.Notification.create({
          user_profile_id: report.reported_id,
          type: 'ban',
          title: 'Account Permanently Banned',
          message: 'Your account has been permanently banned due to serious or repeated violations.'
        });
      } else if (action === 'permanent_ban') {
        updateData.is_banned = true;
        updateData.is_active = false;
        updateData.ban_reason = moderatorNotes || report.report_type;
      }

      await base44.entities.UserProfile.update(report.reported_id, updateData);
    }

    setModeratorNotes('');
    setSelectedReport(null);
  };

  const handleMute = async () => {
    const currentUser = await base44.auth.me();
    const expiresAt = new Date(Date.now() + muteDuration * 60 * 60 * 1000).toISOString();
    
    await base44.entities.ModerationAction.create({
      user_profile_id: muteDialog.report.reported_id,
      moderator_id: currentUser.id,
      action_type: 'temporary_mute',
      reason: moderatorNotes || 'Temporary mute',
      related_report_id: muteDialog.report.id,
      duration_hours: muteDuration,
      expires_at: expiresAt
    });

    handleResolve(muteDialog.report, 'temporary_mute');
    setMuteDialog({ open: false, report: null });
  };

  const calculateSLA = (createdDate) => {
    const created = new Date(createdDate);
    const now = new Date();
    const hoursElapsed = Math.floor((now - created) / (1000 * 60 * 60));
    const slaHours = 24; // 24 hour SLA
    const remaining = slaHours - hoursElapsed;
    const status = remaining > 12 ? 'good' : remaining > 0 ? 'warning' : 'overdue';
    return { hoursElapsed, remaining, status };
  };

  return (
    <div className="space-y-6">
      {/* SLA Alert */}
      {reports.filter(r => r.status === 'pending' && calculateSLA(r.created_date).status === 'overdue').length > 0 && (
        <Card className="border-red-600 bg-red-50 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock size={24} className="text-red-600" />
              <div>
                <p className="font-semibold text-red-900">
                  {reports.filter(r => r.status === 'pending' && calculateSLA(r.created_date).status === 'overdue').length} reports past SLA deadline
                </p>
                <p className="text-sm text-red-700">Immediate attention required</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{reportsByStatus.pending.length}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye size={24} className="text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{reportsByStatus.under_review.length}</p>
                <p className="text-sm text-gray-600">Under Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-green-600" />
              <div>
                <p className="text-2xl font-bold">{reportsByStatus.resolved.length}</p>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Ban size={24} className="text-red-600" />
              <div>
                <p className="text-2xl font-bold">{reports.filter(r => r.action_taken === 'permanent_ban').length}</p>
                <p className="text-sm text-gray-600">Bans Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag size={20} />
            Report Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="grid grid-cols-3 w-full mb-6">
              <TabsTrigger value="pending">
                Pending ({reportsByStatus.pending.length})
              </TabsTrigger>
              <TabsTrigger value="under_review">
                Under Review ({reportsByStatus.under_review.length})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved ({reportsByStatus.resolved.length})
              </TabsTrigger>
            </TabsList>

            {['pending', 'under_review', 'resolved'].map(status => (
              <TabsContent key={status} value={status}>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {reportsByStatus[status].map(report => {
                    const sla = calculateSLA(report.created_date);
                    return (
                    <div key={report.id} className={`p-4 rounded-lg border ${sla.status === 'overdue' ? 'bg-red-50 border-red-300' : 'bg-gray-50'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={reportTypeColors[report.report_type] || 'bg-gray-600'}>
                              {report.report_type.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline">
                              {new Date(report.created_date).toLocaleDateString()}
                            </Badge>
                            {status === 'pending' && (
                              <Badge className={
                                sla.status === 'good' ? 'bg-green-600' :
                                sla.status === 'warning' ? 'bg-orange-600' :
                                'bg-red-600'
                              }>
                                <Clock size={12} className="mr-1" />
                                {sla.status === 'overdue' ? `${Math.abs(sla.remaining)}h overdue` : `${sla.remaining}h left`}
                              </Badge>
                            )}
                          </div>
                          <p className="font-semibold text-gray-900 mb-1">
                            Reported User: {report.reported_id}
                          </p>
                          <p className="text-sm text-gray-600">
                            Reporter: {report.reporter_id}
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-xs"
                            onClick={() => setHistoryDialog({ open: true, userId: report.reported_id })}
                          >
                            <History size={12} className="mr-1" />
                            View History
                          </Button>
                        </div>
                        <Badge className={
                          status === 'pending' ? 'bg-yellow-600' :
                          status === 'under_review' ? 'bg-blue-600' :
                          'bg-green-600'
                        }>
                          {status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 mb-3 p-3 bg-white rounded border">
                        {report.description}
                      </p>

                      {report.evidence_urls && report.evidence_urls.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-600">Evidence:</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBlurContent(!blurContent)}
                              className="text-xs"
                            >
                              {blurContent ? <Eye size={14} className="mr-1" /> : <EyeOff size={14} className="mr-1" />}
                              {blurContent ? 'Unblur' : 'Blur'}
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            {report.evidence_urls.map((url, idx) => (
                              <div key={idx} className="relative">
                                <img
                                  src={url}
                                  alt="Evidence"
                                  className={`w-20 h-20 object-cover rounded border cursor-pointer ${blurContent ? 'blur-lg' : ''}`}
                                  onClick={() => {
                                    setViewingContent(url);
                                    setBlurContent(false);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {status !== 'resolved' && (
                        <div className="mt-4 space-y-3">
                          <Textarea
                            placeholder="Moderator notes..."
                            value={selectedReport === report.id ? moderatorNotes : ''}
                            onChange={(e) => {
                              setSelectedReport(report.id);
                              setModeratorNotes(e.target.value);
                            }}
                            className="h-20"
                          />
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              className="bg-yellow-600 hover:bg-yellow-700"
                              onClick={() => handleResolve(report, 'warning')}
                            >
                              Issue Warning
                            </Button>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => setMuteDialog({ open: true, report })}
                            >
                              Temporary Mute
                            </Button>
                            <Button
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700"
                              onClick={() => handleResolve(report, 'temporary_ban')}
                            >
                              Temporary Ban
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleResolve(report, 'permanent_ban')}
                            >
                              Permanent Ban
                            </Button>
                            <Button
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                              onClick={() => handleResolve(report, 'content_removed')}
                            >
                              Remove Content
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolve(report, 'none')}
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      )}

                      {status === 'resolved' && (
                        <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                          <p className="text-sm text-green-800">
                            <strong>Action Taken:</strong> {report.action_taken?.replace('_', ' ')}
                          </p>
                          {report.moderator_notes && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Notes:</strong> {report.moderator_notes}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Resolved by {report.resolved_by} on {new Date(report.resolved_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                  })}
                  {reportsByStatus[status].length === 0 && (
                    <p className="text-center text-gray-500 py-8">No reports in this category</p>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Content Viewer Dialog */}
      <Dialog open={!!viewingContent} onOpenChange={() => setViewingContent(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Evidence Content</DialogTitle>
          </DialogHeader>
          {viewingContent && (
            <img src={viewingContent} alt="Evidence" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* Mute Dialog */}
      <Dialog open={muteDialog.open} onOpenChange={(open) => setMuteDialog({ ...muteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporary Mute User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Duration (hours)</Label>
              <Input
                type="number"
                value={muteDuration}
                onChange={(e) => setMuteDuration(Number(e.target.value))}
                min={1}
                max={720}
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={moderatorNotes}
                onChange={(e) => setModeratorNotes(e.target.value)}
                placeholder="Reason for mute..."
              />
            </div>
            <Button onClick={handleMute} className="w-full">
              Confirm Mute
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Moderation History Dialog */}
      <Dialog open={historyDialog.open} onOpenChange={(open) => setHistoryDialog({ ...historyDialog, open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Moderation History</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {moderationHistory.map(action => (
              <div key={action.id} className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={
                    action.action_type === 'warning' ? 'bg-yellow-600' :
                    action.action_type === 'temporary_mute' ? 'bg-blue-600' :
                    action.action_type === 'temporary_ban' ? 'bg-orange-600' :
                    action.action_type === 'permanent_ban' ? 'bg-red-600' :
                    'bg-purple-600'
                  }>
                    {action.action_type.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(action.created_date).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{action.reason}</p>
                {action.duration_hours && (
                  <p className="text-xs text-gray-500 mt-1">
                    Duration: {action.duration_hours}h
                    {action.expires_at && ` • Expires: ${new Date(action.expires_at).toLocaleString()}`}
                  </p>
                )}
              </div>
            ))}
            {moderationHistory.length === 0 && (
              <p className="text-center text-gray-500 py-8">No moderation history</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}