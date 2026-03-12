import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Brain, AlertTriangle, CheckCircle, TrendingUp, Users, MessageSquare, Shield, Download, Filter, RefreshCw } from 'lucide-react';
import AIRecommendations from './AIRecommendations';
import { usePagination } from '@/components/shared/usePagination';
import { toast } from 'sonner';

export default function AIInsightsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Paginated queries with filters
  const messageFilters = {
    is_flagged: true,
    ...(severityFilter !== 'all' ? { severity: severityFilter } : {})
  };

  const { items: flaggedMessages, loadMore: loadMoreMessages, hasMore: hasMoreMessages, isLoading: messagesLoading } = 
    usePagination('Message', messageFilters, 25);

  const { items: moderationActions, loadMore: loadMoreActions, hasMore: hasMoreActions } = 
    usePagination('ModerationAction', { action_taken: 'pending' }, 25);

  const { items: verificationRequests, loadMore: loadMoreVerifications, hasMore: hasMoreVerifications } = 
    usePagination('VerificationRequest', { status: 'pending' }, 25);

  // Auto-action mutation
  const autoActionMutation = useMutation({
    mutationFn: async ({ items, action }) => {
      const results = await Promise.all(
        items.map(item => 
          base44.entities[item.entityType].update(item.id, { action_taken: action })
        )
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ai-moderation-actions']);
      toast.success('Bulk action completed');
    }
  });

  // Export data mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const data = {
        flaggedMessages,
        moderationActions,
        verificationRequests,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-insights-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    },
    onSuccess: () => toast.success('Data exported successfully')
  });

  // Calculate insights
  const highPriorityAlerts = moderationActions.filter(a => a.severity === 'high').length;
  const autoApprovedVerifications = verificationRequests.filter(v => v.ai_confidence_score >= 85).length;
  const avgConfidenceScore = verificationRequests.length > 0 
    ? (verificationRequests.reduce((sum, v) => sum + (v.ai_confidence_score || 0), 0) / verificationRequests.length).toFixed(1)
    : 0;

  // Filtered messages based on search
  const filteredMessages = flaggedMessages.filter(msg => 
    searchTerm === '' || msg.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Brain size={28} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Insights Dashboard</h2>
            <p className="text-gray-600">Consolidated AI-powered moderation and automation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => queryClient.invalidateQueries()}
            variant="outline"
            size="sm"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => exportMutation.mutate()}
            variant="outline"
            size="sm"
          >
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <Badge className="bg-purple-600">
            {highPriorityAlerts} High Priority
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Flagged Messages</p>
                <p className="text-2xl font-bold">{flaggedMessages.length}</p>
              </div>
              <MessageSquare className="text-amber-600" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Actions</p>
                <p className="text-2xl font-bold">{moderationActions.length}</p>
              </div>
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Auto-Approved</p>
                <p className="text-2xl font-bold">{autoApprovedVerifications}</p>
              </div>
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg AI Score</p>
                <p className="text-2xl font-bold">{avgConfidenceScore}%</p>
              </div>
              <TrendingUp className="text-blue-600" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Flagged Content</TabsTrigger>
          <TabsTrigger value="patterns">Behavior Patterns</TabsTrigger>
          <TabsTrigger value="verifications">Verifications</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">High Priority Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {moderationActions.filter(a => a.severity === 'high').slice(0, 5).map(action => (
                    <div key={action.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{action.action_type}</p>
                        <p className="text-xs text-gray-600">{action.reason}</p>
                      </div>
                      <Badge className="bg-red-600">High</Badge>
                    </div>
                  ))}
                  {moderationActions.filter(a => a.severity === 'high').length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No high priority alerts</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent AI Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {moderationActions.slice(0, 5).map(action => (
                    <div key={action.id} className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        action.severity === 'high' ? 'bg-red-500' :
                        action.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                      }`} />
                      <span className="flex-1 text-gray-700 truncate">{action.action_type}</span>
                      <span className="text-xs text-gray-500">{new Date(action.created_date).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Flagged Messages */}
        <TabsContent value="messages" className="space-y-4">
          {messagesLoading && <p className="text-center py-4">Loading...</p>}
          {filteredMessages.map(msg => (
            <Card key={msg.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge className="bg-amber-600">AI Flagged</Badge>
                  <span className="text-xs text-gray-500">{new Date(msg.created_date).toLocaleString()}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                  <p className="text-sm">{msg.content}</p>
                </div>
                <AIRecommendations
                  item={msg}
                  type="message"
                  onAction={(action) => console.log('Action:', action)}
                />
              </CardContent>
            </Card>
          ))}
          {hasMoreMessages && (
            <div className="text-center py-4">
              <Button onClick={() => loadMoreMessages()} variant="outline">
                Load More Messages
              </Button>
            </div>
          )}
          {filteredMessages.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                <p className="text-gray-600">No flagged messages - all clear!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Behavior Patterns */}
        <TabsContent value="patterns" className="space-y-4">
          {moderationActions.filter(a => a.action_type === 'pattern_detected').map(action => (
            <Card key={action.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge className={action.severity === 'high' ? 'bg-red-600' : 'bg-amber-600'}>
                    Pattern Detected
                  </Badge>
                  <span className="text-xs text-gray-500">{new Date(action.created_date).toLocaleString()}</span>
                </div>
                <p className="text-sm mb-3">{action.reason}</p>
                {action.details?.patterns && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {action.details.patterns.map((pattern, idx) => (
                      <Badge key={idx} variant="outline">{pattern}</Badge>
                    ))}
                  </div>
                )}
                <AIRecommendations
                  item={action}
                  type="pattern"
                  onAction={(act) => console.log('Action:', act)}
                />
              </CardContent>
            </Card>
          ))}
          {moderationActions.filter(a => a.action_type === 'pattern_detected').length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Shield size={48} className="mx-auto text-green-500 mb-4" />
                <p className="text-gray-600">No concerning patterns detected</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Verifications */}
        <TabsContent value="verifications" className="space-y-4">
          {verificationRequests.map(request => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline">{request.verification_type}</Badge>
                  {request.ai_confidence_score && (
                    <Badge className={
                      request.ai_confidence_score >= 85 ? 'bg-green-600' :
                      request.ai_confidence_score >= 50 ? 'bg-amber-600' : 'bg-red-600'
                    }>
                      {request.ai_confidence_score}% Confidence
                    </Badge>
                  )}
                </div>
                <AIRecommendations
                  item={request}
                  type="verification"
                  onAction={(action) => console.log('Action:', action)}
                />
              </CardContent>
            </Card>
          ))}
          {verificationRequests.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">No pending verifications</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}