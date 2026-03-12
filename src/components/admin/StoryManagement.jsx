import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function StoryManagement() {
  const queryClient = useQueryClient();

  const { data: stories = [] } = useQuery({
    queryKey: ['admin-stories'],
    queryFn: async () => {
      const allStories = await base44.entities.Story.list('-created_date', 200);
      const profileIds = [...new Set(allStories.map(s => s.user_profile_id))];
      const profiles = await Promise.all(
        profileIds.map(id => base44.entities.UserProfile.filter({ id }))
      );
      return allStories.map(story => ({
        ...story,
        user_profile: profiles.find(p => p[0]?.id === story.user_profile_id)?.[0]
      }));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (storyId) => base44.entities.Story.delete(storyId),
    onSuccess: () => queryClient.invalidateQueries(['admin-stories'])
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Story Management ({stories.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stories.map(story => (
            <div key={story.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <img
                src={story.media_type === 'photo' ? story.media_url : story.user_profile?.primary_photo}
                alt="Story"
                className="w-16 h-16 rounded object-cover"
              />
              <div className="flex-1">
                <p className="font-medium">{story.user_profile?.display_name}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(story.created_date), 'PPp')}
                </p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary">{story.media_type}</Badge>
                  <Badge variant="outline">
                    <Eye size={12} className="mr-1" />
                    {story.views?.length || 0}
                  </Badge>
                  {story.is_expired && <Badge variant="destructive">Expired</Badge>}
                </div>
              </div>
              <Button
                onClick={() => deleteMutation.mutate(story.id)}
                variant="destructive"
                size="sm"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}