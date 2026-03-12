import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ReadReceipts({ message, isPremium = false }) {
  // Only show read receipts for messages sent by the current user
  if (!message) return null;
  
  const isRead = message.is_read;
  const readAt = message.read_at;
  
  // Format read time
  const formatReadTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Free users see basic checkmarks
  if (!isPremium) {
    return (
      <span className="text-xs opacity-70 ml-1">
        {isRead ? '✓✓' : '✓'}
      </span>
    );
  }

  // Premium users see enhanced read receipts with timestamps
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center ml-1">
            {isRead ? (
              <CheckCheck size={14} className="text-blue-400" />
            ) : (
              <Check size={14} className="opacity-70" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {isRead ? (
            <span>Read {readAt ? formatReadTime(readAt) : ''}</span>
          ) : (
            <span>Delivered</span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}