import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Shield, AlertTriangle, Flag, Eye, Ban, Check, X, Clock,
  MessageSquare, Image, RefreshCw, ChevronRight, User, Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminModeration() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [photoQueue, setPhotoQueue] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportedUser, setReportedUser] = useState(null);
  const [reporterUser, setReporterUser] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, action: null });
  const [moderatorNotes, setModeratorNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedReport) {
      loadReportUsers();
    }
  }, [selectedReport]);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser || currentUser.role !== 'admin') {
        navigate(createPageUrl('Home'));
        return;
      }
      setUser(currentUser);
      await loadReports();
    } catch (error) {
      navigate(createPageUrl('Home'));
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const allReports = await base44.entities.Report.list('-created_date', 200);
      setReports(allReports);

      // Load photo moderation queue
      const photos = await base44.entities.PhotoModeration?.list('-created_date', 50) || [];
      setPhotoQueue(photos.filter(p => p.status === 'pending'));
    } catch (error) {
      console.error('Error loading reports:', error);
    }
    setLoading(false);
  };

  const loadReportUsers = async () => {
    try {
      const [reported, reporter] = await Promise.all([
        base44.entities.UserProfile.filter({ id: selectedReport.reported_id }),
        base44.entities.UserProfile.filter({ id: selectedReport.reporter_id })
      ]);
      setReportedUser(reported[0] || null);
      setReporterUser(reporter[0] || null);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const filteredReports = reports.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (typeFilter !== 'all' && r.report_type !== typeFilter) return false;
    return true;
  });

  const handleReportAction = async (action) => {
    if (!selectedReport) return;
    setProcessing(true);

    try {
      const updateData = {
        status: action === 'dismiss' ? 'dismissed' : 'resolved',
        action_taken: action,
        moderator_notes: moderatorNotes,
        resolved_by: user.id,
        resolved_at: new Date().toISOString()
      };

      await base44.entities.Report.update(selectedReport.id, updateData);

      // Take action on user if needed
      if (reportedUser && ['warning', 'temporary_ban', 'permanent_ban'].includes(action)) {
        const userUpdate = {};
        
        if (action === 'warning') {
          userUpdate.warning_count = (reportedUser.warning_count || 0) + 1;
        } else if (action === 'temporary_ban') {
          userUpdate.is_suspended = true;
          userUpdate.suspension_reason = `Report: ${selectedReport.report_type}`;
          userUpdate.suspension_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (action === 'permanent_ban') {
          userUpdate.is_banned = true;
          userUpdate.ban_reason = `Report: ${selectedReport.report_type}`;
          userUpdate.is_active = false;
        }

        await base44.entities.UserProfile.update(reportedUser.id, userUpdate);

        // Create moderation action
        await base44.entities.ModerationAction.create({
          user_profile_id: reportedUser.id,
          moderator_id: user.id,
          action_type: action,
          reason: moderatorNotes || `Action from report: ${selectedReport.report_type}`,
          related_report_id: selectedReport.id,
          is_active: true
        });
      }

      await loadReports();
      setSelectedReport(null);
      setModeratorNotes("");
      setActionDialog({ open: false, action: null });
    } catch (error) {
      console.error('Error handling report:', error);
    }
    setProcessing(false);
  };

  const getReportTypeColor = (type) => {
    const colors = {
      fake_profile: 'bg-purple-500',
      harassment: 'bg-red-500',
      inappropriate_content: 'bg-orange-500',
      scam: 'bg-red-600',
      underage: 'bg-red-700',
      spam: 'bg-yellow-500',
      hate_speech: 'bg-red-500',
      other: 'bg-slate-500'
    };
    return colors[type] || 'bg-slate-500';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      under_review: 'bg-blue-500',
      resolved: 'bg-green-500',
      dismissed: 'bg-slate-500'
    };
    return colors[status] || 'bg-slate-500';
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
      <AdminSidebar activePage="AdminModeration" pendingReports={reports.filter(r => r.status === 'pending').length} />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Content Moderation</h1>
              <p className="text-sm text-slate-400">
                {reports.filter(r => r.status === 'pending').length} reports pending review
              </p>
            </div>
            <Button onClick={loadReports} className="bg-orange-500 hover:bg-orange-600">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Pending', value: reports.filter(r => r.status === 'pending').length, color: 'yellow' },
              { label: 'Under Review', value: reports.filter(r => r.status === 'under_review').length, color: 'blue' },
              { label: 'Resolved', value: reports.filter(r => r.status === 'resolved').length, color: 'green' },
              { label: 'Dismissed', value: reports.filter(r => r.status === 'dismissed').length, color: 'slate' },
            ].map((stat, i) => (
              <Card key={i} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="reports" className="space-y-6">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="reports" className="data-[state=active]:bg-orange-500">
                Reports ({filteredReports.length})
              </TabsTrigger>
              <TabsTrigger value="photos" className="data-[state=active]:bg-orange-500">
                Photo Queue ({photoQueue.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reports">
              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="fake_profile">Fake Profile</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                    <SelectItem value="scam">Scam</SelectItem>
                    <SelectItem value="underage">Underage</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="hate_speech">Hate Speech</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reports List */}
              <div className="grid md:grid-cols-2 gap-4">
                {filteredReports.map((report) => (
                  <Card 
                    key={report.id} 
                    className={`bg-slate-900 border-slate-800 cursor-pointer hover:border-orange-500/50 transition-colors ${
                      selectedReport?.id === report.id ? 'border-orange-500' : ''
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getReportTypeColor(report.report_type)}>
                            {report.report_type.replace('_', ' ')}
                          </Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      </div>
                      <p className="text-white text-sm line-clamp-2 mb-2">{report.description}</p>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Report #{report.id.slice(-6)}</span>
                        <span>{new Date(report.created_date).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredReports.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No reports found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="photos">
              <div className="grid md:grid-cols-3 gap-4">
                {photoQueue.map((photo) => (
                  <Card key={photo.id} className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4">
                      <img 
                        src={photo.photo_url} 
                        alt="Review" 
                        className="w-full aspect-square object-cover rounded-lg mb-3"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600">
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" className="flex-1 bg-red-500 hover:bg-red-600">
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {photoQueue.length === 0 && (
                <div className="text-center py-12">
                  <Image className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No photos pending review</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Report Detail Panel */}
      {selectedReport && (
        <div className="w-96 bg-slate-900 border-l border-slate-800 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <h2 className="font-bold text-white">Report Details</h2>
            <Button variant="ghost" size="icon" onClick={() => setSelectedReport(null)}>
              <X className="w-5 h-5 text-slate-400" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Report Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={getReportTypeColor(selectedReport.report_type)}>
                    {selectedReport.report_type.replace('_', ' ')}
                  </Badge>
                  <Badge className={getStatusColor(selectedReport.status)}>
                    {selectedReport.status}
                  </Badge>
                </div>
                <p className="text-white">{selectedReport.description}</p>
                <p className="text-slate-400 text-sm">
                  Submitted {new Date(selectedReport.created_date).toLocaleString()}
                </p>
              </div>

              {/* Reported User */}
              {reportedUser && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-400 uppercase">Reported User</h3>
                  <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                    <Avatar>
                      <AvatarImage src={reportedUser.primary_photo} />
                      <AvatarFallback>{reportedUser.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-white font-medium">{reportedUser.display_name}</p>
                      <p className="text-slate-400 text-sm">
                        {reportedUser.violation_count || 0} violations • {reportedUser.warning_count || 0} warnings
                      </p>
                    </div>
                    {reportedUser.is_banned && <Badge className="bg-red-500">Banned</Badge>}
                  </div>
                </div>
              )}

              {/* Reporter */}
              {reporterUser && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-400 uppercase">Reported By</h3>
                  <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                    <Avatar>
                      <AvatarImage src={reporterUser.primary_photo} />
                      <AvatarFallback>{reporterUser.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-medium">{reporterUser.display_name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Evidence */}
              {selectedReport.evidence_urls?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-400 uppercase">Evidence</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedReport.evidence_urls.map((url, i) => (
                      <img key={i} src={url} alt="Evidence" className="w-full rounded-lg" />
                    ))}
                  </div>
                </div>
              )}

              {/* Moderator Notes */}
              {selectedReport.status === 'pending' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Moderator Notes</Label>
                  <Textarea
                    value={moderatorNotes}
                    onChange={(e) => setModeratorNotes(e.target.value)}
                    placeholder="Add notes about this report..."
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              )}

              {/* Previous Notes */}
              {selectedReport.moderator_notes && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-400 uppercase">Resolution Notes</h3>
                  <p className="text-white bg-slate-800 p-3 rounded-lg">{selectedReport.moderator_notes}</p>
                  {selectedReport.resolved_at && (
                    <p className="text-slate-400 text-sm">
                      Resolved {new Date(selectedReport.resolved_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          {selectedReport.status === 'pending' && (
            <div className="p-4 border-t border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => handleReportAction('none')}
                  variant="outline"
                  className="border-slate-700 text-slate-300"
                >
                  <X className="w-4 h-4 mr-1" /> Dismiss
                </Button>
                <Button 
                  onClick={() => handleReportAction('warning')}
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  <AlertTriangle className="w-4 h-4 mr-1" /> Warn
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => handleReportAction('temporary_ban')}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Clock className="w-4 h-4 mr-1" /> Suspend
                </Button>
                <Button 
                  onClick={() => handleReportAction('permanent_ban')}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Ban className="w-4 h-4 mr-1" /> Ban
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}