import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, Sparkles, Gift } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { differenceInDays } from 'date-fns';

export default function FoundingMemberBanner({ profile, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!profile?.is_founding_member) return;

    // Check if already dismissed today
    const lastDismissed = localStorage.getItem('founding_banner_dismissed');
    const today = new Date().toDateString();
    
    if (lastDismissed === today) {
      setDismissed(true);
      return;
    }

    // Show banner after 2 seconds
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [profile]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('founding_banner_dismissed', new Date().toDateString());
    onDismiss?.();
  };

  if (!profile?.is_founding_member || dismissed || !visible) return null;

  const trialEndsAt = profile.founding_member_trial_ends_at 
    ? new Date(profile.founding_member_trial_ends_at) 
    : null;
  const daysRemaining = trialEndsAt ? differenceInDays(trialEndsAt, new Date()) : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-16 left-4 right-4 z-40 max-w-lg mx-auto"
      >
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-2xl shadow-xl p-4 border-2 border-amber-300">
          <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition"
          >
            <X size={16} className="text-white" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Crown size={28} className="text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-lg">You're a Founding Member!</h3>
                <Sparkles size={16} className="text-white" />
              </div>
              <p className="text-white/90 text-sm">
                <Gift size={14} className="inline mr-1" />
                Enjoy <strong>FREE Premium</strong> for {daysRemaining} more days!
              </p>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
            <p className="text-white/80 text-xs">
              ✨ Unlimited likes • See who likes you • Super likes & more!
            </p>
            <Button 
              onClick={handleDismiss}
              size="sm" 
              className="bg-white text-amber-600 hover:bg-white/90 text-xs h-7"
            >
              Got it!
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}