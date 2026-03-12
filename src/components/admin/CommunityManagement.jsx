import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Star, Trash2 } from 'lucide-react';

export default function CommunityManagement() {
  const queryClient = useQueryClient();

  const { data: communities = [] } = useQuery({
    queryKey: ['admin-communities'],
    queryFn: () => base44.entities.Community.list('-created_date', 100)
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeatured }) =>
      base44.entities.Community.update(id, { is_featured: !isFeatured }),
    onSuccess: () => queryClient.invalidateQueries(['admin-communities'])
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Community.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['admin-communities'])
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Communities ({communities.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {communities.map(community => (
            <div key={community.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{community.icon}</span>
                  <div>
                    <h3 className="font-semibold">{community.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {community.category}
                    </Badge>
                  </div>
                </div>
                {community.is_featured && (
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">{community.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Users size={14} />
                  {community.members?.length || 0} members
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      toggleFeaturedMutation.mutate({
                        id: community.id,
                        isFeatured: community.is_featured
                      })
                    }
                    variant="outline"
                    size="sm"
                  >
                    {community.is_featured ? 'Unfeature' : 'Feature'}
                  </Button>
                  <Button
                    onClick={() => deleteMutation.mutate(community.id)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}