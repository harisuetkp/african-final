import React from 'react';
import { Flame, Award, Crown, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StreakBadge({ streak }) {
  if (streak < 3) return null;

  const getStreakInfo = () => {
    if (streak >= 30) return { icon: Crown, color: 'from-amber-500 to-yellow-500', label: `${streak} Day Streak! 👑` };
    if (streak >= 14) return { icon: Award, color: 'from-purple-500 to-pink-500', label: `${streak} Day Streak! 🎖️` };
    if (streak >= 7) return { icon: Star, color: 'from-blue-500 to-cyan-500', label: `${streak} Day Streak! ⭐` };
    return { icon: Flame, color: 'from-orange-500 to-red-500', label: `${streak} Day Streak! 🔥` };
  };

  const { icon: Icon, color, label } = getStreakInfo();

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${color} text-white rounded-full shadow-lg font-bold`}
    >
      <Icon size={18} className="animate-pulse" />
      <span>{label}</span>
    </motion.div>
  );
}