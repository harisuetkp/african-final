import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Heart, Crown, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import MatchCelebration from '@/components/match/MatchCelebration';
import BlurredLikesTeaser from '@/components/monetization/BlurredLikesTeaser';
import SocialProofPaywall from '@/components/monetization/SocialProofPaywall';

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, Sparkles } from 'lucide-react';

export default function WhoLikesYou() {
  const [myProfile, setMyProfile] = useState(null);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('likes');
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) {
          setMyProfile(profiles[0]);
        }
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      }
    };
    fetchProfile();
  }, []);

  const { data: likes = [], isLoading: isLoadingLikes } = useQuery({
    queryKey: ['who-likes-me', myProfile?.id],
    queryFn: async () => {
      // Only get likes that haven't been seen/matched yet
      const allLikes = await base44.entities.Like.filter({ 
        liked_id: myProfile.id, 
        is_seen: false 
      }, '-created_date', 100);
      
      // Sort by priority first (Elite/VIP likes shown first), then by date
      const sortedLikes = allLikes.sort((a, b) => {
        // Priority likes come first
        if (a.is_priority && !b.is_priority) return -1;
        if (!a.is_priority && b.is_priority) return 1;
        // Super likes come second
        if (a.is_super_like && !b.is_super_like) return -1;
        if (!a.is_super_like && b.is_super_like) return 1;
        // Then by date
        return new Date(b.created_date) - new Date(a.created_date);
      });
      
      // Get profiles of people who liked me
      const profileIds = sortedLikes.map(like => like.liker_id);
      const profiles = await Promise.all(
        profileIds.map(id => base44.entities.UserProfile.filter({ id }).then(p => p[0]))
      );

      return sortedLikes.map((like, idx) => ({
        ...like,
        profile: profiles[idx]
      })).filter(like => like.profile);
    },
    enabled: !!myProfile,
    staleTime: 60000, // Optimize: Keep data fresh for 1 minute
    refetchOnWindowFocus: true
  });

  const { data: views = [], isLoading: isLoadingViews } = useQuery({
    queryKey: ['who-viewed-me', myProfile?.id],
    queryFn: async () => {
      const allViews = await base44.entities.ProfileView.filter({ 
        viewed_profile_id: myProfile.id
      }, '-created_date', 50);
      
      // Get profiles of people who viewed me (deduplicated)
      const uniqueViewerIds = [...new Set(allViews.map(view => view.viewer_profile_id))];
      const profiles = await Promise.all(
        uniqueViewerIds.map(id => base44.entities.UserProfile.filter({ id }).then(p => p[0]))
      );

      return profiles.filter(p => p && p.id !== myProfile.id);
    },
    enabled: !!myProfile,
    staleTime: 60000, // Optimize: Keep data fresh for 1 minute
    refetchOnWindowFocus: true
  });

  const likeMutation = useMutation({
    mutationFn: async (likerId) => {
      // Create like back
      await base44.entities.Like.create({
        liker_id: myProfile.id,
        liked_id: likerId,
        is_super_like: false,
        is_seen: false
      });

      // Check for match
      const mutualLikes = await base44.entities.Like.filter({
        liker_id: likerId,
        liked_id: myProfile.id
      });

      if (mutualLikes.length > 0) {
        // Create match
        await base44.entities.Match.create({
          user1_id: myProfile.id,
          user2_id: likerId,
          user1_liked: true,
          user2_liked: true,
          is_match: true,
          matched_at: new Date().toISOString(),
          status: 'active'
        });

        // Mark both likes as seen (matched)
        await base44.entities.Like.update(mutualLikes[0].id, { is_seen: true });
        const myLikeToThem = await base44.entities.Like.filter({
          liker_id: myProfile.id,
          liked_id: likerId
        });
        if (myLikeToThem.length > 0) {
          await base44.entities.Like.update(myLikeToThem[0].id, { is_seen: true });
        }

        const likerProfiles = await base44.entities.UserProfile.filter({ id: likerId });
        if (likerProfiles.length > 0) {
          await base44.entities.Notification.create({
            user_profile_id: likerId,
            type: 'match',
            title: "It's a Match! 💕",
            message: `You and ${myProfile.display_name} liked each other!`,
            from_profile_id: myProfile.id,
            link_to: createPageUrl('Matches')
          });
        }
        
        // Update first match tracking
        if (!myProfile.has_matched_before) {
          await base44.entities.UserProfile.update(myProfile.id, {
            has_matched_before: true
          });
        }
        
        return { isMatch: true, matchedProfile: likerProfiles[0] };
      }
      
      return { isMatch: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['who-likes-me']);
      
      if (result?.isMatch) {
        // Show match celebration
        setMatchedProfile(result.matchedProfile);
        
        // Redirect after celebration
        setTimeout(() => {
          window.location.href = createPageUrl('Matches');
        }, 3000);
      }
    }
  });

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const showBlurred = !myProfile?.is_premium && !['premium', 'elite', 'vip'].includes(myProfile?.subscription_tier);

  return (
    <>
      <MatchCelebration 
        matchedProfile={matchedProfile} 
        onClose={() => setMatchedProfile(null)} 
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-amber-50/20 pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
            {myProfile?.subscription_tier && myProfile.subscription_tier !== 'free' ? (
              <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                <Crown size={14} className="mr-1" />
                Premium
              </Badge>
            ) : (
              <Link to={createPageUrl('PricingPlans')}>
                <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                  <Crown size={16} className="mr-2" />
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="likes" className="text-lg">
              <Heart size={18} className="mr-2" />
              Likes You
              {likes.length > 0 && showBlurred && (
                <Badge className="ml-2 bg-pink-500">{likes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="views" className="text-lg">
              <Eye size={18} className="mr-2" />
              Viewed You
              {views.length > 0 && showBlurred && (
                <Badge className="ml-2 bg-purple-500">{views.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="likes">
            {isLoadingLikes ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
              </div>
            ) : likes.length === 0 ? (
              <div className="text-center py-20">
                <Heart size={64} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No likes yet</p>
                <p className="text-sm text-gray-500 mt-2">Keep swiping to find your match!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {likes.map(({ profile, is_super_like }) => {
                  const age = calculateAge(profile.birth_date);

                  return (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow relative">
                        <div className="relative">
                          <img
                            src={profile.primary_photo || profile.photos?.[0]}
                            alt={profile.display_name}
                            className={`w-full h-64 object-cover ${showBlurred ? 'blur-2xl' : ''}`}
                          />
                          {is_super_like && !showBlurred && (
                            <Badge className="absolute top-3 right-3 bg-blue-600">
                              ⭐ Super Like
                            </Badge>
                          )}
                          {profile.is_priority && !showBlurred && (
                            <Badge className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-amber-500">
                              👑 Priority
                            </Badge>
                          )}
                          {showBlurred && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <div className="text-center">
                                <Lock size={48} className="text-white mx-auto mb-2" />
                                <p className="text-white font-semibold">Upgrade to See</p>
                                {is_super_like && (
                                  <div className="mt-2 bg-blue-500/80 px-3 py-1 rounded-full text-xs text-white flex items-center gap-1 justify-center">
                                    <Sparkles size={12} />
                                    Super Like!
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          {showBlurred ? (
                            <>
                              <div className="h-6 bg-gray-200 rounded mb-2 blur-sm"></div>
                              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3 blur-sm"></div>
                              <SocialProofPaywall className="mb-3" />
                              <Link to={createPageUrl('PricingPlans')}>
                                <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                                  <Crown size={18} className="mr-2" />
                                  See Who Likes You
                                </Button>
                              </Link>
                            </>
                          ) : (
                            <>
                              <h3 className="text-lg font-bold text-gray-900">
                                {profile.display_name}{age && `, ${age}`}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {profile.current_city}, {profile.current_country}
                              </p>
                              {profile.bio && (
                                <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                                  {profile.bio}
                                </p>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    likeMutation.mutate(profile.id);
                                  }}
                                  disabled={likeMutation.isPending}
                                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                                >
                                  <Heart size={18} className="mr-2" />
                                  {likeMutation.isPending ? 'Liking...' : 'Like Back'}
                                </Button>
                                <Link to={createPageUrl(`Profile?id=${profile.id}`)} className="flex-1">
                                  <Button variant="outline" className="w-full">
                                    View Profile
                                  </Button>
                                </Link>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="views">
            {isLoadingViews ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
              </div>
            ) : views.length === 0 ? (
              <div className="text-center py-20">
                <Eye size={64} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No profile views yet</p>
                <p className="text-sm text-gray-500 mt-2">Optimize your profile to get more attention!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {views.map((profile) => {
                  const age = calculateAge(profile.birth_date);

                  return (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow relative">
                        <div className="relative">
                          <img
                            src={profile.primary_photo || profile.photos?.[0]}
                            alt={profile.display_name}
                            className={`w-full h-64 object-cover ${showBlurred ? 'blur-2xl' : ''}`}
                          />
                          {showBlurred && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <div className="text-center">
                                <Lock size={48} className="text-white mx-auto mb-2" />
                                <p className="text-white font-semibold">Upgrade to See</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          {showBlurred ? (
                            <>
                              <div className="h-6 bg-gray-200 rounded mb-2 blur-sm"></div>
                              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4 blur-sm"></div>
                              <Link to={createPageUrl('PricingPlans')}>
                                <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                                  <Crown size={18} className="mr-2" />
                                  Upgrade to See Who Viewed You
                                </Button>
                              </Link>
                            </>
                          ) : (
                            <>
                              <h3 className="text-lg font-bold text-gray-900">
                                {profile.display_name}{age && `, ${age}`}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {profile.current_city}, {profile.current_country}
                              </p>
                              <div className="flex gap-2">
                                <Link to={createPageUrl(`Profile?id=${profile.id}`)} className="flex-1">
                                  <Button variant="outline" className="w-full">
                                    View Profile
                                  </Button>
                                </Link>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </>
  );
}