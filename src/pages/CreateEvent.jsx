import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, MapPin, Globe, Upload, Loader2, Save,
  Users, DollarSign, Tag, Clock, Video
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AfricanPattern from '@/components/shared/AfricanPattern';
import GoogleMapsLocation from '@/components/shared/GoogleMapsLocation';
import { compressImage, validateImageFile } from '@/components/shared/ImageCompressor';

export default function CreateEvent() {
  const [myProfile, setMyProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'meetup',
    image_url: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    is_virtual: false,
    virtual_link: '',
    location_name: '',
    location_address: '',
    city: '',
    country: '',
    max_attendees: '',
    price: 0,
    currency: 'USD',
    tags: [],
    is_featured: false
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) {
          const profile = profiles[0];
          setMyProfile(profile);

          // Check if user can create events (Elite+ only)
          const canCreate = ['elite', 'vip'].includes(profile.subscription_tier);

          if (!canCreate) {
            toast.error('Event creation is exclusive to Elite and VIP members.');
            window.location.href = createPageUrl('Events');
          }

          // Auto-fill location
          setFormData(prev => ({
            ...prev,
            city: profile.current_city,
            country: profile.current_country
          }));
        }
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      }
    };
    fetchProfile();
  }, []);

  const createEventMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.start_date || !formData.start_time) {
        throw new Error('Please fill in all required fields');
      }

      if (!formData.is_virtual && (!formData.city || !formData.country)) {
        throw new Error('Please provide event location');
      }

      if (formData.is_virtual && !formData.virtual_link) {
        throw new Error('Please provide a virtual event link');
      }

      // Combine date and time
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = formData.end_date && formData.end_time 
        ? new Date(`${formData.end_date}T${formData.end_time}`)
        : null;

      const response = await base44.functions.invoke('createEvent', {
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        image_url: formData.image_url,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime?.toISOString(),
        is_virtual: formData.is_virtual,
        virtual_link: formData.virtual_link,
        location_name: formData.location_name,
        location_address: formData.location_address,
        city: formData.city,
        country: formData.country,
        max_attendees: formData.max_attendees,
        price: formData.price,
        currency: formData.currency,
        tags: formData.tags,
        is_featured: formData.is_featured
      });

      if (response.data.error) throw new Error(response.data.error);
      return { id: response.data.event_id };
    },
    onSuccess: (event) => {
      toast.success('Event created successfully!');
      window.location.href = createPageUrl(`EventDetails?id=${event.id}`);
    },
    onError: (error) => {
      const msg = error.message.replace(/base44/gi, 'Server');
      toast.error(msg);
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      validateImageFile(file);
      const compressed = await compressImage(file, 1200, 0.85);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
      setFormData({ ...formData, image_url: file_url });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-amber-50/20 relative pb-24">
      <AfricanPattern className="text-purple-600" opacity={0.03} />

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Events')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">Create Event</h1>
          </div>
          <Button
            onClick={() => createEventMutation.mutate()}
            disabled={createEventMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-purple-700"
          >
            {createEventMutation.isPending ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2" size={18} />
                Publish Event
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Cover Image */}
        <Card>
          <CardContent className="p-6">
            <Label className="text-sm font-semibold mb-2 block">Event Cover Image *</Label>
            <div className="relative">
              {formData.image_url ? (
                <div className="relative h-64 rounded-lg overflow-hidden">
                  <img src={formData.image_url} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setFormData({ ...formData, image_url: '' })}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 transition">
                  <Upload size={48} className="text-gray-400 mb-2" />
                  <p className="text-gray-500">Click to upload cover image</p>
                  {uploading && <Loader2 className="animate-spin mt-2" />}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-2">Event Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Give your event a catchy title"
                className="text-lg"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2">Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your event..."
                rows={6}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2">Event Type *</Label>
              <Select value={formData.event_type} onValueChange={(v) => setFormData({ ...formData, event_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cultural_festival">Cultural Festival</SelectItem>
                  <SelectItem value="meetup">Meetup</SelectItem>
                  <SelectItem value="speed_dating">Speed Dating</SelectItem>
                  <SelectItem value="networking">Networking</SelectItem>
                  <SelectItem value="concert">Concert</SelectItem>
                  <SelectItem value="food_festival">Food Festival</SelectItem>
                  <SelectItem value="art_exhibition">Art Exhibition</SelectItem>
                  <SelectItem value="community_gathering">Community Gathering</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Clock size={20} className="text-purple-600" />
              Date & Time
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold mb-2">Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2">Start Time *</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold mb-2">End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  min={formData.start_date}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2">End Time</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {formData.is_virtual ? (
                  <><Globe size={20} className="text-purple-600" /> Virtual Event</>
                ) : (
                  <><MapPin size={20} className="text-purple-600" /> Location</>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Virtual Event</Label>
                <Switch
                  checked={formData.is_virtual}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_virtual: checked })}
                />
              </div>
            </div>

            {formData.is_virtual ? (
              <div>
                <Label className="text-sm font-semibold mb-2">Virtual Event Link *</Label>
                <Input
                  value={formData.virtual_link}
                  onChange={(e) => setFormData({ ...formData, virtual_link: e.target.value })}
                  placeholder="Zoom, Google Meet, or custom link"
                  type="url"
                />
                <p className="text-xs text-gray-500 mt-1">Attendees will see this link after RSVPing</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-2">Venue Name</Label>
                  <Input
                    value={formData.location_name}
                    onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                    placeholder="e.g., Community Center, Restaurant Name"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2">Address</Label>
                  <Input
                    value={formData.location_address}
                    onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                    placeholder="Street address"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold mb-2">City *</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-2">Country *</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2">Pin Location on Map</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <GoogleMapsLocation
                      onLocationSelect={(location) => {
                        setFormData(prev => ({
                          ...prev,
                          location_address: location.address || prev.location_address,
                          location: { lat: location.lat, lng: location.lng }
                        }));
                      }}
                      height="300px"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold mb-2">Max Attendees</Label>
                <Input
                  type="number"
                  value={formData.max_attendees}
                  onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  min="1"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2">Ticket Price</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0 for free"
                    min="0"
                    step="0.01"
                  />
                  <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2">Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tags (press Enter)"
                />
                <Button onClick={addTag} variant="outline">
                  <Tag size={16} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>

            {myProfile?.subscription_tier === 'vip' && (
              <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-lg">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label className="text-sm">Feature this event (VIP only)</Label>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}