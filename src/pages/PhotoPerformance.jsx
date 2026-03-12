import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, TrendingUp, Eye, Heart, X, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import AfricanPattern from '@/components/shared/AfricanPattern';

export default function PhotoPerformance() {
  const [myProfile, setMyProfile] = useState(null);
  const [photoStats, setPhotoStats] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
      if (profiles.length > 0) {
        setMyProfile(profiles[0]);
      }
    };
    fetchProfile();
  }, []);

  // Fetch engagement data
  const { data: engagements = [] } = useQuery({
    queryKey: ['photo-engagement', myProfile?.id],
    queryFn: () => base44.entities.PhotoEngagement.filter({ profile_id: myProfile.id }),
    enabled: !!myProfile
  });

  // Calculate stats
  useEffect(() => {
    if (!myProfile || engagements.length === 0) return;

    const stats = myProfile.photos.map((photoUrl, index) => {
      const photoEngagements = engagements.filter(e => e.photo_url === photoUrl);
      const views = photoEngagements.filter(e => e.action === 'view').length;
      const likes = photoEngagements.filter(e => e.action === 'like').length;
      const passes = photoEngagements.filter(e => e.action === 'pass').length;
      const likeRate = views > 0 ? (likes / views) * 100 : 0;

      return {
        url: photoUrl,
        index,
        views,
        likes,
        passes,
        likeRate,
        isPrimary: photoUrl === myProfile.primary_photo
      };
    });

    // Sort by like rate
    stats.sort((a, b) => b.likeRate - a.likeRate);
    setPhotoStats(stats);
  }, [myProfile, engagements]);

  // Optimize photo order mutation
  const optimizeMutation = useMutation({
    mutationFn: async () => {
      if (!myProfile || photoStats.length === 0) return;

      // Reorder photos by performance
      const optimizedPhotos = photoStats.map(s => s.url);
      const bestPhoto = optimizedPhotos[0];

      await base44.entities.UserProfile.update(myProfile.id, {
        photos: optimizedPhotos,
        primary_photo: bestPhoto
      });

      // Log notification
      await base44.entities.Notification.create({
        user_profile_id: myProfile.id,
        type: 'profile_performance',
        title: '✨ Photos Optimized!',
        message: 'Your photos have been reordered for maximum impact'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      alert('✨ Photos optimized! Your best-performing photo is now first.');
    }
  });

  const hasEnoughData = engagements.length >= 20;
  const bestPhoto = photoStats[0];
  const avgLikeRate = photoStats.length > 0 
    ? photoStats.reduce((sum, s) => sum + s.likeRate, 0) / photoStats.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-amber-50/20 relative pb-24">
      <AfricanPattern className="text-purple-600" opacity={0.03} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('Profile')}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft size={20} />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Photo Performance</h1>
                <p className="text-sm text-gray-500">See which photos work best</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 relative z-10">
        {!hasEnoughData ? (
          <Card className="bg-gradient-to-br from-purple-50 to-amber-50 border-purple-200">
            <CardContent className="p-6 text-center">
              <TrendingUp size={48} className="mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-bold mb-2">Not Enough Data Yet</h3>
              <p className="text-gray-600 mb-4">
                We need at least 20 profile views to show accurate photo performance. 
                Keep swiping and your stats will appear here!
              </p>
              <div className="mt-4">
                <Progress value={(engagements.length / 20) * 100} className="h-2" />
                <p className="text-sm text-gray-500 mt-2">{engagements.length} / 20 views</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <Eye size={24} className="mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">{engagements.length}</div>
                  <div className="text-sm text-gray-600">Total Views</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Heart size={24} className="mx-auto mb-2 text-pink-600" />
                  <div className="text-2xl font-bold">{avgLikeRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Avg Like Rate</div>
                </CardContent>
              </Card>
            </div>

            {/* Best Photo */}
            {bestPhoto && (
              <Card className="mb-6 bg-gradient-to-br from-amber-50 to-purple-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="text-amber-600" />
                    Best Performing Photo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 items-center">
                    <img 
                      src={bestPhoto.url} 
                      alt="Best photo" 
                      className="w-24 h-32 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-2xl font-bold text-purple-600">{bestPhoto.likeRate.toFixed(0)}%</div>
                          <div className="text-xs text-gray-600">Like Rate</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{bestPhoto.views}</div>
                          <div className="text-xs text-gray-600">Views</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-pink-600">{bestPhoto.likes}</div>
                          <div className="text-xs text-gray-600">Likes</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Photo Rankings */}
            <Card>
              <CardHeader>
                <CardTitle>All Photos Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {photoStats.map((photo, rank) => (
                  <div key={photo.url} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-400">#{rank + 1}</div>
                    <img 
                      src={photo.url} 
                      alt={`Photo ${rank + 1}`} 
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Progress value={photo.likeRate} className="flex-1 h-2" />
                        <span className="text-sm font-semibold">{photo.likeRate.toFixed(0)}%</span>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye size={12} /> {photo.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={12} /> {photo.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <X size={12} /> {photo.passes}
                        </span>
                      </div>
                    </div>
                    {photo.isPrimary && (
                      <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Optimize Button */}
            <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t">
              <Button 
                onClick={() => optimizeMutation.mutate()}
                disabled={optimizeMutation.isPending}
                className="w-full max-w-md mx-auto flex bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700"
              >
                <Sparkles size={20} className="mr-2" />
                {optimizeMutation.isPending ? 'Optimizing...' : 'Optimize Photo Order'}
              </Button>
              <p className="text-xs text-center text-gray-500 mt-2">
                Reorder photos by performance automatically
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}