import React from 'react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users, Globe, Video } from 'lucide-react';
import CountryFlag from '../shared/CountryFlag';

export default function EventCard({ event, onJoin, isAttending = false }) {
  const formatDate = (date) => {
    if (!date) return '';
    return format(new Date(date), 'EEE, MMM d • h:mm a');
  };

  const typeLabels = {
    cultural_festival: 'Cultural Festival',
    meetup: 'Meetup',
    speed_dating: 'Speed Dating',
    networking: 'Networking',
    concert: 'Concert',
    food_festival: 'Food Festival',
    art_exhibition: 'Art Exhibition',
    community_gathering: 'Community'
  };

  const typeColors = {
    cultural_festival: 'bg-amber-100 text-amber-800',
    meetup: 'bg-blue-100 text-blue-800',
    speed_dating: 'bg-pink-100 text-pink-800',
    networking: 'bg-purple-100 text-purple-800',
    concert: 'bg-green-100 text-green-800',
    food_festival: 'bg-orange-100 text-orange-800',
    art_exhibition: 'bg-rose-100 text-rose-800',
    community_gathering: 'bg-teal-100 text-teal-800'
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={event.image_url || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <Badge className={typeColors[event.event_type]}>
            {typeLabels[event.event_type]}
          </Badge>
        </div>
        {event.is_featured && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-amber-500 text-white">Featured</Badge>
          </div>
        )}
        {event.is_virtual && (
          <div className="absolute bottom-3 right-3">
            <Badge className="bg-purple-600 text-white flex items-center gap-1">
              <Video size={12} />
              Virtual
            </Badge>
          </div>
        )}
      </div>
      
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{event.title}</h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Calendar size={16} className="text-purple-600 flex-shrink-0" />
            <span>{formatDate(event.start_date)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            {event.is_virtual ? (
              <>
                <Globe size={16} className="text-purple-600 flex-shrink-0" />
                <span>Online Event</span>
              </>
            ) : (
              <>
                <MapPin size={16} className="text-purple-600 flex-shrink-0" />
                <span className="truncate">{event.location_name || `${event.city}, ${event.country}`}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Users size={16} className="text-purple-600 flex-shrink-0" />
            <span>
              {event.attendees?.length || 0}
              {event.max_attendees ? ` / ${event.max_attendees}` : ''} attending
            </span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

        {event.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {event.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm">
            {event.price > 0 ? (
              <span className="font-semibold text-purple-700">
                {event.currency || '$'}{event.price}
              </span>
            ) : (
              <span className="text-green-600 font-medium">Free</span>
            )}
          </div>
          
          <Button 
            onClick={() => onJoin(event)}
            variant={isAttending ? "outline" : "default"}
            className={isAttending 
              ? "border-purple-600 text-purple-600" 
              : "bg-gradient-to-r from-purple-600 to-purple-700"
            }
          >
            {isAttending ? 'Attending ✓' : 'Join Event'}
          </Button>
        </div>
      </div>
    </div>
  );
}