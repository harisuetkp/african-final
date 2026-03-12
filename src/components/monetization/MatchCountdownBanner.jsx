import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MessageCircle, AlertTriangle, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";

export default function MatchCountdownBanner({ 
  matchId,
  expiresAt,
  partnerName,
  partnerPhoto,
  hasMessage = false,
  onExpire,
  className = "" 
}) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expires = new Date(expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        onExpire?.();
        return null;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Urgent if less than 2 hours
      setIsUrgent(hours < 2);

      return { hours, minutes, seconds, total: diff };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (!timeLeft || hasMessage) return null;

  const formatTime = (num) => num.toString().padStart(2, '0');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className={`relative overflow-hidden rounded-xl ${
          isUrgent 
            ? 'bg-gradient-to-r from-red-500 to-orange-500' 
            : 'bg-gradient-to-r from-purple-500 to-pink-500'
        } ${className}`}
      >
        {/* Pulsing background for urgency */}
        {isUrgent && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute inset-0 bg-white/20"
          />
        )}

        <div className="relative p-4 flex items-center gap-4">
          {/* Partner photo */}
          <div className="relative flex-shrink-0">
            <img
              src={partnerPhoto || '/default-avatar.png'}
              alt={partnerName}
              className="w-14 h-14 rounded-full object-cover border-2 border-white/50"
            />
            <motion.div
              animate={isUrgent ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow"
            >
              {isUrgent ? (
                <AlertTriangle size={14} className="text-red-500" />
              ) : (
                <Heart size={14} className="text-pink-500" fill="currentColor" />
              )}
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold truncate">
              Match with {partnerName}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Clock size={14} className="text-white/80" />
              <motion.span
                animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-white font-mono text-lg"
              >
                {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
              </motion.span>
            </div>
            <p className="text-white/80 text-xs mt-1">
              {isUrgent ? '⚠️ Expiring soon! Send a message now!' : 'Send a message before time runs out'}
            </p>
          </div>

          {/* Action button */}
          <Link to={createPageUrl(`Chat?matchId=${matchId}`)}>
            <Button
              size="sm"
              className={`flex-shrink-0 ${
                isUrgent 
                  ? 'bg-white text-red-600 hover:bg-white/90' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <MessageCircle size={16} className="mr-1" />
              Chat
            </Button>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}