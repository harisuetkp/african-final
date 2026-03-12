import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInfinitePagination } from '@/components/shared/useInfinitePagination';
import PullToRefresh from '@/components/shared/PullToRefresh';
import { ArrowLeft, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { ListItemSkeleton } from '@/components/shared/SkeletonLoader';
import EmptyState from '@/components/shared/EmptyState';

export default function Communities() {
  const [myProfile, setMyProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) setMyProfile(profiles[0]);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const { 
    items: communities, 
    loadMore, 
    hasMore, 
    isLoadingMore,
    refetch 
  } = useInfinitePagination('Community', {}, {
    pageSize: 20,
    sortBy: '-created_date',
    enabled: !!myProfile,
    refetchInterval: 180000,
    retry: 1,
    retryDelay: 5000
  });

  const joinMutation = useMutation({
    mutationFn: async (communityId) => {
      const community = communities.find(c => c.id === communityId);
      await base44.entities.Community.update(communityId, {
        members: [...(community.members || []), myProfile.id]
      });
      
      await base44.entities.UserProfile.update(myProfile.id, {
        communities: [...(myProfile.communities || []), communityId]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communities']);
      queryClient.invalidateQueries(['profile']);
    }
  });

  const leaveMutation = useMutation({
    mutationFn: async (communityId) => {
      const community = communities.find(c => c.id === communityId);
      await base44.entities.Community.update(communityId, {
        members: (community.members || []).filter(id => id !== myProfile.id)
      });
      
      await base44.entities.UserProfile.update(myProfile.id, {
        communities: (myProfile.communities || []).filter(id => id !== communityId)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['communities']);
      queryClient.invalidateQueries(['profile']);
    }
  });

  const myCommunities = communities.filter(c => c.members?.includes(myProfile?.id));
  
  const suggestedCommunities = communities.filter(c => {
    const notMember = !c.members?.includes(myProfile?.id);
    const matchesSearch = !searchQuery || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return notMember && matchesSearch;
  });

  const CommunityCard = ({ community }) => {
    const isMember = community.members?.includes(myProfile?.id);
    
    return (
      <Card className="hover:shadow-lg transition">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{community.icon}</div>
              <div>
                <CardTitle className="text-lg">{community.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {community.category}
                  </Badge>
                  {community.is_featured && (
                    <Badge className="bg-amber-500 text-white text-xs">
                      <TrendingUp size={10} className="mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">{community.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Users size={14} />
              <span>{community.members?.length || 0} members</span>
            </div>
            <div className="flex gap-2">
              {isMember ? (
                <>
                  <Link to={createPageUrl(`CommunityChat?id=${community.id}`)} className="flex-1">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700" size="sm">
                      💬 Open Chat
                    </Button>
                  </Link>
                  <Button
                    onClick={() => leaveMutation.mutate(community.id)}
                    variant="outline"
                    size="sm"
                  >
                    Leave
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => joinMutation.mutate(community.id)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  Join Community
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <PullToRefresh onRefresh={refetch}>
      <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Communities</h1>
              <p className="text-sm text-gray-500">Connect with like-minded people</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!myProfile ? (
          <ListItemSkeleton count={6} />
        ) : (
        <Tabs defaultValue="discover">
          <TabsList className="mb-6">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="my-communities">My Communities ({myCommunities.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="discover">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input 
                placeholder="Search communities..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {suggestedCommunities.length === 0 ? (
              <EmptyState
                icon={Users}
                title={searchQuery ? "No communities found" : "No communities available"}
                description={searchQuery ? `We couldn't find any communities matching "${searchQuery}"` : "There are no communities to join right now. Check back later!"}
                actionLabel={searchQuery ? "Clear Search" : "Refresh"}
                onAction={searchQuery ? () => setSearchQuery('') : refetch}
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedCommunities.map(community => (
                  <CommunityCard key={community.id} community={community} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-communities">
            {myCommunities.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No communities yet"
                description="Join communities to connect with like-minded people"
                actionLabel="Discover Communities"
                onAction={() => document.querySelector('[value="discover"]').click()}
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myCommunities.map(community => (
                  <CommunityCard key={community.id} community={community} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        )}

        {isLoadingMore && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent" />
          </div>
        )}

        {hasMore && !isLoadingMore && (
          <div className="text-center py-4">
            <Button onClick={loadMore} variant="outline">
              Load More Communities
            </Button>
          </div>
        )}
      </main>
    </div>
    </PullToRefresh>
  );
}