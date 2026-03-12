import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Mail, Users, Shield, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickActions() {
  const queryClient = useQueryClient();

  const actionMutations = {
    sendWinback: useMutation({
      mutationFn: () => base44.functions.invoke('sendWinbackEmail', {}),
      onSuccess: (response) => {
        const count = response?.data?.emailsSent || 0;
        toast.success(`Sent ${count} win-back emails`);
      },
      onError: (err) => toast.error(err.message || 'Failed to send emails')
    }),

    verifyPhotos: useMutation({
      mutationFn: () => base44.functions.invoke('autoVerifyPhotos', {}),
      onSuccess: (response) => {
        const count = response?.data?.processed || 0;
        toast.success(`Processed ${count} verifications`);
        queryClient.invalidateQueries(['admin-verifications']);
      },
      onError: (err) => toast.error(err.message || 'Failed to verify photos')
    }),

    analyzePatterns: useMutation({
      mutationFn: () => base44.functions.invoke('analyzeConversationPatterns', {}),
      onSuccess: (response) => {
        const count = response?.data?.analyzed || 0;
        toast.success(`Analyzed ${count} conversations`);
      },
      onError: (err) => toast.error(err.message || 'Failed to analyze patterns')
    }),

    checkExpired: useMutation({
      mutationFn: () => base44.functions.invoke('checkExpiredSubscriptions', {}),
      onSuccess: (response) => {
        const count = response?.data?.checked || 0;
        toast.success(`Checked ${count} subscriptions`);
        queryClient.invalidateQueries(['admin-subscriptions']);
      },
      onError: (err) => toast.error(err.message || 'Failed to check subscriptions')
    })
  };

  const actions = [
    {
      label: 'Send Win-back Emails',
      description: 'Re-engage inactive users',
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      mutation: actionMutations.sendWinback
    },
    {
      label: 'Auto-Verify Photos',
      description: 'Process pending verifications',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      mutation: actionMutations.verifyPhotos
    },
    {
      label: 'Analyze Patterns',
      description: 'Detect conversation issues',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      mutation: actionMutations.analyzePatterns
    },
    {
      label: 'Check Expired Subs',
      description: 'Update subscription statuses',
      icon: Users,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 hover:bg-amber-100',
      mutation: actionMutations.checkExpired
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap size={20} className="text-purple-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Button
                key={idx}
                onClick={() => action.mutation.mutate()}
                disabled={action.mutation.isPending}
                variant="ghost"
                className={`h-auto p-4 justify-start flex-col items-start ${action.bgColor} border transition-all`}
              >
                <Icon size={24} className={`${action.color} mb-2`} />
                <div className="text-left">
                  <p className="font-semibold text-sm text-gray-900">{action.label}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
                {action.mutation.isPending && (
                  <div className="mt-2 text-xs text-gray-500">Processing...</div>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}