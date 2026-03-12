import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Check, X, Star } from 'lucide-react';

export default function SuccessStoryModeration() {
  const queryClient = useQueryClient();

  const { data: stories = [] } = useQuery({
    queryKey: ['admin-success-stories'],
    queryFn: () => base44.entities.SuccessStory.filter({ is_approved: false }, '-created_date', 100)
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ storyId, approved, featured = false }) => {
      await base44.entities.SuccessStory.update(storyId, { 
        is_approved: approved,
        is_featured: featured
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['admin-success-stories'])
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart size={20} className="text-pink-600" />
          Success Story Moderation ({stories.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stories.map(story => (
            <div key={story.id} className="p-4 border rounded-lg">
              {story.couple_photo_url && (
                <img 
                  src={story.couple_photo_url} 
                  className="w-full h-48 object-cover rounded mb-3"
                  alt="Couple"
                />
              )}
              <p className="text-sm mb-3">{story.story_text}</p>
              <Badge>{story.relationship_status}</Badge>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600"
                  onClick={() => moderateMutation.mutate({ storyId: story.id, approved: true })}
                >
                  <Check size={16} className="mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-amber-600"
                  onClick={() => moderateMutation.mutate({ storyId: story.id, approved: true, featured: true })}
                >
                  <Star size={16} className="mr-1" />
                  Feature
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                  onClick={() => moderateMutation.mutate({ storyId: story.id, approved: false })}
                >
                  <X size={16} className="mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
          {stories.length === 0 && (
            <p className="text-center text-gray-500 py-8">No pending success stories</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}