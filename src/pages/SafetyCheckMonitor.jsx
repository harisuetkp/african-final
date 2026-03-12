import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, CheckCircle, AlertTriangle, Clock, MapPin, Phone, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SafetyCheckMonitor() {
  const [myProfile, setMyProfile] = useState(null);
  const [checkInDialog, setCheckInDialog] = useState({ open: false, checkId: null });
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = await base44.auth.me();
      if (user) {
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) setMyProfile(profiles[0]);
      }
    };
    fetchProfile();
  }, []);

  const { data: activeChecks = [] } = useQuery({
    queryKey: ['safety-checks', myProfile?.id],
    queryFn: () => base44.entities.SafetyCheck.filter({
      user_profile_id: myProfile.id,
      status: { $in: ['active', 'alert_triggered'] }
    }, '-created_date'),
    enabled: !!myProfile,
    refetchInterval: 10000 // Check every 10 seconds
  });

  // Check if any check-ins are due
  useEffect(() => {
    if (activeChecks.length > 0) {
      activeChecks.forEach(check => {
        const checkInTime = new Date(check.check_in_time);
        const now = new Date();
        
        if (now >= checkInTime && check.status === 'active') {
          // Show check-in prompt
          setCheckInDialog({ open: true, checkId: check.id });
        }
      });
    }
  }, [activeChecks]);

  const checkInMutation = useMutation({
    mutationFn: async (checkId) => {
      await base44.entities.SafetyCheck.update(checkId, {
        status: 'checked_in'
      });

      // Notify emergency contact
      const check = activeChecks.find(c => c.id === checkId);
      if (check) {
        await base44.integrations.Core.SendEmail({
          to: check.emergency_contact_phone + '@sms.gateway.com',
          subject: 'Afrinnect Safety Check - All Clear',
          body: `${myProfile.display_name} has checked in safely from their meetup.`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['safety-checks']);
      setCheckInDialog({ open: false, checkId: null });
    }
  });

  const triggerAlertMutation = useMutation({
    mutationFn: async (checkId) => {
      const check = activeChecks.find(c => c.id === checkId);
      
      // Get current location
      let location = null;
      if (navigator.geolocation) {
        const pos = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(resolve);
        });
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }

      await base44.entities.SafetyCheck.update(checkId, {
        status: 'alert_triggered',
        panic_triggered: true,
        panic_location: location
      });

      // Send emergency alerts
      await base44.integrations.Core.SendEmail({
        to: check.emergency_contact_phone + '@sms.gateway.com',
        subject: '🚨 EMERGENCY: Safety Alert from Afrinnect',
        body: `${myProfile.display_name} has triggered a safety alert. Last known location: ${location ? `https://maps.google.com/?q=${location.lat},${location.lng}` : check.date_location}. Contact immediately!`
      });

      // Notify Afrinnect support
      await base44.integrations.Core.SendEmail({
        to: 'support@afrinnect.com',
        subject: 'URGENT: Safety Alert Triggered',
        body: `User ${myProfile.display_name} (${myProfile.id}) has triggered a safety alert. Emergency contact: ${check.emergency_contact_name} (${check.emergency_contact_phone}). Meeting location: ${check.date_location}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['safety-checks']);
      alert('Emergency alert sent to your emergency contact and our support team.');
    }
  });

  const cancelCheckMutation = useMutation({
    mutationFn: async (checkId) => {
      await base44.entities.SafetyCheck.update(checkId, {
        status: 'completed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['safety-checks']);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 pb-24">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={24} />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Active Safety Checks</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeChecks.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Active Safety Checks</h3>
              <p className="text-gray-600 mb-4">Set up a safety check before your next meetup</p>
              <Link to={createPageUrl('Matches')}>
                <Button className="bg-green-600">Go to Matches</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeChecks.map(check => {
              const checkInTime = new Date(check.check_in_time);
              const now = new Date();
              const isOverdue = now >= checkInTime;
              
              return (
                <Card key={check.id} className={`${check.status === 'alert_triggered' ? 'border-red-500 bg-red-50' : isOverdue ? 'border-amber-500 bg-amber-50' : 'border-green-500 bg-green-50'}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Safety Check Active</CardTitle>
                      <Badge className={
                        check.status === 'alert_triggered' ? 'bg-red-600' :
                        isOverdue ? 'bg-amber-600' : 'bg-green-600'
                      }>
                        {check.status === 'alert_triggered' ? 'ALERT' : isOverdue ? 'CHECK-IN DUE' : 'ACTIVE'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-gray-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Meeting Location</p>
                        <p className="text-sm text-gray-600">{check.date_location}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock size={18} className="text-gray-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Check-in Time</p>
                        <p className="text-sm text-gray-600">
                          {checkInTime.toLocaleString()}
                          {isOverdue && <span className="text-amber-600 ml-2">(Overdue)</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User size={18} className="text-gray-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Emergency Contact</p>
                        <p className="text-sm text-gray-600">{check.emergency_contact_name}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3">
                      {check.status === 'active' && (
                        <>
                          <Button
                            onClick={() => checkInMutation.mutate(check.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle size={18} className="mr-2" />
                            I'm Safe
                          </Button>
                          <Button
                            onClick={() => triggerAlertMutation.mutate(check.id)}
                            variant="destructive"
                            className="flex-1"
                          >
                            <AlertTriangle size={18} className="mr-2" />
                            Send Alert
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={() => cancelCheckMutation.mutate(check.id)}
                        variant="outline"
                        size="sm"
                      >
                        End Check
                      </Button>
                    </div>

                    {check.status === 'alert_triggered' && (
                      <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                        <p className="text-sm font-semibold text-red-900">
                          🚨 Emergency alert has been sent to your emergency contact and our support team.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Check-in Prompt Dialog */}
      <Dialog open={checkInDialog.open} onOpenChange={(open) => setCheckInDialog({ ...checkInDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield size={24} className="text-green-600" />
              Safety Check-In
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-center text-gray-700">
              It's time for your safety check-in. Are you safe?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => checkInMutation.mutate(checkInDialog.checkId)}
                className="flex-1 bg-green-600 hover:bg-green-700 py-6"
              >
                <CheckCircle size={24} className="mr-2" />
                I'm Safe
              </Button>
              <Button
                onClick={() => {
                  triggerAlertMutation.mutate(checkInDialog.checkId);
                  setCheckInDialog({ open: false, checkId: null });
                }}
                variant="destructive"
                className="flex-1 py-6"
              >
                <AlertTriangle size={24} className="mr-2" />
                Emergency
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}