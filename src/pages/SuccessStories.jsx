import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Heart, ThumbsUp, ArrowLeft, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from 'date-fns';

export default function SuccessStories() {
  const [myProfile, setMyProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        setIsAdmin(user.role === 'admin' || user.email === 'pivotngoyb@gmail.com');
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) setMyProfile(profiles[0]);
      } catch (e) {}
    };
    fetchProfile();
  }, []);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['success-stories', myProfile?.id],
    queryFn: async () => {
      // Fetch approved stories
      const approved = await base44.entities.SuccessStory.filter({ is_approved: true }, '-created_date', 50);
      
      // Fetch my stories (including pending ones)
      let myStories = [];
      if (myProfile?.id) {
        try {
          myStories = await base44.entities.SuccessStory.filter({ user1_profile_id: myProfile.id }, '-created_date', 10);
        } catch (e) {
          console.error('Error fetching my stories', e);
        }
      }
      
      // Merge and deduplicate
      const allStories = [...myStories, ...approved];
      const uniqueStories = Array.from(new Map(allStories.map(s => [s.id, s])).values());
      
      // Sort by date descending
      return uniqueStories.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

  const likeMutation = useMutation({
    mutationFn: async (storyId) => {
      const story = stories.find(s => s.id === storyId);
      await base44.entities.SuccessStory.update(storyId, {
        likes_count: (story.likes_count || 0) + 1
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['success-stories'])
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50/30 to-amber-50/20 pb-24">
      <header className="bg-white/80 backdrop-blur-lg border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="font-bold text-lg">Success Stories</h1>
          <Link to={createPageUrl('SubmitStory')}>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus size={16} />
              Share
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {stories.map(story => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  {story.couple_photo_url && (
                    <img
                      src={story.couple_photo_url}
                      alt="Couple"
                      className="w-full h-64 object-cover"
                    />
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      {!story.is_approved && (
                        isAdmin ? (
                          <Link to={createPageUrl('AdminDashboard')}>
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 cursor-pointer">
                              🕒 Pending Review (Click to Approve)
                            </Badge>
                          </Link>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            🕒 Pending Review
                          </Badge>
                        )
                      )}
                      {story.relationship_status === 'married' && (
                        <Badge className="bg-gradient-to-r from-pink-500 to-purple-600">
                          💍 Married
                        </Badge>
                      )}
                      {story.relationship_status === 'engaged' && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-amber-600">
                          💎 Engaged
                        </Badge>
                      )}
                      {story.relationship_status === 'dating' && (
                        <Badge className="bg-purple-100 text-purple-700">
                          ❤️ Dating
                        </Badge>
                      )}
                      {story.is_featured && (
                        <Badge variant="outline" className="border-amber-300 text-amber-700">
                          ⭐ Featured
                        </Badge>
                      )}
                    </div>

                    <p className="text-gray-700 mb-4 leading-relaxed">
                      "{story.story_text}"
                    </p>

                    {story.match_date && (
                      <p className="text-sm text-gray-500 mb-3">
                        Matched on {format(new Date(story.match_date), 'MMMM yyyy')}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => likeMutation.mutate(story.id)}
                        className="gap-2 text-pink-600"
                      >
                        <ThumbsUp size={16} />
                        {story.likes_count || 0}
                      </Button>
                      <Heart size={20} className="text-pink-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {stories.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <Heart size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">No success stories yet</p>
          </div>
        )}
      </main>
    </div>
  );
}