import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck, Mic, Image as ImageIcon } from 'lucide-react';
import TranslateMessage from './TranslateMessage';

export default function ChatBubble({ message, isOwn, senderPhoto }) {
  const formatTime = (date) => {
    if (!date) return '';
    return format(new Date(date), 'HH:mm');
  };

  return (
    <div className={`flex gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && (
        <img 
          src={senderPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'} 
          alt="sender"
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
      )}
      
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div 
          className={`rounded-2xl px-4 py-2 ${
            isOwn 
              ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-md' 
              : 'bg-gray-100 text-gray-800 rounded-bl-md'
          }`}
        >
          {message.message_type === 'image' ? (
            <div className="max-w-xs">
              <img 
                src={message.media_url} 
                alt="Shared" 
                className="rounded-lg w-full cursor-pointer hover:opacity-90 transition"
                onClick={() => window.open(message.media_url, '_blank')}
              />
            </div>
          ) : message.message_type === 'voice_note' ? (
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isOwn ? 'bg-white/20' : 'bg-purple-100'}`}>
                <Mic size={18} className={isOwn ? 'text-white' : 'text-purple-600'} />
              </div>
              <div className="flex-1">
                <div className={`h-1 rounded-full ${isOwn ? 'bg-white/30' : 'bg-gray-300'}`}>
                  <div className={`h-full w-1/2 rounded-full ${isOwn ? 'bg-white' : 'bg-purple-600'}`} />
                </div>
                <span className={`text-xs mt-1 block ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                  0:15
                </span>
              </div>
            </div>
          ) : message.message_type === 'ice_breaker' ? (
            <div className="space-y-1">
              <div className={`text-xs ${isOwn ? 'text-white/70' : 'text-purple-600'} font-medium`}>
                Ice Breaker
              </div>
              <p>{message.content}</p>
            </div>
          ) : (
            <p className="break-words">{message.content}</p>
          )}
        </div>
        
        <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'justify-end' : 'justify-between'}`}>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">{formatTime(message.created_date)}</span>
            {isOwn && (
              message.is_read 
                ? <CheckCheck size={14} className="text-blue-500" />
                : <Check size={14} className="text-gray-400" />
            )}
          </div>
          {!isOwn && message.message_type === 'text' && (
            <TranslateMessage message={message.content} messageId={message.id} />
          )}
        </div>
      </div>
    </div>
  );
}