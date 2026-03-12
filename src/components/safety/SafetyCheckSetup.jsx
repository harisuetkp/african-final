import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, Clock, User, Phone, MapPin, Calendar, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SafetyCheckSetup({ myProfile, matchProfile, initialData }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    date_location: initialData?.venue_name ? `${initialData.venue_name}, ${initialData.venue_address || ''}` : '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    check_in_time: initialData?.check_in_time || ''
  });

  useEffect(() => {
    if (initialData && open) {
        setFormData(prev => ({
            ...prev,
            date_location: initialData.venue_name ? `${initialData.venue_name}, ${initialData.venue_address || ''}` : prev.date_location,
            check_in_time: initialData.check_in_time || prev.check_in_time
        }));
    }
  }, [initialData, open]);

  const createSafetyCheckMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.SafetyCheck.create({
        user_profile_id: myProfile.id,
        meeting_with_profile_id: matchProfile.id,
        ...formData,
        status: 'active'
      });
    },
    onSuccess: () => {
      setOpen(false);
      // Reset form
      setFormData({
        date_location: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        check_in_time: ''
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Shield size={16} />
          Set Up Safety Check
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield size={20} className="text-purple-600" />
            Safety Check Setup
          </DialogTitle>
          <DialogDescription>
            Let someone know you're meeting up. We'll check in with you at the scheduled time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <img
                src={matchProfile?.primary_photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                alt={matchProfile?.display_name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-sm">Meeting with {matchProfile?.display_name}</p>
                <p className="text-xs text-gray-500">Stay safe out there!</p>
              </div>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <MapPin size={14} />
              Where and when are you meeting?
            </Label>
            <Textarea
              value={formData.date_location}
              onChange={(e) => setFormData({ ...formData, date_location: e.target.value })}
              placeholder="e.g., Starbucks on Main St, Saturday 3pm"
              className="mt-2"
              rows={2}
            />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <User size={14} />
              Emergency Contact Name
            </Label>
            <Input
              value={formData.emergency_contact_name}
              onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              placeholder="Friend or family member"
              className="mt-2"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Phone size={14} />
              Emergency Contact Phone
            </Label>
            <Input
              type="tel"
              value={formData.emergency_contact_phone}
              onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="mt-2"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Clock size={14} />
              When should we check in?
            </Label>
            <Input
              type="datetime-local"
              value={formData.check_in_time}
              onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll send you a notification to confirm you're safe
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => createSafetyCheckMutation.mutate()}
            disabled={createSafetyCheckMutation.isPending || !formData.date_location || !formData.emergency_contact_name}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {createSafetyCheckMutation.isPending ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Shield size={16} className="mr-2" />
            )}
            Set Up Safety Check
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}