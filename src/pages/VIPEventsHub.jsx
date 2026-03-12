import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Crown, Calendar, Users, Clock, Star, Video, 
  CheckCircle, Sparkles, Lock, MapPin, Trophy, Heart
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from 'date-fns';
import confetti from 'canvas-confetti';

export default function VIPEventsHub() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [myProfile, setMyProfile] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

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
  const hasAccess = tier === 'elite' || tier === 'vip';

  // Fetch upcoming events
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['vip-events', 'upcoming'],
    queryFn: async () => {
      const now = new Date().toISOString();
      return base44.entities.VIPEvent.filter({ 
        status: 'upcoming',
        scheduled_at: { $gte: now }
      }, 'scheduled_at', 20);
    },
    enabled: hasAccess
  });

  // Fetch past events
  const { data: pastEvents = [] } = useQuery({
    queryKey: ['vip-events', 'past'],
    queryFn: async () => {
      return base44.entities.VIPEvent.filter({ 
        status: 'completed'
      }, '-scheduled_at', 10);
    },
    enabled: hasAccess
  });

  // Fetch my registrations
  const { data: myRegistrations = [] } = useQuery({
    queryKey: ['vip-registrations', myProfile?.id],
    queryFn: async () => {
      return base44.entities.VIPEventRegistration.filter({ 
        user_profile_id: myProfile.id 
      });
    },
    enabled: !!myProfile && hasAccess
  });

  const registerMutation = useMutation({
    mutationFn: async (eventId) => {
      return base44.entities.VIPEventRegistration.create({
        event_id: eventId,
        user_profile_id: myProfile.id,
        user_id: myProfile.user_id,
        status: 'registered'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vip-registrations']);
      queryClient.invalidateQueries(['vip-events']);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  });

  const unregisterMutation = useMutation({
    mutationFn: async (registrationId) => {
      await base44.entities.VIPEventRegistration.update(registrationId, { status: 'cancelled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vip-registrations']);
      queryClient.invalidateQueries(['vip-events']);
    }
  });

  const isRegistered = (eventId) => {
    return myRegistrations.some(r => r.event_id === eventId && r.status === 'registered');
  };

  const getRegistration = (eventId) => {
    return myRegistrations.find(r => r.event_id === eventId && r.status === 'registered');
  };

  const handleRegister = (event) => {
    if (event.current_participants >= event.max_participants) {
      alert('This event is full. Please try another event.');
      return;
    }
    registerMutation.mutate(event.id);
  };

  const handleUnregister = (eventId) => {
    const registration = getRegistration(eventId);
    if (registration) {
      unregisterMutation.mutate(registration.id);
    }
  };

  const eventTypeIcons = {
    speed_dating: Heart,
    mixer: Users,
    workshop: Trophy,
    exclusive_party: Star,
    webinar: Video
  };

  const eventTypeColors = {
    speed_dating: 'from-pink-500 to-red-500',
    mixer: 'from-purple-500 to-indigo-500',
    workshop: 'from-amber-500 to-orange-500',
    exclusive_party: 'from-blue-500 to-cyan-500',
    webinar: 'from-green-500 to-emerald-500'
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-amber-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 max-w-md text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">VIP Events</h2>
          <p className="text-gray-600 mb-6">
            Exclusive events are only available for Elite and VIP members. Upgrade now to access:
          </p>
          <div className="space-y-3 mb-8 text-left">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-purple-600" />
              <span className="text-sm">Virtual Speed Dating Sessions</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-purple-600" />
              <span className="text-sm">Exclusive Mixers & Parties</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-purple-600" />
              <span className="text-sm">Dating Workshops & Webinars</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-purple-600" />
              <span className="text-sm">Priority Registration</span>
            </div>
          </div>
          <Link to={createPageUrl('PricingPlans')}>
            <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Crown size={20} className="mr-2" />
              Upgrade to Elite/VIP
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-amber-50/20 pb-24">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Crown size={20} className="text-purple-600" />
            VIP Events
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={24} />
            <span className="text-sm font-semibold uppercase tracking-wider">Exclusive Access</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">Connect Beyond the App</h2>
          <p className="text-white/90 text-lg">Join live events, meet amazing people in real-time</p>
        </div>

        <Tabs defaultValue="upcoming" className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
            <TabsTrigger value="past">Past Events</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 mt-6">
            {upcomingEvents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming events yet. Check back soon!</p>
                </CardContent>
              </Card>
            ) : (
              upcomingEvents.map(event => {
                const Icon = eventTypeIcons[event.event_type] || Calendar;
                const registered = isRegistered(event.id);
                const isFull = event.current_participants >= event.max_participants;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className={`overflow-hidden ${registered ? 'ring-2 ring-purple-500' : ''}`}>
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          {/* Image */}
                          <div className="md:w-1/3 relative">
                            <div className={`h-48 md:h-full bg-gradient-to-br ${eventTypeColors[event.event_type]} flex items-center justify-center`}>
                              <Icon size={64} className="text-white/40" />
                            </div>
                            {registered && (
                              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <CheckCircle size={12} /> Registered
                              </div>
                            )}
                            {isFull && !registered && (
                              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                FULL
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="md:w-2/3 p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <Badge className="mb-2 capitalize">{event.event_type.replace('_', ' ')}</Badge>
                                <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                              </div>
                            </div>

                            <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                              <div className="flex items-center gap-2 text-gray-700">
                                <Calendar size={16} className="text-purple-600" />
                                {format(new Date(event.scheduled_at), 'MMM d, yyyy')}
                              </div>
                              <div className="flex items-center gap-2 text-gray-700">
                                <Clock size={16} className="text-purple-600" />
                                {format(new Date(event.scheduled_at), 'h:mm a')}
                              </div>
                              <div className="flex items-center gap-2 text-gray-700">
                                <Users size={16} className="text-purple-600" />
                                {event.current_participants}/{event.max_participants} spots
                              </div>
                              <div className="flex items-center gap-2 text-gray-700">
                                <Clock size={16} className="text-purple-600" />
                                {event.duration_minutes} min
                              </div>
                            </div>

                            <div className="flex gap-3">
                              {registered ? (
                                <>
                                  {event.meeting_link && (
                                    <a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                                      <Button className="w-full bg-green-600 hover:bg-green-700">
                                        <Video size={18} className="mr-2" />
                                        Join Event
                                      </Button>
                                    </a>
                                  )}
                                  <Button
                                    variant="outline"
                                    onClick={() => handleUnregister(event.id)}
                                    disabled={unregisterMutation.isPending}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  onClick={() => handleRegister(event)}
                                  disabled={isFull || registerMutation.isPending}
                                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                >
                                  {isFull ? 'Event Full' : 'Register Now'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4 mt-6">
            {pastEvents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No past events to show</p>
                </CardContent>
              </Card>
            ) : (
              pastEvents.map(event => (
                <Card key={event.id} className="opacity-60">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge className="mb-2 capitalize">{event.event_type.replace('_', ' ')}</Badge>
                        <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-500">
                          {format(new Date(event.scheduled_at), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                      <Badge variant="outline">Completed</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}