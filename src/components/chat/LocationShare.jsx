import React, { useState } from 'react';
import { MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LocationShare({ matchId, myProfileId, onShare }) {
  const [showDialog, setShowDialog] = useState(false);
  const [duration, setDuration] = useState(60);

  const handleShare = async () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const expiresAt = new Date(Date.now() + duration * 60000);
        
        await onShare({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          duration_minutes: duration,
          expires_at: expiresAt.toISOString()
        });
        
        setShowDialog(false);
      });
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <MapPin size={16} />
        Share Location
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Live Location</DialogTitle>
            <DialogDescription>
              Your date will be able to see your real-time location for safety
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 120].map(mins => (
                  <Button
                    key={mins}
                    onClick={() => setDuration(mins)}
                    variant={duration === mins ? 'default' : 'outline'}
                    size="sm"
                  >
                    {mins} min
                  </Button>
                ))}
              </div>
            </div>

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-3">
                <p className="text-xs text-amber-800">
                  🔒 Your location is encrypted and only visible to this match. It automatically stops sharing after {duration} minutes.
                </p>
              </CardContent>
            </Card>

            <Button onClick={handleShare} className="w-full">
              Start Sharing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}