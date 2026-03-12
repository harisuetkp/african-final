import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Search, Filter, Download, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function AuditLogs({ logs }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const actionColors = {
    user_ban: 'bg-red-600',
    user_delete: 'bg-red-700',
    user_unban: 'bg-green-600',
    report_resolved: 'bg-blue-600',
    subscription_cancelled: 'bg-orange-600',
    admin_granted: 'bg-purple-600',
    admin_revoked: 'bg-purple-700',
    message_sent: 'bg-blue-500',
    user_edited: 'bg-yellow-600',
    verification_approved: 'bg-green-500',
    verification_rejected: 'bg-red-500'
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.target_user_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'all' || log.action_type === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{logs.length}</p>
                <p className="text-sm text-gray-600">Total Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock size={24} className="text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {logs.filter(l => {
                    const logDate = new Date(l.created_date);
                    const today = new Date();
                    return logDate.toDateString() === today.toDateString();
                  }).length}
                </p>
                <p className="text-sm text-gray-600">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-red-600" />
              <div>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.action_type === 'user_ban' || l.action_type === 'user_delete').length}
                </p>
                <p className="text-sm text-gray-600">Moderation Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {[...new Set(logs.map(l => l.admin_email))].length}
                </p>
                <p className="text-sm text-gray-600">Active Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter size={20} />
              Filters & Search
            </span>
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              Export Logs
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by admin email or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="user_ban">User Ban</SelectItem>
                <SelectItem value="user_delete">User Delete</SelectItem>
                <SelectItem value="user_unban">User Unban</SelectItem>
                <SelectItem value="report_resolved">Report Resolved</SelectItem>
                <SelectItem value="subscription_cancelled">Subscription Cancelled</SelectItem>
                <SelectItem value="admin_granted">Admin Granted</SelectItem>
                <SelectItem value="admin_revoked">Admin Revoked</SelectItem>
                <SelectItem value="message_sent">Message Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition">
                <div className="flex items-center gap-4 flex-1">
                  <Badge className={actionColors[log.action_type] || 'bg-gray-600'}>
                    {log.action_type.replace(/_/g, ' ')}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {log.admin_email}
                    </p>
                    <p className="text-sm text-gray-600">
                      Target: {log.target_user_id || 'N/A'}
                    </p>
                    {log.details && (
                      <p className="text-xs text-gray-500 mt-1">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date(log.created_date).toLocaleString()}
                  </p>
                  {log.ip_address && (
                    <p className="text-xs text-gray-500">IP: {log.ip_address}</p>
                  )}
                </div>
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <p className="text-center text-gray-500 py-8">No audit logs found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}