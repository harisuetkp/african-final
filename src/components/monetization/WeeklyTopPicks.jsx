import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Star, Crown, Lock, ChevronRight, Sparkles } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WeeklyTopPicks({ userProfile }) {
  const [topPicks, setTopPicks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const tier = userProfile?.subscription_tier || 'free';
  const canSeeTopPicks = tier === 'elite' || tier === 'vip';

  useEffect(() => {
    if (!userProfile?.id) return;
    
    const fetchTopPicks = async () => {
      try {
        // Fetch top compatible profiles this week
        const response = await base44.functions.invoke('getDiscoveryProfiles', {
          filters: {},
          mode: 'global',
          myProfileId: userProfile.id,
          limit: 5
        });
        
        // Sort by match score and take top 5
        const profiles = (response.data?.profiles || [])
          .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
          .slice(0, 5);
        
        setTopPicks(profiles);
      } catch (e) {
        console.error('Failed to fetch top picks:', e);
      }
      setIsLoading(false);
    };
    
    fetchTopPicks();
  }, [userProfile?.id]);

  if (isLoading || topPicks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-amber-50 to-purple-50 border border-amber-200 rounded-xl p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-purple-500 rounded-full flex items-center justify-center">
            <Star size={16} className="text-white fill-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-1">
              Your Top Picks
              <Badge className="bg-amber-500 text-[10px]">Weekly</Badge>
            </h3>
            <p className="text-xs text-gray-500">Most compatible with you</p>
          </div>
        </div>
        
        {!canSeeTopPicks && (
          <Badge variant="outline" className="border-amber-300 text-amber-700">
            <Crown size={12} className="mr-1" />
            Elite
          </Badge>
        )}
      </div>

      {/* Profile previews */}
      <div className="flex gap-2 mb-3">
        {topPicks.slice(0, 5).map((profile, idx) => (
          <div key={profile.id} className="relative flex-1 aspect-square max-w-[60px]">
            <img
              src={profile.primary_photo || profile.photos?.[0]}
              alt=""
              className={`w-full h-full rounded-lg object-cover ${!canSeeTopPicks ? 'blur-lg' : ''}`}
            />
            {canSeeTopPicks && profile.matchScore && (
              <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {profile.matchScore}%
              </div>
            )}
            {!canSeeTopPicks && idx === 2 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock size={16} className="text-white drop-shadow-lg" />
              </div>
            )}
          </div>
        ))}
      </div>

      {canSeeTopPicks ? (
        <Link to={createPageUrl('DailyMatches')}>
          <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
            View All Picks
            <ChevronRight size={16} className="ml-auto" />
          </Button>
        </Link>
      ) : (
        <Link to={createPageUrl('PricingPlans')}>
          <Button className="w-full bg-gradient-to-r from-amber-500 to-purple-500 hover:from-amber-600 hover:to-purple-600">
            <Sparkles size={16} className="mr-2" />
            Unlock with Elite
          </Button>
        </Link>
      )}
    </motion.div>
  );
}