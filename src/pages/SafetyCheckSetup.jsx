import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Shield, MapPin, Phone, User, Clock, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function SafetyCheckSetup() {
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('matchId');
  
  const [myProfile, setMyProfile] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [formData, setFormData] = useState({
    date_location: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    check_in_time: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) {
          setMyProfile(profiles[0]);
        }

        if (matchId) {
          const matches = await base44.entities.Match.filter({ id: matchId });
          if (matches.length > 0) {
            const m = matches[0];
            const otherId = m.user1_id === profiles[0].id ? m.user2_id : m.user1_id;
            const otherProfiles = await base44.entities.UserProfile.filter({ id: otherId });
            if (otherProfiles.length > 0) {
              setOtherProfile(otherProfiles[0]);
            }
          }
        }
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      }
    };
    fetchData();
  }, [matchId]);

  const createSafetyCheckMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.SafetyCheck.create({
        user_profile_id: myProfile.id,
        date_location: formData.date_location,
        meeting_with_profile_id: otherProfile.id,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        check_in_time: formData.check_in_time,
        status: 'active'
      });

      // Send notification to emergency contact
      await base44.integrations.Core.SendEmail({
        to: formData.emergency_contact_phone + '@sms.gateway.com', // SMS gateway
        subject: 'Afrinnect Safety Check Active',
        body: `${myProfile.display_name} has activated a safety check for a meetup. Location: ${formData.date_location}. Check-in time: ${formData.check_in_time}`
      });
    },
    onSuccess: () => {
      alert('Safety check activated! Stay safe.');
      window.location.href = createPageUrl('Matches');
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-amber-50/20 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Safety Check</h1>
            <p className="text-gray-600 mt-2">
              Set up a safety check for your meetup with {otherProfile?.display_name}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Meetup Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="flex items-center gap-2">
                  <MapPin size={16} />
                  Meeting Location & Time
                </Label>
                <Textarea
                  placeholder="e.g., Starbucks on Main St, 6:00 PM"
                  value={formData.date_location}
                  onChange={(e) => setFormData({...formData, date_location: e.target.value})}
                  className="mt-2"
                  rows={2}
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <User size={16} />
                  Emergency Contact Name
                </Label>
                <Input
                  placeholder="e.g., Sarah Johnson"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Phone size={16} />
                  Emergency Contact Phone
                </Label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Clock size={16} />
                  Check-in Time
                </Label>
                <Input
                  type="datetime-local"
                  value={formData.check_in_time}
                  onChange={(e) => setFormData({...formData, check_in_time: e.target.value})}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll check in with you at this time
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Safety Tips</p>
                    <ul className="text-xs text-amber-800 mt-2 space-y-1 list-disc list-inside">
                      <li>Meet in public places</li>
                      <li>Tell someone where you're going</li>
                      <li>Keep your phone charged</li>
                      <li>Trust your instincts</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => createSafetyCheckMutation.mutate()}
                disabled={!formData.date_location || !formData.emergency_contact_name || !formData.check_in_time || createSafetyCheckMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Activate Safety Check
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}