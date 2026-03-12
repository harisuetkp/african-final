import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Heart, Sparkles, Star, Crown, PartyPopper } from 'lucide-react';
import { Button } from "@/components/ui/button";
import confetti from 'canvas-confetti';

const MILESTONES = [
  { count: 1, title: "First Match!", emoji: "🎉", message: "You got your first match! The journey begins..." },
  { count: 5, title: "Rising Star", emoji: "⭐", message: "5 matches! You're getting popular!" },
  { count: 10, title: "Double Digits", emoji: "🔟", message: "10 matches! You're on fire!" },
  { count: 25, title: "Quarter Century", emoji: "🏆", message: "25 matches! You're a natural!" },
  { count: 50, title: "Half Century", emoji: "💎", message: "50 matches! Legendary status!" },
  { count: 100, title: "Century Club", emoji: "👑", message: "100 matches! You're unstoppable!" }
];

export default function MatchMilestones({ userProfile, newMatchCount }) {
  const [celebration, setCelebration] = useState(null);
  const [previousCount, setPreviousCount] = useState(null);

  useEffect(() => {
    if (!userProfile || newMatchCount === undefined) return;
    
    const totalMatches = userProfile.total_matches_count || 0;
    
    // Check if we crossed a milestone
    if (previousCount !== null && newMatchCount > previousCount) {
      const currentTotal = totalMatches;
      
      for (const milestone of MILESTONES) {
        // Check if this action crossed the milestone threshold
        if (currentTotal >= milestone.count && (currentTotal - 1) < milestone.count) {
          setCelebration(milestone);
          
          // Confetti!
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 }
          });
          
          // Update user's total match count
          base44.entities.UserProfile.update(userProfile.id, {
            total_matches_count: currentTotal
          }).catch(() => {});
          
          break;
        }
      }
    }
    
    setPreviousCount(newMatchCount);
  }, [newMatchCount, userProfile, previousCount]);

  const dismissCelebration = () => {
    setCelebration(null);
  };

  return (
    <AnimatePresence>
      {celebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={dismissCelebration}
        >
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            onClick={e => e.stopPropagation()}
            className="bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 rounded-3xl p-8 mx-4 text-center shadow-2xl max-w-sm relative overflow-hidden"
          >
            {/* Background sparkles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
            
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-7xl mb-4"
            >
              {celebration.emoji}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="text-yellow-300" size={24} />
                <h2 className="text-3xl font-bold text-white">{celebration.title}</h2>
                <Trophy className="text-yellow-300" size={24} />
              </div>
              
              <p className="text-white/90 mb-6 text-lg">{celebration.message}</p>
              
              <div className="bg-white/20 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-2">
                  <Heart className="text-pink-300 fill-pink-300" size={20} />
                  <span className="text-2xl font-bold text-white">{celebration.count}</span>
                  <span className="text-white/80">Total Matches</span>
                </div>
              </div>
              
              <Button
                onClick={dismissCelebration}
                className="w-full bg-white text-purple-600 hover:bg-gray-100 font-bold py-3"
              >
                <PartyPopper size={18} className="mr-2" />
                Keep Going!
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Export a hook to track matches
export function useMatchMilestones(userProfile) {
  const [matchCount, setMatchCount] = useState(0);

  const recordMatch = () => {
    setMatchCount(prev => prev + 1);
  };

  return { matchCount, recordMatch, MilestoneComponent: (
    <MatchMilestones userProfile={userProfile} newMatchCount={matchCount} />
  )};
}