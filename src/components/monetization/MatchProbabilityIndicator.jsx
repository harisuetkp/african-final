import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Heart, Sparkles } from 'lucide-react';

export default function MatchProbabilityIndicator({ likesReceived, isPremium }) {
  // Simple heuristic: more likes received = higher probability
  // This is a motivational indicator, not actual probability
  
  let status = 'building';
  let message = '';
  let color = 'text-gray-500';
  let bgColor = 'bg-gray-100';
  let icon = TrendingUp;

  if (likesReceived >= 10) {
    status = 'hot';
    message = "You're on fire! 🔥";
    color = 'text-red-600';
    bgColor = 'bg-red-50';
    icon = Sparkles;
  } else if (likesReceived >= 5) {
    status = 'rising';
    message = "You're getting noticed!";
    color = 'text-amber-600';
    bgColor = 'bg-amber-50';
    icon = TrendingUp;
  } else if (likesReceived >= 1) {
    status = 'active';
    message = "Someone likes you!";
    color = 'text-pink-600';
    bgColor = 'bg-pink-50';
    icon = Heart;
  } else {
    message = "Keep swiping!";
  }

  const Icon = icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${bgColor} ${color}`}
    >
      <motion.div
        animate={status === 'hot' ? { rotate: [0, 10, -10, 0] } : {}}
        transition={{ repeat: status === 'hot' ? Infinity : 0, duration: 0.5 }}
      >
        <Icon size={14} />
      </motion.div>
      <span className="text-xs font-medium">{message}</span>
      
      {!isPremium && likesReceived > 0 && (
        <span className="text-xs opacity-70">• Upgrade to see who!</span>
      )}
    </motion.div>
  );
}