import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

export default function ModerationRules({ rules, currentUser }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_type: 'blocked_keyword',
    pattern: '',
    action: 'flag',
    severity: 'medium',
    is_active: true
  });
  const queryClient = useQueryClient();

  const createRuleMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ModerationRule.create({
        ...newRule,
        created_by: currentUser.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-moderation-rules']);
      setShowAddDialog(false);
      setNewRule({
        rule_type: 'blocked_keyword',
        pattern: '',
        action: 'flag',
        severity: 'medium',
        is_active: true
      });
    }
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, isActive }) => {
      await base44.entities.ModerationRule.update(ruleId, { is_active: isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-moderation-rules']);
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId) => {
      await base44.entities.ModerationRule.delete(ruleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-moderation-rules']);
    }
  });

  const severityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{rules.length}</p>
                <p className="text-sm text-gray-600">Total Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-green-600" />
              <div>
                <p className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</p>
                <p className="text-sm text-gray-600">Active Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-red-600" />
              <div>
                <p className="text-2xl font-bold">
                  {rules.filter(r => r.severity === 'critical' || r.severity === 'high').length}
                </p>
                <p className="text-sm text-gray-600">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Button className="w-full" onClick={() => setShowAddDialog(true)}>
              <Plus size={18} className="mr-2" />
              Add Rule
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Content Moderation Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={severityColors[rule.severity]}>{rule.severity}</Badge>
                    <Badge variant="outline">{rule.rule_type.replace('_', ' ')}</Badge>
                  </div>
                  <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{rule.pattern}</p>
                  <p className="text-xs text-gray-600 mt-1">Action: {rule.action.replace('_', ' ')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(checked) => toggleRuleMutation.mutate({ ruleId: rule.id, isActive: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRuleMutation.mutate(rule.id)}
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
            {rules.length === 0 && (
              <p className="text-center text-gray-500 py-8">No moderation rules configured</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Rule Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Moderation Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rule Type</label>
              <Select value={newRule.rule_type} onValueChange={(v) => setNewRule({...newRule, rule_type: v})}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocked_keyword">Blocked Keyword</SelectItem>
                  <SelectItem value="spam_pattern">Spam Pattern</SelectItem>
                  <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                  <SelectItem value="rate_limit">Rate Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Pattern / Keyword</label>
              <Input
                placeholder="e.g., badword, spam*, etc."
                value={newRule.pattern}
                onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Action</label>
              <Select value={newRule.action} onValueChange={(v) => setNewRule({...newRule, action: v})}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flag">Flag for Review</SelectItem>
                  <SelectItem value="auto_delete">Auto Delete</SelectItem>
                  <SelectItem value="shadow_ban">Shadow Ban User</SelectItem>
                  <SelectItem value="notify_admin">Notify Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Severity</label>
              <Select value={newRule.severity} onValueChange={(v) => setNewRule({...newRule, severity: v})}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => createRuleMutation.mutate()}
              disabled={!newRule.pattern || createRuleMutation.isPending}
              className="w-full"
            >
              Create Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}