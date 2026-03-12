import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { HelpCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function SupportTickets({ tickets, currentUser }) {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }) => {
      await base44.entities.SupportTicket.update(ticketId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-support-tickets']);
      setSelectedTicket(null);
      setResolutionNotes('');
    }
  });

  const filteredTickets = filterStatus === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    open: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    waiting: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <HelpCircle size={24} className="text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{tickets.length}</p>
                <p className="text-sm text-gray-600">Total Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={24} className="text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {tickets.filter(t => t.status === 'open').length}
                </p>
                <p className="text-sm text-gray-600">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock size={24} className="text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {tickets.filter(t => t.status === 'in_progress').length}
                </p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
                </p>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTickets.map(ticket => (
              <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                    <Badge className={statusColors[ticket.status]}>{ticket.status.replace('_', ' ')}</Badge>
                    <Badge variant="outline">{ticket.category}</Badge>
                  </div>
                  <h3 className="font-semibold">{ticket.subject}</h3>
                  <p className="text-sm text-gray-600">{ticket.user_email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Created {new Date(ticket.created_date).toLocaleDateString()}
                  </p>
                </div>
                <Button onClick={() => setSelectedTicket(ticket)}>
                  View
                </Button>
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <p className="text-center text-gray-500 py-8">No tickets found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className={priorityColors[selectedTicket.priority]}>{selectedTicket.priority}</Badge>
                <Badge className={statusColors[selectedTicket.status]}>{selectedTicket.status}</Badge>
                <Badge variant="outline">{selectedTicket.category}</Badge>
              </div>

              <div>
                <h3 className="font-semibold text-lg">{selectedTicket.subject}</h3>
                <p className="text-sm text-gray-600">From: {selectedTicket.user_email}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">{selectedTicket.description}</p>
              </div>

              {selectedTicket.resolution_notes && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Resolution Notes:</p>
                  <p className="text-sm text-green-700">{selectedTicket.resolution_notes}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Update Status</label>
                <Select
                  value={selectedTicket.status}
                  onValueChange={(status) => updateTicketMutation.mutate({
                    ticketId: selectedTicket.id,
                    updates: { status, assigned_to: currentUser.email }
                  })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting">Waiting for User</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Resolution Notes</label>
                <Textarea
                  placeholder="Add resolution notes..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>

              <Button
                onClick={() => updateTicketMutation.mutate({
                  ticketId: selectedTicket.id,
                  updates: {
                    status: 'resolved',
                    resolution_notes: resolutionNotes,
                    assigned_to: currentUser.email
                  }
                })}
                disabled={!resolutionNotes || updateTicketMutation.isPending}
                className="w-full"
              >
                Mark as Resolved
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}