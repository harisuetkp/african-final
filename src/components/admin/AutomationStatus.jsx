import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function AutomationStatus() {
  const [runningJobs, setRunningJobs] = useState({});

  const runAutomationMutation = useMutation({
    mutationFn: async (functionName) => {
      setRunningJobs(prev => ({ ...prev, [functionName]: true }));
      const response = await base44.functions.invoke(functionName, {});
      return response.data;
    },
    onSuccess: (data, functionName) => {
      setRunningJobs(prev => ({ ...prev, [functionName]: false }));
      toast.success(`${functionName} completed successfully`, {
        description: JSON.stringify(data, null, 2)
      });
    },
    onError: (error, functionName) => {
      setRunningJobs(prev => ({ ...prev, [functionName]: false }));
      toast.error(`${functionName} failed`, {
        description: error.message
      });
    }
  });

  const automations = [
    {
      name: 'autoVerifyPhotos',
      title: 'AI Photo Verification',
      description: 'Automatically verify user photos and IDs',
      icon: CheckCircle,
      schedule: 'Runs every 15 minutes',
      color: 'green'
    },
    {
      name: 'analyzeConversationPatterns',
      title: 'Pattern Analysis',
      description: 'Detect concerning behavior patterns in conversations',
      icon: Zap,
      schedule: 'Runs every 30 minutes',
      color: 'purple'
    },
    {
      name: 'autoEscalateSafetyAlerts',
      title: 'Safety Alert Escalation',
      description: 'Automatically escalate unresolved safety alerts',
      icon: Zap,
      schedule: 'Runs every 5 minutes',
      color: 'red'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Automation Status</h3>
          <p className="text-sm text-gray-600">AI-powered automation jobs running in the background</p>
        </div>
        <Badge className="bg-green-600">
          <Zap size={14} className="mr-1" />
          {automations.length} Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {automations.map(automation => {
          const Icon = automation.icon;
          const isRunning = runningJobs[automation.name];

          return (
            <Card key={automation.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon size={18} className={`text-${automation.color}-600`} />
                  {automation.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">{automation.description}</p>
                <p className="text-xs text-gray-500">{automation.schedule}</p>
                <Button
                  onClick={() => runAutomationMutation.mutate(automation.name)}
                  disabled={isRunning}
                  size="sm"
                  className="w-full"
                >
                  {isRunning ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play size={14} className="mr-2" />
                      Run Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}