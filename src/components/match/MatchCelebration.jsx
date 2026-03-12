import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MatchCelebration({ matchedProfile, onClose }) {
  useEffect(() => {
    if (matchedProfile) {
      // Trigger confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      
      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ec4899', '#a855f7', '#f59e0b']
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ec4899', '#a855f7', '#f59e0b']
        });
      }, 30);

      return () => clearInterval(interval);
    }
  }, [matchedProfile]);

  if (!matchedProfile) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="bg-gradient-to-br from-pink-500 via-purple-600 to-amber-600 rounded-3xl p-8 max-w-md mx-4 text-center relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated background effects */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-white/10 rounded-full blur-3xl"
          />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Heart size={64} className="mx-auto text-white mb-4 fill-white" />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-white mb-2"
          >
            It's a Match! 💕
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/90 text-lg mb-6"
          >
            You and {matchedProfile.display_name} liked each other!
          </motion.p>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="flex justify-center gap-4 mb-6"
          >
            <img
              src={matchedProfile.primary_photo || matchedProfile.photos?.[0]}
              alt={matchedProfile.display_name}
              className="w-24 h-24 rounded-full border-4 border-white object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-2 text-white/80 text-sm"
          >
            <Sparkles size={16} />
            <span>Redirecting to your matches...</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}