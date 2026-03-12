import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Heart, Users, Clock, Video, Sparkles, Crown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function SpeedDatingLobby() {
  const navigate = useNavigate();
  const [myProfile, setMyProfile] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(180);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) {
          setMyProfile(profiles[0]);
        }
      } catch (e) {
        navigate(createPageUrl('Landing'));
      }
    };
    fetchProfile();
  }, []);

  const tier = myProfile?.subscription_tier || 'free';
  const hasAccess = tier === 'vip';

  // Countdown timer
  useEffect(() => {
    if (!currentSession) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Move to next round
          return 180;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession]);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-purple-800 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Virtual Speed Dating</h2>
            <p className="text-gray-600 mb-6">
              This feature is exclusive to VIP members. Upgrade to participate in live speed dating events!
            </p>
            <Button onClick={() => navigate(createPageUrl('PricingPlans'))} className="w-full">
              <Crown size={18} className="mr-2" />
              Upgrade to VIP
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-purple-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart size={32} className="text-pink-600" />
            <h1 className="text-3xl font-bold text-gray-900">Virtual Speed Dating</h1>
          </div>
          <p className="text-gray-600">Meet 5-10 people in quick 3-minute video chats</p>
        </div>

        {/* Waiting Lobby */}
        {!currentSession && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Users size={48} className="text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Waiting for next event...</h2>
              <p className="text-gray-600 mb-6">
                Speed dating events run every Friday and Saturday at 8 PM EST. Register for an upcoming event to participate!
              </p>
              <Button onClick={() => navigate(createPageUrl('VIPEventsHub'))} className="bg-gradient-to-r from-pink-600 to-purple-600">
                View Upcoming Events
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Active Session */}
        {currentSession && (
          <div className="space-y-6">
            {/* Timer */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock size={20} className="text-purple-600" />
                    <span className="font-semibold">Round 1 of 5</span>
                  </div>
                  <Badge>3:00 remaining</Badge>
                </div>
                <Progress value={(timeRemaining / 180) * 100} className="h-2" />
              </CardContent>
            </Card>

            {/* Video Area */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-900 rounded-t-xl flex items-center justify-center">
                  <div className="text-center">
                    <Video size={64} className="text-white/50 mx-auto mb-4" />
                    <p className="text-white/70">Video call will appear here</p>
                  </div>
                </div>
                <div className="p-6 bg-gradient-to-r from-pink-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">Sarah, 28</h3>
                      <p className="text-sm text-gray-600">Marketing Manager • New York</p>
                    </div>
                    <Button className="bg-gradient-to-r from-pink-600 to-red-600">
                      <Heart size={18} className="mr-2" />
                      I'm Interested
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1">
                <Sparkles size={18} className="mr-2" />
                Send Icebreaker
              </Button>
              <Button variant="destructive" className="flex-1">
                End Call Early
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}