import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Zap, Eye, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useConversionTracker, CONVERSION_EVENTS } from '@/components/shared/ConversionTracker';

export function useUpgradePrompts(userProfile) {
  const [prompt, setPrompt] = useState(null);
  const { trackEvent } = useConversionTracker();

  useEffect(() => {
    if (!userProfile || userProfile.subscription_tier !== 'free') return;

    const triggers = {
      // After 5 likes sent
      likes_limit: () => {
        const likesUsed = userProfile.daily_likes_count || 0;
        if (likesUsed >= 8) {
          return {
            icon: Crown,
            title: 'Running low on likes!',
            description: 'Get unlimited likes with Premium',
            feature: 'unlimited_likes'
          };
        }
      },
      
      // After viewing Who Likes You
      who_likes_you: () => {
        const hasVisitedWhoLikes = localStorage.getItem('visited_who_likes');
        if (hasVisitedWhoLikes && !localStorage.getItem('upgrade_prompt_shown_who_likes')) {
          localStorage.setItem('upgrade_prompt_shown_who_likes', 'true');
          return {
            icon: Eye,
            title: 'See who likes you!',
            description: 'Upgrade to see everyone who swiped right on you',
            feature: 'see_likes'
          };
        }
      },
      
      // After 3 matches with message limit
      message_limit: () => {
        // Check if user hit 3-message limit
        const hasHitLimit = localStorage.getItem('message_limit_hit');
        if (hasHitLimit && !localStorage.getItem('upgrade_prompt_shown_messages')) {
          localStorage.setItem('upgrade_prompt_shown_messages', 'true');
          return {
            icon: MessageCircle,
            title: 'Keep the conversation going!',
            description: 'Get unlimited messaging with Premium',
            feature: 'unlimited_messages'
          };
        }
      }
    };

    // Check triggers in priority order
    for (const [key, trigger] of Object.entries(triggers)) {
      const result = trigger();
      if (result) {
        setPrompt(result);
        trackEvent('upgrade_prompt_shown', { trigger: key });
        break;
      }
    }
  }, [userProfile, trackEvent]);

  const dismissPrompt = () => {
    trackEvent('upgrade_prompt_dismissed', { feature: prompt?.feature });
    setPrompt(null);
  };

  return { prompt, dismissPrompt };
}

export function UpgradePromptBanner({ prompt, onDismiss }) {
  const { trackEvent } = useConversionTracker();

  if (!prompt) return null;

  const Icon = prompt.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-40"
      >
        <div className="bg-gradient-to-br from-purple-600 to-amber-600 rounded-2xl p-5 shadow-2xl text-white relative">
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Icon size={24} />
            </div>
            <div>
              <h4 className="font-bold text-lg">{prompt.title}</h4>
              <p className="text-sm text-white/90">{prompt.description}</p>
            </div>
          </div>

          <Link to={createPageUrl('PricingPlans')}>
            <Button 
              className="w-full bg-white text-purple-600 hover:bg-gray-100"
              onClick={() => trackEvent(CONVERSION_EVENTS.PREMIUM_CLICK, { source: 'upgrade_prompt', feature: prompt.feature })}
            >
              <Zap size={16} className="mr-2" />
              Upgrade Now
            </Button>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}