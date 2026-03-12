import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Eye, Heart, Crown, Lock, Sparkles } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ActivitySummaryBanner({ userProfile }) {
  const [stats, setStats] = useState({ views: 0, likes: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.id) return;
    
    const fetchStats = async () => {
      try {
        // Get views today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const [views, likes] = await Promise.all([
          base44.entities.ProfileView.filter({
            viewed_profile_id: userProfile.id,
            created_date: { $gte: today.toISOString() }
          }),
          base44.entities.Like.filter({
            liked_id: userProfile.id,
            is_seen: false
          })
        ]);
        
        setStats({
          views: views.length,
          likes: likes.length
        });
      } catch (e) {
        console.error('Failed to fetch activity:', e);
      }
      setIsLoading(false);
    };
    
    fetchStats();
  }, [userProfile?.id]);

  const isPremium = userProfile?.subscription_tier && userProfile.subscription_tier !== 'free';
  const hasActivity = stats.views > 0 || stats.likes > 0;

  if (isLoading || !hasActivity) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-3 mb-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {stats.views > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Eye size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Profile views today</p>
                <p className="font-bold text-purple-700">{stats.views}</p>
              </div>
            </div>
          )}
          
          {stats.likes > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                <Heart size={16} className="text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">People like you</p>
                <div className="flex items-center gap-1">
                  <p className="font-bold text-pink-700">{stats.likes}</p>
                  {!isPremium && <Lock size={12} className="text-gray-400" />}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {!isPremium && (
          <Link to={createPageUrl('WhoLikesYou')}>
            <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs">
              <Sparkles size={14} className="mr-1" />
              See who
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}