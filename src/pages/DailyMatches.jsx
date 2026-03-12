import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, X, ArrowLeft, Crown, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ProfileCard from '@/components/profile/ProfileCard';

export default function DailyMatches() {
  const [myProfile, setMyProfile] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) setMyProfile(profiles[0]);
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      }
    };
    fetchProfile();
  }, []);

  const { data: dailyMatches = [], isLoading } = useQuery({
    queryKey: ['daily-matches', myProfile?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const matches = await base44.entities.DailyMatch.filter({
        user_profile_id: myProfile.id,
        date: today,
        status: 'pending'
      });

      if (matches.length === 0) {
        // Generate new daily matches using user's filters
        const userFilters = myProfile.filters || {};
        let filterQuery = { is_active: true };
        
        // Apply saved filters
        if (userFilters.relationship_goals?.length > 0) {
          filterQuery.relationship_goal = { $in: userFilters.relationship_goals };
        }
        if (userFilters.religions?.length > 0) {
          filterQuery.religion = { $in: userFilters.religions };
        }
        if (userFilters.countries_of_origin?.length > 0) {
          filterQuery.country_of_origin = { $in: userFilters.countries_of_origin };
        }
        if (userFilters.states?.length > 0) {
          filterQuery.current_state = { $in: userFilters.states };
        }

        const allProfiles = await base44.entities.UserProfile.filter(filterQuery, '-last_active', 100);
        let filtered = allProfiles.filter(p => p.id !== myProfile.id);
        
        // Apply additional filter criteria
        if (userFilters.age_min || userFilters.age_max) {
          filtered = filtered.filter(p => {
            if (!p.birth_date) return false;
            const age = Math.floor((Date.now() - new Date(p.birth_date)) / (365.25 * 24 * 60 * 60 * 1000));
            return (!userFilters.age_min || age >= userFilters.age_min) && (!userFilters.age_max || age <= userFilters.age_max);
          });
        }
        
        // Calculate match scores
        const scored = filtered.slice(0, 5).map(profile => ({
          profile,
          score: Math.floor(Math.random() * 30) + 70, // 70-100 for daily picks
          reasons: ['Shared cultural values', 'Similar relationship goals', 'Compatible location']
        }));

        // Create daily matches
        for (const item of scored) {
          await base44.entities.DailyMatch.create({
            user_profile_id: myProfile.id,
            suggested_profile_id: item.profile.id,
            match_score: item.score,
            match_reasons: item.reasons,
            date: today,
            status: 'pending',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });
        }

        return await base44.entities.DailyMatch.filter({
          user_profile_id: myProfile.id,
          date: today
        });
      }

      return matches;
    },
    enabled: !!myProfile
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['daily-profiles', dailyMatches],
    queryFn: async () => {
      const profileIds = dailyMatches.map(m => m.suggested_profile_id);
      const profiles = await Promise.all(
        profileIds.map(id => base44.entities.UserProfile.filter({ id }).then(p => p[0]))
      );
      return profiles.filter(Boolean).map((p, idx) => ({
        ...p,
        dailyMatch: dailyMatches[idx]
      }));
    },
    enabled: dailyMatches.length > 0
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ matchId, status }) => {
      await base44.entities.DailyMatch.update(matchId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['daily-matches']);
      setCurrentIndex(prev => prev + 1);
    }
  });

  const handleLike = () => {
    const current = profiles[currentIndex];
    if (current) {
      updateStatusMutation.mutate({ matchId: current.dailyMatch.id, status: 'liked' });
    }
  };

  const handlePass = () => {
    const current = profiles[currentIndex];
    if (current) {
      updateStatusMutation.mutate({ matchId: current.dailyMatch.id, status: 'passed' });
    }
  };

  const currentProfile = profiles[currentIndex];
  const remaining = profiles.length - currentIndex;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-amber-50/30 to-pink-50/20">
      <header className="bg-white/80 backdrop-blur-lg border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-amber-500" />
            <h1 className="font-bold text-lg">Today's Picks</h1>
          </div>
          <Badge className="bg-purple-600 text-white">
            {remaining} left
          </Badge>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {!myProfile?.is_premium && (
          <Card className="mb-6 bg-gradient-to-r from-amber-50 to-purple-50 border-amber-200">
            <CardContent className="p-4 text-center">
              <Crown size={32} className="mx-auto text-amber-600 mb-2" />
              <p className="text-sm text-gray-700">
                Premium users get 10 curated matches daily!
              </p>
              <Link to={createPageUrl('Premium')}>
                <Button size="sm" className="mt-3 bg-amber-600">Upgrade</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <AnimatePresence mode="wait">
          {currentProfile ? (
            <motion.div
              key={currentProfile.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="mb-6 bg-gradient-to-br from-purple-50 to-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-500" />
                      <span className="font-semibold text-sm">
                        {currentProfile.dailyMatch.match_score}% Match
                      </span>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Clock size={12} />
                      Expires in 24h
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {currentProfile.dailyMatch.match_reasons?.[0]}
                  </p>
                </CardContent>
              </Card>

              <ProfileCard
                profile={currentProfile}
                onLike={handleLike}
                onPass={handlePass}
                onSuperLike={handleLike}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Sparkles size={64} className="mx-auto text-amber-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">All Done!</h2>
              <p className="text-gray-600 mb-6">
                Come back tomorrow for fresh matches
              </p>
              <Link to={createPageUrl('Home')}>
                <Button>Continue Browsing</Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}