import React from 'react';
import { Music } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SpotifySection({ profile }) {
  if (!profile?.spotify_top_artists && !profile?.spotify_top_song) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Music size={20} className="text-green-600" />
          Music Taste
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {profile.spotify_top_song && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Current Anthem</p>
            <p className="font-medium">🎵 {profile.spotify_top_song}</p>
          </div>
        )}
        
        {profile.spotify_top_artists?.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-2">Top Artists</p>
            <div className="flex flex-wrap gap-2">
              {profile.spotify_top_artists.map((artist, idx) => (
                <Badge key={idx} variant="secondary" className="bg-green-100 text-green-700">
                  {artist}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {profile.instagram_handle && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-500 mb-1">Instagram</p>
            <a
              href={`https://instagram.com/${profile.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline"
            >
              @{profile.instagram_handle}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}