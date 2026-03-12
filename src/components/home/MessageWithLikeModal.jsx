import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MessageWithLikeModal({ profile, onSend, onClose, open }) {
  const [message, setMessage] = useState('');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send a message to {profile?.display_name}</DialogTitle>
          <DialogDescription>
            Stand out by adding a personal note with your like!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <img
              src={profile?.primary_photo || profile?.photos?.[0]}
              alt={profile?.display_name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-medium">{profile?.display_name}</p>
              <p className="text-sm text-gray-500">{profile?.current_city}</p>
            </div>
          </div>

          <Textarea
            placeholder="Say something interesting..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={200}
          />
          
          <p className="text-xs text-gray-500 text-right">{message.length}/200</p>

          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Skip
            </Button>
            <Button
              onClick={() => {
                if (message.trim()) {
                  onSend(message.trim());
                } else {
                  onSend(null);
                }
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {message.trim() ? 'Send Like + Message' : 'Just Like'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}