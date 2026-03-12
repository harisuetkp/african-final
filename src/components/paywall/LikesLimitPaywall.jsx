import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Heart, TrendingUp, Clock, Sparkles, X, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Updated tier features: Premium = limited, Elite = unlimited

export default function LikesLimitPaywall({ onClose }) {
  const [upgradeCount, setUpgradeCount] = useState(23);
  const [currentProof, setCurrentProof] = useState(0);
  const [countdown, setCountdown] = useState({ hours: 5, minutes: 59, seconds: 59 });

  // Social proof data
  const socialProofs = [
    { name: 'Amara', action: 'just upgraded', time: '2 min ago' },
    { name: 'David', action: 'got 8 new matches today', time: '5 min ago' },
    { name: 'Sarah', action: 'found their match!', time: '12 min ago' },
  ];

  useEffect(() => {
    // Rotate social proof
    const proofInterval = setInterval(() => {
      setCurrentProof((prev) => (prev + 1) % socialProofs.length);
    }, 3500);

    // Slowly increase upgrade count
    const countInterval = setInterval(() => {
      setUpgradeCount(prev => prev + Math.floor(Math.random() * 2));
    }, 45000);

    // Countdown timer (resets daily)
    const timerInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);

    return () => {
      clearInterval(proofInterval);
      clearInterval(countInterval);
      clearInterval(timerInterval);
    };
  }, []);

  const formatTime = (num) => num.toString().padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md relative"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-700"
        >
          <X size={18} />
        </button>

        <Card className="overflow-hidden border-0 shadow-2xl">
          {/* Urgency banner */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 flex items-center justify-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Clock size={16} className="text-white" />
            </motion.div>
            <span className="text-white text-sm font-semibold">
              Special offer ends in {formatTime(countdown.hours)}:{formatTime(countdown.minutes)}:{formatTime(countdown.seconds)}
            </span>
          </div>

          <CardContent className="p-6 text-center">
            {/* Animated heart icon */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center shadow-xl"
            >
              <Heart size={40} className="text-white" fill="white" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              You're Out of Likes! 💔
            </h2>
            <p className="text-gray-500 mb-4 text-sm">
              Don't miss your chance to connect with amazing people waiting for you
            </p>

            {/* Social proof ticker */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentProof}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-2 bg-green-50 rounded-lg px-4 py-2 mb-4"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <TrendingUp size={12} className="text-white" />
                </div>
                <span className="text-sm text-gray-700">
                  <strong>{socialProofs[currentProof].name}</strong> {socialProofs[currentProof].action}
                </span>
                <span className="text-xs text-gray-400">{socialProofs[currentProof].time}</span>
              </motion.div>
            </AnimatePresence>

            {/* Premium vs Elite comparison */}
            <div className="space-y-3 mb-4">
              {/* Premium option */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Heart size={18} className="text-purple-600" />
                    <span className="font-bold text-gray-900">Premium</span>
                  </div>
                  <span className="text-sm text-gray-500">$14.99/mo</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-left text-gray-600">
                  <span>• 50 likes/day</span>
                  <span>• 100 messages/day</span>
                  <span>• See who likes you</span>
                  <span>• 5 rewinds/day</span>
                </div>
              </div>

              {/* Elite option - recommended */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-400 relative">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  BEST VALUE
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-600" />
                    <span className="font-bold text-gray-900">Elite</span>
                  </div>
                  <span className="text-sm text-gray-500">$24.99/mo</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-left text-gray-600">
                  <span>• <strong>Unlimited</strong> likes</span>
                  <span>• <strong>Unlimited</strong> messages</span>
                  <span>• <strong>Unlimited</strong> rewinds</span>
                  <span>• Priority ranking</span>
                </div>
              </div>
            </div>

            {/* Live upgrade counter */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
              <span>
                <strong className="text-purple-600">{upgradeCount}</strong> people upgraded in the last hour
              </span>
            </div>

            <Link to={createPageUrl('PricingPlans')}>
              <Button className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg mb-3">
                <Crown size={22} className="mr-2" />
                Upgrade Now - Limited Offer
              </Button>
            </Link>

            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-gray-400"
            >
              No thanks, I'll wait until tomorrow
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}