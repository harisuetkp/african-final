import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { Plus, Calendar, Users, Trash2, Edit, Video, Eye } from 'lucide-react';

export default function VIPEventsManager() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'speed_dating',
    scheduled_at: '',
    duration_minutes: 60,
    max_participants: 20,
    tier_required: 'vip',
    meeting_link: '',
    host_name: ''
  });

  const { data: events = [] } = useQuery({
    queryKey: ['admin-vip-events'],
    queryFn: () => base44.entities.VIPEvent.filter({}, '-scheduled_at', 50)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VIPEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-vip-events']);
      setIsCreating(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VIPEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-vip-events']);
      setEditingEvent(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VIPEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['admin-vip-events'])
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'speed_dating',
      scheduled_at: '',
      duration_minutes: 60,
      max_participants: 20,
      tier_required: 'vip',
      meeting_link: '',
      host_name: ''
    });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.scheduled_at) {
      alert('Please fill in required fields');
      return;
    }
    
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: formData });
    } else {
      createMutation.mutate({ ...formData, status: 'upcoming', current_participants: 0 });
    }
  };

  const handleEdit = (event) => {
    setFormData({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      scheduled_at: event.scheduled_at?.slice(0, 16) || '',
      duration_minutes: event.duration_minutes || 60,
      max_participants: event.max_participants || 20,
      tier_required: event.tier_required || 'vip',
      meeting_link: event.meeting_link || '',
      host_name: event.host_name || ''
    });
    setEditingEvent(event);
  };

  const EventForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Event Title *</Label>
        <Input
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          placeholder="Friday Night Speed Dating"
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the event..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Event Type</Label>
          <Select value={formData.event_type} onValueChange={v => setFormData({ ...formData, event_type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="speed_dating">Speed Dating</SelectItem>
              <SelectItem value="mixer">Mixer</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="exclusive_party">Exclusive Party</SelectItem>
              <SelectItem value="webinar">Webinar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tier Required</Label>
          <Select value={formData.tier_required} onValueChange={v => setFormData({ ...formData, tier_required: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="elite">Elite</SelectItem>
              <SelectItem value="vip">VIP Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date & Time *</Label>
          <Input
            type="datetime-local"
            value={formData.scheduled_at}
            onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
          />
        </div>
        <div>
          <Label>Duration (minutes)</Label>
          <Input
            type="number"
            value={formData.duration_minutes}
            onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Max Participants</Label>
          <Input
            type="number"
            value={formData.max_participants}
            onChange={e => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label>Host Name</Label>
          <Input
            value={formData.host_name}
            onChange={e => setFormData({ ...formData, host_name: e.target.value })}
            placeholder="Host name"
          />
        </div>
      </div>
      <div>
        <Label>Meeting Link (Zoom/Google Meet)</Label>
        <Input
          value={formData.meeting_link}
          onChange={e => setFormData({ ...formData, meeting_link: e.target.value })}
          placeholder="https://zoom.us/j/..."
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => { setIsCreating(false); setEditingEvent(null); resetForm(); }}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
          {editingEvent ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">VIP Events Manager</h2>
          <p className="text-gray-500">Create and manage exclusive events for VIP members</p>
        </div>
        <Dialog open={isCreating || !!editingEvent} onOpenChange={(open) => { if (!open) { setIsCreating(false); setEditingEvent(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreating(true)}>
              <Plus size={18} className="mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
            </DialogHeader>
            <EventForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Event Cards */}
      <div className="grid gap-4">
        {events.map(event => (
          <Card key={event.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={
                      event.status === 'upcoming' ? 'bg-green-500' :
                      event.status === 'live' ? 'bg-red-500' :
                      event.status === 'completed' ? 'bg-gray-500' : 'bg-yellow-500'
                    }>
                      {event.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">{event.event_type.replace('_', ' ')}</Badge>
                    <Badge variant="outline">{event.tier_required?.toUpperCase()}</Badge>
                  </div>
                  <h3 className="text-lg font-bold">{event.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{event.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {event.scheduled_at ? format(new Date(event.scheduled_at), 'MMM d, yyyy h:mm a') : '-'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {event.current_participants || 0}/{event.max_participants} registered
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(event)}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="outline" size="icon" className="text-red-600" onClick={() => {
                    if (confirm('Delete this event?')) deleteMutation.mutate(event.id);
                  }}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {events.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              No events created yet. Click "Create Event" to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}