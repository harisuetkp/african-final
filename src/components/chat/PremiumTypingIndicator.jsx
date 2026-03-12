import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";

export default function PremiumTypingIndicator({ 
  isTyping, 
  displayName, 
  isPremium = false,
  showUpgradePrompt = true 
}) {
  if (!isTyping) return null;

  // Non-premium users see a teaser
  if (!isPremium && showUpgradePrompt) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-center gap-2 px-4 py-2 mb-2"
        >
          <div className="bg-gradient-to-r from-amber-50 to-purple-50 border border-amber-200 rounded-2xl px-4 py-2 flex items-center gap-3">
            <div className="flex gap-1">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                className="w-2 h-2 bg-amber-400 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 bg-amber-400 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 bg-amber-400 rounded-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Lock size={12} className="text-amber-600" />
              <span className="text-xs text-amber-700">Someone is typing...</span>
              <Link to={createPageUrl('PricingPlans')}>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100">
                  <Crown size={10} className="mr-1" />
                  See who
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Premium users see full typing indicator with name
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex items-center gap-2 px-4 py-2 mb-2"
      >
        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-sm">
          <div className="flex gap-1">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              className="w-2 h-2 bg-purple-500 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              className="w-2 h-2 bg-purple-500 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              className="w-2 h-2 bg-purple-500 rounded-full"
            />
          </div>
          <span className="text-sm text-gray-600">
            <strong>{displayName}</strong> is typing...
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}