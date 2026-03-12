import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Sparkles, BadgeCheck } from 'lucide-react';

export default function PremiumBadgeOnProfile({ tier, size = 'default' }) {
  if (!tier || tier === 'free') return null;

  const badges = {
    premium: {
      icon: Star,
      label: 'Premium',
      colors: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    elite: {
      icon: Crown,
      label: 'Elite',
      colors: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    vip: {
      icon: Sparkles,
      label: 'VIP',
      colors: 'from-slate-800 to-slate-900',
      textColor: 'text-slate-900',
      bgColor: 'bg-slate-100'
    }
  };

  const badge = badges[tier];
  if (!badge) return null;

  const Icon = badge.icon;

  if (size === 'small') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r ${badge.colors} text-white text-[10px] font-bold`}
      >
        <Icon size={10} />
        <span>{badge.label}</span>
      </motion.div>
    );
  }

  if (size === 'icon') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        className={`w-6 h-6 rounded-full bg-gradient-to-r ${badge.colors} flex items-center justify-center shadow-lg`}
        title={badge.label}
      >
        <Icon size={14} className="text-white" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${badge.colors} text-white text-xs font-bold shadow-md`}
    >
      <Icon size={14} />
      <span>{badge.label}</span>
      <BadgeCheck size={12} className="text-white/80" />
    </motion.div>
  );
}