import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Shield, Play, RefreshCw, Ban, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function RateLimitMonitor({ violations, currentUser }) {
  const [isRunningAI, setIsRunningAI] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const queryClient = useQueryClient();

  // Group violations by user
  const violationsByUser = violations.reduce((acc, v) => {
    const target = v.target_user_id;
    if (!acc[target]) {
      acc[target] = {
        id: target,
        email: v.details?.email || target,
        violations: [],
        totalCount: 0
      };
    }
    acc[target].violations.push(v);
    acc[target].totalCount++;
    return acc;
  }, {});

  const sortedUsers = Object.values(violationsByUser).sort((a, b) => b.totalCount - a.totalCount);

  // Run AI analysis
  const runAIAnalysis = async () => {
    setIsRunningAI(true);
    setAiResult(null);
    try {
      const result = await base44.functions.invoke('autoDetectScammers', {});
      setAiResult(result.data);
      queryClient.invalidateQueries(['admin-audit-logs']);
      queryClient.invalidateQueries(['admin-reports']);
      alert(`AI Analysis Complete! Analyzed ${result.data.analyzed} users, banned ${result.data.banned} suspicious accounts.`);
    } catch (error) {
      console.error('AI analysis failed:', error);
      alert('AI analysis failed: ' + error.message);
    } finally {
      setIsRunningAI(false);
    }
  };

  // Manual ban mutation
  const manualBanMutation = useMutation({
    mutationFn: async (email) => {
      // Find profiles with this email
      const profiles = await base44.entities.UserProfile.filter({ created_by: email });
      
      for (const profile of profiles) {
        await base44.entities.UserProfile.update(profile.id, {
          is_banned: true,
          is_active: false,
          ban_reason: 'Manually banned by admin for rate limit abuse'
        });
      }

      // Log the action
      await base44.entities.AdminAuditLog.create({
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action_type: 'user_ban',
        target_user_id: email,
        details: { reason: 'Rate limit abuse', profiles: profiles.map(p => p.id) }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-audit-logs']);
      alert('User banned successfully!');
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-red-900 to-orange-900 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield size={24} />
              Security Monitor: Rate Limit Violations
            </span>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={runAIAnalysis}
                      disabled={isRunningAI}
                      className="bg-white text-red-900 hover:bg-gray-100"
                    >
                      {isRunningAI ? (
                        <>
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                          AI Analyzing...
                        </>
                      ) : (
                        <>
                          <Play size={16} className="mr-2" />
                          Run AI Analysis & Auto-Ban
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Detect and ban scammers using AI analysis</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <p className="text-3xl font-bold">{violations.length}</p>
              <p className="text-sm opacity-90">Total Violations (24h)</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{sortedUsers.length}</p>
              <p className="text-sm opacity-90">Unique Violators</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {sortedUsers.filter(u => u.totalCount >= 3).length}
              </p>
              <p className="text-sm opacity-90">High Risk (3+ violations)</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {aiResult?.banned || 0}
              </p>
              <p className="text-sm opacity-90">Auto-Banned by AI</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      {aiResult && (
        <Card className="border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle size={20} />
              Latest AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-green-900">
                ✓ Analyzed {aiResult.analyzed} users with violations
              </p>
              <p className="text-green-900">
                ✓ Automatically banned {aiResult.banned} suspicious accounts
              </p>
              {aiResult.details?.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-green-900 mb-2">Banned Users:</p>
                  {aiResult.details.map((user, idx) => (
                    <div key={idx} className="bg-white p-3 rounded border border-green-200 mb-2">
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-gray-600">
                        {user.violations} violations • {user.analysis.confidence}% confidence
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        Reason: {user.analysis.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Violations List */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limit Violators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedUsers.map(user => {
              const loginViolations = user.violations.filter(v => v.details?.type === 'login').length;
              const signupViolations = user.violations.filter(v => v.details?.type === 'signup').length;
              const isHighRisk = user.totalCount >= 3;

              return (
                <div
                  key={user.id}
                  className={`p-4 rounded-lg border ${
                    isHighRisk ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {isHighRisk && <AlertTriangle size={18} className="text-red-600" />}
                        <p className="font-semibold text-gray-900">{user.email}</p>
                        {isHighRisk && (
                          <Badge className="bg-red-600">HIGH RISK</Badge>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>Total: {user.totalCount} violations</span>
                        {loginViolations > 0 && <span>Login: {loginViolations}</span>}
                        {signupViolations > 0 && <span>Signup: {signupViolations}</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Last violation: {new Date(user.violations[0].created_date).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm(`Ban ${user.email} for rate limit abuse?`)) {
                          manualBanMutation.mutate(user.email);
                        }
                      }}
                      className="gap-2"
                    >
                      <Ban size={16} />
                      Ban User
                    </Button>
                  </div>
                </div>
              );
            })}

            {sortedUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Shield size={48} className="mx-auto mb-2 opacity-50" />
                <p>No rate limit violations in the last 24 hours</p>
                <p className="text-sm">Your security system is working perfectly! 🎉</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}