import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInfinitePagination } from '@/components/shared/useInfinitePagination';
import PullToRefresh from '@/components/shared/PullToRefresh';
import LazyImage from '@/components/shared/LazyImage';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Calendar, MapPin, Users, Globe, Filter, Search, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmptyState from '@/components/shared/EmptyState';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { EventCardSkeleton } from '@/components/shared/SkeletonLoader';

export default function Events() {
  const [myProfile, setMyProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventType, setEventType] = useState('all');
  const [location, setLocation] = useState('all');
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [activeTab, setActiveTab] = useState('discover');
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) {
          setMyProfile(profiles[0]);
        } else {
          // No profile yet, redirect to onboarding
          window.location.href = createPageUrl('Onboarding');
        }
      } catch (e) {
        // Not logged in, redirect to landing
        console.error('Events auth error:', e);
      }
    };
    fetchProfile();
  }, []);

  // Build filters for server-side filtering
  const buildFilters = () => {
    const now = new Date().toISOString();
    let query = {};
    
    if (eventType !== 'all') {
      query.event_type = eventType;
    }
    
    if (location !== 'all' && myProfile) {
      query.country = myProfile.current_country;
    }

    if (timeFilter === 'upcoming') {
      query.start_date = { $gte: now };
    } else if (timeFilter === 'past') {
      query.start_date = { $lt: now };
    }

    return query;
  };

  const { 
    items: events, 
    loadMore, 
    hasMore, 
    isLoadingMore, 
    isLoading,
    refetch 
  } = useInfinitePagination('Event', buildFilters(), {
    pageSize: 20,
    sortBy: timeFilter === 'past' ? '-start_date' : 'start_date',
    enabled: !!myProfile,
    refetchInterval: 180000,
    retry: 1,
    retryDelay: 5000
  });

  const observerRef = useRef();
  const lastEventRef = useCallback(node => {
    if (isLoadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [isLoadingMore, hasMore, loadMore]);

  const joinEventMutation = useMutation({
    mutationFn: async (eventId) => {
      try {
        const event = events.find(e => e.id === eventId);
        if (!event) return;

        const updatedAttendees = [...(event.attendees || []), myProfile.id];
        await base44.entities.Event.update(eventId, {
          attendees: updatedAttendees
        });

        await base44.entities.Notification.create({
          user_profile_id: myProfile.id,
          type: 'admin_message',
          title: 'Event Registered!',
          message: `You're registered for ${event.title}`,
          link_to: createPageUrl('Events')
        });
      } catch (error) {
        console.error('Failed to join event:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
    }
  });

  const filteredEvents = events.filter(event => {
    if (searchQuery) {
      return event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const myEvents = events.filter(event => event.attendees?.includes(myProfile?.id));

  const canCreateEvent = myProfile && (
    myProfile.subscription_tier && myProfile.subscription_tier !== 'free' ||
    myProfile.verification_status?.photo_verified
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-amber-50/20 pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Community Events</h1>
            {canCreateEvent && (
              <Link to={createPageUrl('CreateEvent')}>
                <Button className="bg-gradient-to-r from-purple-600 to-purple-700">
                  <Calendar size={18} className="mr-2" />
                  Create Event
                </Button>
              </Link>
            )}
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Main Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="discover">Discover Events</TabsTrigger>
              <TabsTrigger value="my_events">
                My Events
                {myEvents.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 min-w-[20px]">{myEvents.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters (Only show in Discover tab) */}
          {activeTab === 'discover' && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Tabs value={timeFilter} onValueChange={setTimeFilter}>
                <TabsList>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cultural_festival">Cultural Festival</SelectItem>
                <SelectItem value="meetup">Meetup</SelectItem>
                <SelectItem value="speed_dating">Speed Dating</SelectItem>
                <SelectItem value="networking">Networking</SelectItem>
                <SelectItem value="concert">Concert</SelectItem>
                <SelectItem value="food_festival">Food Festival</SelectItem>
              </SelectContent>
            </Select>

            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="local">Near Me</SelectItem>
              </SelectContent>
            </Select>
          </div>
          )}
        </div>
      </header>

      <PullToRefresh onRefresh={refetch}>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <EventCardSkeleton key={idx} />
            ))}
          </div>
        ) : activeTab === 'discover' ? (
          filteredEvents.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Events Found"
              description="Try adjusting your filters or check back later for new events"
              actionLabel="Reset Filters"
              onAction={() => {
                setEventType('all');
                setLocation('all');
                setSearchQuery('');
              }}
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, idx) => {
                const isAttending = event.attendees?.includes(myProfile?.id);
                const isFull = event.max_attendees && event.attendees?.length >= event.max_attendees;

                return (
                  <motion.div
                  key={event.id}
                  ref={idx === filteredEvents.length - 1 ? lastEventRef : null}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Link to={createPageUrl(`EventDetails?id=${event.id}`)}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      {event.image_url && (
                        <LazyImage
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge className="bg-purple-100 text-purple-700">
                            {event.event_type.replace('_', ' ')}
                          </Badge>
                          {event.is_featured && (
                            <Badge className="bg-amber-500">Featured</Badge>
                          )}
                        </div>
                        <CardTitle>{event.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {event.description}
                        </p>

                        <div className="space-y-2 text-sm text-gray-700 mb-4">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-gray-400" />
                            <span>{format(new Date(event.start_date), 'PPp')}</span>
                          </div>
                          
                          {event.is_virtual ? (
                            <div className="flex items-center gap-2">
                              <Globe size={16} className="text-gray-400" />
                              <span>Virtual Event</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-gray-400" />
                              <span className="line-clamp-1">
                                {event.location_name}, {event.city}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-gray-400" />
                            <span>
                              {event.attendees?.length || 0}
                              {event.max_attendees && ` / ${event.max_attendees}`} attending
                            </span>
                          </div>
                        </div>

                        {event.price > 0 && (
                          <p className="text-lg font-bold text-purple-600 mb-4">
                            ${event.price} {event.currency}
                          </p>
                        )}

                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            joinEventMutation.mutate(event.id);
                          }}
                          disabled={isAttending || isFull || joinEventMutation.isPending}
                          className={`w-full ${
                            isAttending
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-purple-600 hover:bg-purple-700'
                          }`}
                        >
                          {isAttending ? '✓ Attending' : isFull ? 'Event Full' : 'View Details'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )) : (
          /* My Events Tab */
          myEvents.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Upcoming Events"
              description="You haven't joined any events yet. Browse the Discover tab to find something fun!"
              actionLabel="Browse Events"
              onAction={() => setActiveTab('discover')}
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Link to={createPageUrl(`EventDetails?id=${event.id}`)}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-600">
                      {/* Condensed card for "My Events" */}
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg leading-tight">{event.title}</h3>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Going</Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-purple-500" />
                            <span className="font-medium text-gray-900">{format(new Date(event.start_date), 'PPp')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-gray-400" />
                            <span className="line-clamp-1">{event.location_name || 'Virtual'}</span>
                          </div>
                        </div>
                        
                        <Button className="w-full mt-4 bg-white text-purple-600 border border-purple-200 hover:bg-purple-50">
                          View Ticket & Details
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )
        )}
        
        {isLoadingMore && activeTab === 'discover' && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent" />
          </div>
        )}

        {!hasMore && events.length > 0 && activeTab === 'discover' && (
          <p className="text-center text-gray-500 py-8">No more events</p>
        )}
      </main>
      </PullToRefresh>
    </div>
  );
}