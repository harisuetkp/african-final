import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import VerificationBadge from '../shared/VerificationBadge';

export default function ConversationItem({ match, profile, lastMessage, unreadCount = 0, onClick }) {
  const formatMessageDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d');
  };

  const truncateMessage = (text, maxLength = 40, isPremium = true) => {
    if (!text) return 'Say hello! 👋';
    
    // For non-premium, show teaser (first 3 words then blur indication)
    if (!isPremium && text.length > 15) {
      const words = text.split(' ');
      if (words.length > 3) {
        return words.slice(0, 3).join(' ') + ' •••';
      }
    }
    
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const photo = profile?.primary_photo || profile?.photos?.[0] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100';

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors ${
        unreadCount > 0 ? 'bg-purple-50/30' : ''
      }`}
    >
      <div className="relative flex-shrink-0">
        <img 
          src={photo}
          alt={profile?.display_name}
          className="w-16 h-16 rounded-full object-cover"
        />
        {profile?.is_active && (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className={`font-semibold truncate ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-800'}`}>
              {profile?.display_name}
            </h3>
            <VerificationBadge verification={profile?.verification_status} size="small" />
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
            {formatMessageDate(lastMessage?.created_date || match?.matched_at)}
          </span>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate flex-1 ${unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
            {truncateMessage(lastMessage?.content)}
          </p>
          {unreadCount > 0 && (
            <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}