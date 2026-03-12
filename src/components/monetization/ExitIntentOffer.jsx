import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Percent, Clock, Gift, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";

export default function ExitIntentOffer({ 
  isOnPricingPage = false,
  discountPercent = 20,
  onDismiss 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    if (!isOnPricingPage || hasShown) return;

    // Check if already shown this session
    const shown = sessionStorage.getItem('exit_intent_shown');
    if (shown) {
      setHasShown(true);
      return;
    }

    // Detect mouse leaving viewport (desktop)
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !hasShown) {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.setItem('exit_intent_shown', 'true');
      }
    };

    // Detect back button or tab switch (mobile/desktop)
    const handleVisibilityChange = () => {
      if (document.hidden && !hasShown) {
        // User is leaving - set flag for when they return
        sessionStorage.setItem('show_exit_offer', 'true');
      } else if (!document.hidden && sessionStorage.getItem('show_exit_offer')) {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.removeItem('show_exit_offer');
        sessionStorage.setItem('exit_intent_shown', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOnPricingPage, hasShown]);

  const handleClose = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            className="relative max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative border */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 rounded-3xl blur-sm" />
            
            <div className="relative bg-white rounded-3xl p-8 overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 z-10"
              >
                <X size={20} />
              </button>

              {/* Sparkles */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute top-6 left-6"
              >
                <Sparkles size={24} className="text-amber-400" />
              </motion.div>

              {/* Content */}
              <div className="text-center">
                {/* Discount badge */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex flex-col items-center justify-center shadow-xl"
                >
                  <span className="text-3xl font-black text-white">{discountPercent}%</span>
                  <span className="text-xs text-white/90 font-bold">OFF</span>
                </motion.div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Wait! Don't Go Yet! 🎁
                </h2>
                
                <p className="text-gray-600 mb-6">
                  Here's a special offer just for you - <span className="font-bold text-amber-600">{discountPercent}% off</span> your first premium subscription!
                </p>

                {/* Timer urgency */}
                <div className="flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-full px-4 py-2 mb-6">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <Clock size={16} />
                  </motion.div>
                  <span className="text-sm font-semibold">Offer expires in 10 minutes</span>
                </div>

                {/* CTA */}
                <Link to={createPageUrl('PricingPlans') + '?discount=' + discountPercent}>
                  <Button 
                    className="w-full py-6 text-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg"
                  >
                    <Gift size={20} className="mr-2" />
                    Claim {discountPercent}% Discount
                  </Button>
                </Link>

                <button
                  onClick={handleClose}
                  className="mt-4 text-sm text-gray-400 hover:text-gray-600"
                >
                  No thanks, I'll pay full price
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}