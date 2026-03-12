import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  AlertOctagon, CheckCircle, Clock, Search, Filter, 
  ChevronRight, Activity, Smartphone, Globe, User, Sparkles, Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ErrorLogsDashboard() {
  const [selectedError, setSelectedError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const queryClient = useQueryClient();

  // Fetch Errors
  const { data: errors = [], isLoading } = useQuery({
    queryKey: ['error-logs', filterStatus],
    queryFn: async () => {
      let query = {};
      if (filterStatus !== 'all') query.status = filterStatus;
      return base44.entities.ErrorLog.filter(query, '-created_date', 100);
    }
  });

  // Resolve Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await base44.entities.ErrorLog.update(id, { 
        status,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['error-logs']);
      if (selectedError) {
        setSelectedError(prev => ({ ...prev, status: 'resolved' }));
      }
    }
  });

  // AI Analysis Mutation
  const analyzeErrorMutation = useMutation({
    mutationFn: async (error) => {
      const response = await base44.functions.invoke('analyzeError', { error });
      return response.data;
    },
    onSuccess: (data) => {
      setAiAnalysis(data);
      // Update local state to show persisted result immediately
      if (selectedError) {
        setSelectedError(prev => ({ ...prev, ai_analysis: data }));
      }
      // Refresh list to persist in cache
      queryClient.invalidateQueries(['error-logs']);
    }
  });

  // Reset or load analysis when selecting new error
  React.useEffect(() => {
    if (selectedError?.ai_analysis) {
      setAiAnalysis(selectedError.ai_analysis);
    } else {
      setAiAnalysis(null);
    }
  }, [selectedError?.id, selectedError?.ai_analysis]);

  // Filter logic
  const filteredErrors = errors.filter(err => 
    err.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    err.url?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const stats = {
    total: errors.length,
    new: errors.filter(e => e.status === 'new').length,
    resolved: errors.filter(e => e.status === 'resolved').length,
    critical: errors.filter(e => e.severity === 'critical').length
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">System Health & Errors</h2>
        <Badge variant="outline" className="text-gray-600 border-gray-300">
          Live Monitor
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Errors (24h)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Activity className="text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">New / Open</p>
              <p className="text-2xl font-bold text-red-600">{stats.new}</p>
            </div>
            <AlertOctagon className="text-red-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <CheckCircle className="text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Critical</p>
              <p className="text-2xl font-bold text-orange-600">{stats.critical}</p>
            </div>
            <Activity className="text-orange-500" />
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search error messages..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error List */}
      <Card className="overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredErrors.map((error) => (
            <div 
              key={error.id} 
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between group"
              onClick={() => setSelectedError(error)}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={getSeverityColor(error.severity)}>
                    {error.severity?.toUpperCase() || 'UNKNOWN'}
                  </Badge>
                  <span className="text-xs text-gray-500 font-mono">
                    {new Date(error.created_date).toLocaleString()}
                  </span>
                  {error.status === 'new' && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </div>
                <p className="font-medium text-sm truncate text-gray-900">{error.message}</p>
                <p className="text-xs text-gray-500 truncate mt-1">{error.url}</p>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          ))}
          
          {filteredErrors.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {isLoading ? 'Loading errors...' : 'No errors found matching your filters.'}
            </div>
          )}
        </div>
      </Card>

      {/* Detail View Drawer */}
      <Sheet open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
        <SheetContent className="w-[90%] sm:w-[540px] bg-gray-900 border-l border-white/10 text-white overflow-y-auto">
          {selectedError && (
            <div className="space-y-6 pt-6">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={getSeverityColor(selectedError.severity)}>
                    {selectedError.severity}
                  </Badge>
                  <Badge variant="outline" className="text-gray-400 border-gray-700">
                    {selectedError.status}
                  </Badge>
                </div>
                <SheetTitle className="text-white mt-2 break-words">
                  {selectedError.message}
                </SheetTitle>
                <SheetDescription className="text-gray-400">
                  Occurred {new Date(selectedError.created_date).toLocaleString()}
                </SheetDescription>
              </SheetHeader>

              {/* AI Analysis Section */}
              <div className="space-y-3">
                {!aiAnalysis ? (
                  <Button 
                    onClick={() => analyzeErrorMutation.mutate(selectedError)} 
                    disabled={analyzeErrorMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-none"
                  >
                    {analyzeErrorMutation.isPending ? (
                      <Activity className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {analyzeErrorMutation.isPending ? 'Analyzing Error...' : 'Analyze with AI'}
                  </Button>
                ) : (
                  <Card className="bg-purple-900/20 border-purple-500/30">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2 text-purple-300 font-semibold">
                        <Brain className="h-4 w-4" />
                        AI Diagnosis
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-purple-200/60 uppercase font-bold">Diagnosis</p>
                          <p className="text-sm text-purple-100">{aiAnalysis.diagnosis}</p>
                        </div>
                        <div>
                          <p className="text-xs text-purple-200/60 uppercase font-bold">Suggested Fix</p>
                          <p className="text-sm text-purple-100 font-mono bg-black/30 p-2 rounded mt-1">
                            {aiAnalysis.fix_suggestion}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-purple-200/60">Severity:</span>
                          <Badge variant="outline" className="border-purple-400 text-purple-300">
                            {aiAnalysis.severity_assessment}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {selectedError.status !== 'resolved' && (
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => updateStatusMutation.mutate({ id: selectedError.id, status: 'resolved' })}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Resolve
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  onClick={() => updateStatusMutation.mutate({ id: selectedError.id, status: 'ignored' })}
                >
                  Ignore
                </Button>
              </div>

              <Tabs defaultValue="stack" className="w-full">
                <TabsList className="bg-gray-800 w-full">
                  <TabsTrigger value="stack" className="flex-1">Stack Trace</TabsTrigger>
                  <TabsTrigger value="breadcrumbs" className="flex-1">Journey</TabsTrigger>
                  <TabsTrigger value="context" className="flex-1">Context</TabsTrigger>
                </TabsList>

                <TabsContent value="stack" className="mt-4 space-y-4">
                  <div className="bg-black/50 p-4 rounded-lg font-mono text-xs text-red-300 overflow-x-auto whitespace-pre-wrap border border-white/10">
                    {selectedError.stack || 'No stack trace available'}
                  </div>
                  {selectedError.component_stack && (
                    <div className="bg-black/50 p-4 rounded-lg font-mono text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap border border-white/10">
                      <p className="text-gray-500 mb-2">// Component Stack</p>
                      {selectedError.component_stack}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="breadcrumbs" className="mt-4">
                  <div className="relative pl-4 border-l border-white/10 space-y-6">
                    {selectedError.breadcrumbs?.map((crumb, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-gray-900" />
                        <p className="text-sm font-medium text-blue-200">{crumb.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(crumb.timestamp).toLocaleTimeString()} • {crumb.category}
                        </p>
                        {crumb.data && (
                          <pre className="mt-1 text-[10px] text-gray-500 bg-black/30 p-1 rounded">
                            {JSON.stringify(crumb.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-red-500 ring-4 ring-gray-900 animate-pulse" />
                      <p className="text-sm font-bold text-red-400">Error Occurred</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="context" className="mt-4 space-y-4">
                  <Card className="bg-gray-800 border-white/10">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="text-gray-400" size={16} />
                        <div>
                          <p className="text-xs text-gray-500">User</p>
                          <p className="text-sm text-white">{selectedError.user_email || 'Anonymous'}</p>
                          <p className="text-xs text-gray-500">{selectedError.user_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Globe className="text-gray-400" size={16} />
                        <div>
                          <p className="text-xs text-gray-500">URL</p>
                          <p className="text-sm text-white break-all">{selectedError.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Smartphone className="text-gray-400" size={16} />
                        <div>
                          <p className="text-xs text-gray-500">Device</p>
                          <p className="text-sm text-white">{selectedError.device} • {selectedError.os}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{selectedError.browser}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}