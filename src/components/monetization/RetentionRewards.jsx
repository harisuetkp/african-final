import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';

export default function RetentionRewards({ userProfile }) {
  const [reward, setReward] = useState(null);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (!userProfile) return;

    const checkRewards = () => {
      const streak = userProfile.login_streak || 0;
      const lastRewardClaim = localStorage.getItem('last_reward_claim');
      const today = new Date().toISOString().split('T')[0];

      // Don't show if already claimed today
      if (lastRewardClaim === today) return;

      // Rewards based on streaks
      if (streak === 7) {
        setReward({
          title: '7-Day Streak! 🔥',
          description: '1 Free Super Like',
          type: 'super_like',
          value: 1
        });
      } else if (streak === 30) {
        setReward({
          title: '30-Day Streak! 🎉',
          description: '3 Free Profile Boosts',
          type: 'boost',
          value: 3
        });
      } else if (streak % 100 === 0 && streak > 0) {
        setReward({
          title: `${streak}-Day Streak! 🏆`,
          description: '1 Month Premium Free!',
          type: 'premium',
          value: 30
        });
      }
    };

    checkRewards();
  }, [userProfile]);

  const claimReward = async () => {
    if (!reward) return;

    try {
      if (reward.type === 'super_like') {
        // Add super likes (would need backend implementation)
        const currentSub = await base44.entities.Subscription.filter({
          user_profile_id: userProfile.id,
          status: 'active'
        });

        if (currentSub.length > 0) {
          await base44.entities.Subscription.update(currentSub[0].id, {
            super_likes_remaining: (currentSub[0].super_likes_remaining || 0) + reward.value
          });
        }
      } else if (reward.type === 'boost') {
        // Add boosts
        const currentSub = await base44.entities.Subscription.filter({
          user_profile_id: userProfile.id,
          status: 'active'
        });

        if (currentSub.length > 0) {
          await base44.entities.Subscription.update(currentSub[0].id, {
            boosts_remaining: (currentSub[0].boosts_remaining || 0) + reward.value
          });
        }
      } else if (reward.type === 'premium') {
        // Grant temporary premium via backend function
        try {
          await base44.functions.invoke('updateUserProfile', {
            subscription_tier: 'premium',
            is_premium: true,
            premium_until: new Date(Date.now() + reward.value * 24 * 60 * 60 * 1000).toISOString()
          });
        } catch (e) {
          console.error('Failed to grant premium reward:', e);
        }
      }

      // Confetti celebration
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });

      localStorage.setItem('last_reward_claim', new Date().toISOString().split('T')[0]);
      setClaimed(true);
      setTimeout(() => setReward(null), 3000);
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  if (!reward) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl"
        >
          {!claimed && (
            <button
              onClick={() => setReward(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X size={20} />
            </button>
          )}

          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            {claimed ? <Trophy size={48} className="text-white" /> : <Gift size={48} className="text-white" />}
          </div>

          <h2 className="text-3xl font-bold mb-2">{reward.title}</h2>
          <p className="text-xl text-gray-700 mb-6">{reward.description}</p>

          {!claimed ? (
            <>
              <Badge className="bg-purple-600 text-lg px-6 py-2 mb-6">
                Streak Reward
              </Badge>
              <Button
                onClick={claimReward}
                className="w-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white py-6 text-lg rounded-full shadow-lg"
              >
                Claim Reward
              </Button>
            </>
          ) : (
            <div>
              <Badge className="bg-green-600 text-lg px-6 py-2">
                ✓ Claimed!
              </Badge>
              <p className="text-sm text-gray-500 mt-4">Keep your streak going!</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}