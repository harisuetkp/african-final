import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Send, Loader2, Calendar, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { format } from 'date-fns';

export default function EventChat() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  const [myProfile, setMyProfile] = useState(null);
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) setMyProfile(profiles[0]);
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      }
    };
    fetchProfile();
  }, []);

  // Fetch event
  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const events = await base44.entities.Event.filter({ id: eventId });
      return events[0];
    },
    enabled: !!eventId
  });

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['event-messages', eventId],
    queryFn: async () => {
      const msgs = await base44.entities.Message.filter(
        { match_id: `event_${eventId}` },
        '-created_date',
        100
      );
      return msgs.reverse();
    },
    enabled: !!eventId,
    refetchInterval: 3000
  });

  // Fetch attendee profiles
  const { data: attendeeProfiles = [] } = useQuery({
    queryKey: ['event-attendees', event?.attendees],
    queryFn: async () => {
      if (!event?.attendees?.length) return [];
      const profiles = await Promise.all(
        event.attendees.map(id => 
          base44.entities.UserProfile.filter({ id }).then(p => p[0])
        )
      );
      return profiles.filter(Boolean);
    },
    enabled: !!event?.attendees?.length
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!message.trim() || !myProfile) return;

      // Check if user is attending
      if (!event?.attendees?.includes(myProfile.id)) {
        throw new Error('Only event attendees can chat');
      }

      // AI content moderation
      const moderationResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Is this message appropriate for an event chat? Reply ONLY with "yes" or "no": "${message}"`,
      });

      if (moderationResult.toLowerCase().includes('no')) {
        throw new Error('Message contains inappropriate content');
      }

      await base44.entities.Message.create({
        match_id: `event_${eventId}`,
        sender_id: myProfile.id,
        receiver_id: eventId,
        content: message.trim(),
        message_type: 'text'
      });
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['event-messages'] });
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const getProfile = (senderId) => {
    return attendeeProfiles.find(p => p.id === senderId);
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  const isAttending = event?.attendees?.includes(myProfile?.id);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl(`EventDetails?id=${eventId}`)}>
              <Button variant="ghost" size="icon">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold">{event.title}</h1>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar size={12} />
                <span>{event.attendees?.length || 0} attending</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 max-w-4xl w-full mx-auto px-4 py-4">
        {!isAttending ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-semibold mb-2">RSVP to join the conversation</p>
            <Link to={createPageUrl(`EventDetails?id=${eventId}`)}>
              <Button className="mt-4 bg-purple-600">
                RSVP to Event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const senderProfile = getProfile(msg.sender_id);
                const isMyMessage = msg.sender_id === myProfile?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isMyMessage ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <img
                        src={senderProfile?.primary_photo || senderProfile?.photos?.[0] || 'https://via.placeholder.com/40'}
                        alt={senderProfile?.display_name}
                        className="w-full h-full object-cover"
                      />
                    </Avatar>
                    <div className={`flex flex-col ${isMyMessage ? 'items-end' : ''}`}>
                      <p className="text-xs text-gray-500 mb-1">
                        {senderProfile?.display_name}
                      </p>
                      <div
                        className={`rounded-2xl px-4 py-2 max-w-xs ${
                          isMyMessage
                            ? 'bg-purple-600 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(msg.created_date), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      {isAttending && (
        <div className="bg-white border-t p-4 safe-area-inset-bottom">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessageMutation.mutate()}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button
              onClick={() => sendMessageMutation.mutate()}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
            <Shield size={12} />
            Messages are moderated by AI
          </p>
        </div>
      )}
    </div>
  );
}