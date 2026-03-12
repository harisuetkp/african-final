import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Crown, Plus, Loader2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useTierConfig, getTierLimit, isUnlimited } from '@/components/shared/useTierConfig';

export default function SuperLikeCounter({ userProfile, onBuyMore }) {
  const [superLikesRemaining, setSuperLikesRemaining] = useState(null);
  const [superLikesMax, setSuperLikesMax] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const { tiers: tierConfig } = useTierConfig();

  useEffect(() => {
    if (!userProfile?.id) return;
    
    const fetchSuperLikeCounts = async () => {
      try {
        const tier = userProfile.subscription_tier || 'free';
        const dailySuperLikes = getTierLimit(tierConfig, tier, 'daily_super_likes');
        
        // Set max based on tier
        if (isUnlimited(dailySuperLikes)) {
          setSuperLikesMax(999);
          setSuperLikesRemaining(999);
          setIsLoading(false);
          return;
        }

        // Free: 1/week, Premium: 5/day
        if (tier === 'free') {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const superLikesThisWeek = await base44.entities.Like.filter({
            liker_id: userProfile.id,
            is_super_like: true,
            created_date: { $gte: weekAgo }
          });
          setSuperLikesMax(1);
          setSuperLikesRemaining(Math.max(0, 1 - superLikesThisWeek.length));
        } else {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const startOfDay = now.toISOString();
          
          const superLikesToday = await base44.entities.Like.filter({
            liker_id: userProfile.id,
            is_super_like: true,
            created_date: { $gte: startOfDay }
          });
          
          const limit = dailySuperLikes || 5;
          setSuperLikesMax(limit);
          setSuperLikesRemaining(Math.max(0, limit - superLikesToday.length));
        }
      } catch (e) {
        console.error('Failed to fetch super like count:', e);
      }
      setIsLoading(false);
    };
    
    fetchSuperLikeCounts();
  }, [userProfile?.id, userProfile?.subscription_tier, tierConfig]);

  const tier = userProfile?.subscription_tier || 'free';
  const isUnlimitedTier = tier === 'elite' || tier === 'vip';

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 bg-blue-50 rounded-full px-3 py-1.5">
        <Loader2 size={14} className="animate-spin text-blue-500" />
      </div>
    );
  }

  // Don't show for unlimited users
  if (isUnlimitedTier) {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full px-3 py-1.5 text-white">
        <Star size={14} className="fill-yellow-300 text-yellow-300" />
        <span className="text-xs font-bold">∞ Super Likes</span>
      </div>
    );
  }

  return (
    <>
      <motion.button
        onClick={() => superLikesRemaining === 0 && setShowBuyModal(true)}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all ${
          superLikesRemaining === 0 
            ? 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 cursor-pointer'
            : 'bg-blue-50 text-blue-700'
        }`}
      >
        <Star size={14} className={superLikesRemaining > 0 ? 'fill-blue-500 text-blue-500' : 'fill-gray-400 text-gray-400'} />
        <span className="text-xs font-bold">
          {superLikesRemaining}/{superLikesMax} {tier === 'free' ? 'this week' : 'today'}
        </span>
        {superLikesRemaining === 0 && (
          <Plus size={12} className="text-amber-700" />
        )}
      </motion.button>

      {/* Buy More Modal */}
      <AnimatePresence>
        {showBuyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowBuyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star size={32} className="text-yellow-300 fill-yellow-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Out of Super Likes!</h3>
                <p className="text-gray-600 mt-2">Stand out to that special someone</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-blue-500">⭐</span>
                  <span>3x more likely to get matched</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-blue-500">⭐</span>
                  <span>They'll know you're really interested</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-blue-500">⭐</span>
                  <span>Your profile appears first in their feed</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Star size={18} className="mr-2 fill-yellow-300 text-yellow-300" />
                  Get 3 Super Likes - $4.99
                </Button>
                
                <Link to={createPageUrl('PricingPlans')}>
                  <Button variant="outline" className="w-full h-12">
                    <Crown size={18} className="mr-2 text-amber-500" />
                    {tier === 'free' ? 'Get 5/day with Premium' : 'Unlimited with Elite'}
                  </Button>
                </Link>

                <button 
                  onClick={() => setShowBuyModal(false)}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}