import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

export default function ReadReceipt({ message, isOwnMessage }) {
  if (!isOwnMessage) return null;

  return (
    <div className="flex items-center gap-1 mt-1">
      {message.is_read ? (
        <>
          <CheckCheck size={14} className="text-blue-500" />
          <span className="text-xs text-gray-500">
            Read {new Date(message.read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </>
      ) : (
        <>
          <Check size={14} className="text-gray-400" />
          <span className="text-xs text-gray-400">Sent</span>
        </>
      )}
    </div>
  );
}