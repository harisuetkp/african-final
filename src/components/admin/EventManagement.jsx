import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, MapPin, Users, Plus, Edit2, Trash2, DollarSign, Bell } from 'lucide-react';
import { format } from 'date-fns';

export default function EventManagement({ events }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'cultural_festival',
    image_url: '',
    start_date: '',
    end_date: '',
    location_name: '',
    location_address: '',
    city: '',
    state: '',
    country: '',
    is_virtual: false,
    virtual_link: '',
    max_attendees: 100,
    is_featured: false,
    price: 0,
    currency: 'USD'
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const queryClient = useQueryClient();

  const createEventMutation = useMutation({
    mutationFn: async () => {
      if (editingEvent) {
        await base44.entities.Event.update(editingEvent.id, formData);
      } else {
        await base44.entities.Event.create({
          ...formData,
          attendees: []
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-events']);
      setShowDialog(false);
      setEditingEvent(null);
      resetForm();
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId) => {
      await base44.entities.Event.delete(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-events']);
    }
  });

  const sendRemindersMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('sendEventReminders', {});
      return response.data;
    },
    onSuccess: (data) => {
      alert(`Event reminders sent successfully!\n${data.remindersSent} reminders sent for ${data.eventsChecked} upcoming events.`);
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'cultural_festival',
      image_url: '',
      start_date: '',
      end_date: '',
      location_name: '',
      location_address: '',
      city: '',
      state: '',
      country: '',
      is_virtual: false,
      virtual_link: '',
      max_attendees: 100,
      is_featured: false,
      price: 0,
      currency: 'USD'
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({...formData, image_url: file_url});
    } catch (error) {
      alert('Photo upload failed');
    }
    setUploadingPhoto(false);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData(event);
    setShowDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar size={24} className="text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-sm text-gray-600">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users size={24} className="text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {events.reduce((sum, e) => sum + (e.attendees?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Attendees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign size={24} className="text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  ${events.reduce((sum, e) => sum + ((e.price || 0) * (e.attendees?.length || 0)), 0).toFixed(0)}
                </p>
                <p className="text-sm text-gray-600">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Button className="w-full" onClick={() => setShowDialog(true)}>
                <Plus size={18} className="mr-2" />
                Create Event
              </Button>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={() => sendRemindersMutation.mutate()}
                disabled={sendRemindersMutation.isPending}
              >
                <Bell size={18} className="mr-2" />
                {sendRemindersMutation.isPending ? 'Sending...' : 'Send Event Reminders'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.map(event => (
              <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{event.title}</h3>
                    {event.is_featured && <Badge className="bg-amber-500">Featured</Badge>}
                    {event.is_virtual && <Badge variant="outline">Virtual</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {event.start_date && format(new Date(event.start_date), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {event.city}, {event.country}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {event.attendees?.length || 0}/{event.max_attendees}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(event)}>
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEventMutation.mutate(event.id)}
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-center text-gray-500 py-8">No events created yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) {
          setEditingEvent(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Event Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="mt-2"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Event Photo</label>
              {formData.image_url && (
                <img src={formData.image_url} alt="Event" className="w-full h-40 object-cover rounded-lg mb-2" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="mt-2 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-purple-50 file:text-purple-700
                  hover:file:bg-purple-100"
                disabled={uploadingPhoto}
              />
              {uploadingPhoto && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Location Name / Venue</label>
              <Input
                value={formData.location_name}
                onChange={(e) => setFormData({...formData, location_name: e.target.value})}
                className="mt-2"
                placeholder="e.g., The Rhythm Lounge"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Address</label>
              <Input
                value={formData.location_address}
                onChange={(e) => setFormData({...formData, location_address: e.target.value})}
                className="mt-2"
                placeholder="Full street address"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Event Type</label>
                <Select value={formData.event_type} onValueChange={(v) => setFormData({...formData, event_type: v})}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cultural_festival">Cultural Festival</SelectItem>
                    <SelectItem value="meetup">Meetup</SelectItem>
                    <SelectItem value="speed_dating">Speed Dating</SelectItem>
                    <SelectItem value="networking">Networking</SelectItem>
                    <SelectItem value="concert">Concert</SelectItem>
                    <SelectItem value="food_festival">Food Festival</SelectItem>
                    <SelectItem value="afrobeat_party">Afrobeat Party</SelectItem>
                    <SelectItem value="dance_party">Dance Party</SelectItem>
                    <SelectItem value="cultural_night">Cultural Night</SelectItem>
                    <SelectItem value="music_festival">Music Festival</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Max Attendees</label>
                <Input
                  type="number"
                  value={formData.max_attendees}
                  onChange={(e) => setFormData({...formData, max_attendees: parseInt(e.target.value)})}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">State/Province</label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="mt-2"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Country</label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Price (USD)</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  className="mt-2"
                />
              </div>
            </div>

            <Button
              onClick={() => createEventMutation.mutate()}
              disabled={!formData.title || !formData.city || createEventMutation.isPending}
              className="w-full"
            >
              {editingEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}