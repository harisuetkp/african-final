import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Play, Pause, Settings, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BackendOrchestrator() {
  const [jobStatuses, setJobStatuses] = useState({});
  const [jobLogs, setJobLogs] = useState({});
  const [scheduledJobs, setScheduledJobs] = useState([
    {
      id: 'auto-verify',
      name: 'autoVerifyPhotos',
      title: 'Auto Photo/ID Verification',
      schedule: 'Every 15 minutes',
      automationId: '6990ab84c117ca4f4369c752',
      enabled: true,
      lastRun: null,
      status: 'idle',
      priority: 'high',
      description: 'AI-powered auto-approval/rejection of verification requests'
    },
    {
      id: 'analyze-patterns',
      name: 'analyzeConversationPatterns',
      title: 'Conversation Pattern Analysis',
      schedule: 'Every 30 minutes',
      automationId: '6990ab84c117ca4f4369c753',
      enabled: true,
      lastRun: null,
      status: 'idle',
      priority: 'medium',
      description: 'Detect harassment, scams, and suspicious patterns'
    },
    {
      id: 'escalate-alerts',
      name: 'autoEscalateSafetyAlerts',
      title: 'Safety Alert Escalation',
      schedule: 'Every 5 minutes',
      automationId: '6990ab84c117ca4f4369c754',
      enabled: true,
      lastRun: null,
      status: 'idle',
      priority: 'critical',
      description: 'Escalate unresolved safety alerts to admins'
    },
    {
      id: 'expire-subscriptions',
      name: 'checkExpiredSubscriptions',
      title: 'Subscription Expiry Check',
      schedule: 'Daily at midnight',
      automationId: '6990ab84c117ca4f4369c755',
      enabled: true,
      lastRun: null,
      status: 'idle',
      priority: 'medium',
      description: 'Downgrade expired subscriptions to free tier'
    },
    {
      id: 'winback-email',
      name: 'sendWinbackEmail',
      title: 'Win-back Email Campaign',
      schedule: 'Daily at 10am',
      automationId: '6990ab84c117ca4f4369c756',
      enabled: true,
      lastRun: null,
      status: 'idle',
      priority: 'low',
      description: 'Re-engage inactive users with personalized emails'
    },
    {
      id: 'detect-scammers',
      name: 'autoDetectScammers',
      title: 'AI Scam Detection',
      schedule: 'Every hour',
      automationId: '6990ab84c117ca4f4369c757',
      enabled: true,
      lastRun: null,
      status: 'idle',
      priority: 'high',
      description: 'AI-powered detection and auto-ban of scammers'
    }
  ]);

  const runJobMutation = useMutation({
    mutationFn: async (jobName) => {
      setJobStatuses(prev => ({ ...prev, [jobName]: 'running' }));
      
      const startTime = Date.now();
      const response = await base44.functions.invoke(jobName, {});
      const duration = Date.now() - startTime;
      
      // Store detailed logs
      const log = {
        timestamp: new Date().toISOString(),
        duration,
        result: response.data,
        status: 'success'
      };
      
      setJobLogs(prev => ({
        ...prev,
        [jobName]: [...(prev[jobName] || []).slice(-9), log] // Keep last 10 logs
      }));
      
      return { jobName, data: response.data, duration };
    },
    onSuccess: ({ jobName, data, duration }) => {
      setJobStatuses(prev => ({ ...prev, [jobName]: 'success' }));
      
      // Update last run time
      setScheduledJobs(prev => prev.map(job => 
        job.name === jobName 
          ? { ...job, lastRun: new Date().toISOString(), status: 'success' }
          : job
      ));

      toast.success(`${jobName} completed in ${(duration / 1000).toFixed(2)}s`, {
        description: `Processed ${data.processed || data.analyzed || data.alerts_checked || 0} items`
      });

      // Reset status after 3 seconds
      setTimeout(() => {
        setJobStatuses(prev => ({ ...prev, [jobName]: 'idle' }));
      }, 3000);
    },
    onError: (error, jobName) => {
      setJobStatuses(prev => ({ ...prev, [jobName]: 'error' }));
      
      // Store error log
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.message,
        status: 'error'
      };
      
      setJobLogs(prev => ({
        ...prev,
        [jobName]: [...(prev[jobName] || []).slice(-9), errorLog]
      }));
      
      toast.error(`${jobName} failed`, {
        description: error.message
      });

      setTimeout(() => {
        setJobStatuses(prev => ({ ...prev, [jobName]: 'idle' }));
      }, 3000);
    }
  });

  // Run jobs with dependency checking
  const runWithDependencies = async (job) => {
    if (job.dependencies.length > 0) {
      // Check if dependencies completed successfully
      const depStatuses = job.dependencies.map(depId => {
        const depJob = scheduledJobs.find(j => j.id === depId);
        return depJob?.status === 'success';
      });

      if (!depStatuses.every(Boolean)) {
        toast.error('Dependencies not met', {
          description: 'Required jobs must complete successfully first'
        });
        return;
      }
    }

    runJobMutation.mutate(job.name);
  };

  const toggleJobEnabled = (jobId) => {
    setScheduledJobs(prev => prev.map(job =>
      job.id === jobId ? { ...job, enabled: !job.enabled } : job
    ));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-600 animate-pulse"><Activity size={12} className="mr-1" /> Running</Badge>;
      case 'success':
        return <Badge className="bg-green-600"><CheckCircle size={12} className="mr-1" /> Success</Badge>;
      case 'error':
        return <Badge className="bg-red-600"><XCircle size={12} className="mr-1" /> Error</Badge>;
      default:
        return <Badge variant="outline"><Clock size={12} className="mr-1" /> Scheduled</Badge>;
    }
  };



  const getPriorityBadge = (priority) => {
    const colors = {
      critical: 'bg-red-600',
      high: 'bg-orange-600',
      medium: 'bg-blue-600',
      low: 'bg-gray-600'
    };
    return <Badge className={colors[priority]}>{priority}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Settings className="text-purple-600" />
            Backend Job Orchestrator
          </h3>
          <p className="text-sm text-gray-600">Manage and monitor automated backend jobs</p>
        </div>
        <Badge className="bg-green-600">
          {scheduledJobs.filter(j => j.enabled).length} Active
        </Badge>
      </div>

      {/* Jobs Grid */}
      <div className="grid gap-4">
        {scheduledJobs.map(job => {
          const currentStatus = jobStatuses[job.name] || job.status;
          
          return (
            <Card key={job.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{job.title}</CardTitle>
                  {getStatusBadge(currentStatus)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Job Details */}
                <p className="text-sm text-gray-600 mb-3">{job.description}</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Schedule</p>
                    <p className="font-medium">{job.schedule}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Last Run</p>
                    <p className="font-medium">
                      {job.lastRun ? new Date(job.lastRun).toLocaleTimeString() : 'Automated'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Priority</p>
                    {getPriorityBadge(job.priority)}
                  </div>
                </div>

                {/* Job Logs */}
                {jobLogs[job.name]?.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <p className="text-xs font-medium text-gray-700 mb-2">Recent Logs:</p>
                    {jobLogs[job.name].slice(-3).reverse().map((log, idx) => (
                      <div key={idx} className="text-xs text-gray-600 mb-1">
                        <span className={log.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                          {log.status === 'success' ? '✓' : '✗'}
                        </span>
                        {' '}
                        {new Date(log.timestamp).toLocaleTimeString()}
                        {log.duration && ` (${(log.duration / 1000).toFixed(2)}s)`}
                        {log.error && ` - ${log.error}`}
                      </div>
                    ))}
                  </div>
                )}

                {/* Controls */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => runWithDependencies(job)}
                    disabled={currentStatus === 'running' || !job.enabled}
                    size="sm"
                    className="flex-1"
                  >
                    {currentStatus === 'running' ? (
                      <>
                        <Pause size={14} className="mr-2" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play size={14} className="mr-2" />
                        Run Now
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={job.enabled}
                      onCheckedChange={() => toggleJobEnabled(job.id)}
                    />
                    <span className="text-sm text-gray-600">
                      {job.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bulk Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Bulk Actions</p>
              <p className="text-sm text-gray-600">Run all enabled jobs at once</p>
            </div>
            <Button
              onClick={() => {
                scheduledJobs
                  .filter(job => job.enabled)
                  .forEach(job => runJobMutation.mutate(job.name));
              }}
              disabled={runJobMutation.isPending}
            >
              <Play size={16} className="mr-2" />
              Run All Jobs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}