import React from 'react';
import { Eye, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SocialProofBanner({ viewsToday, likesThisWeek, percentile }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100"
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={20} className="text-purple-600" />
        <h3 className="font-semibold text-gray-800">Your Profile Performance</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Eye size={16} className="text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">{viewsToday}</span>
          </div>
          <p className="text-xs text-gray-500">Views Today</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users size={16} className="text-pink-600" />
            <span className="text-2xl font-bold text-gray-900">{likesThisWeek}</span>
          </div>
          <p className="text-xs text-gray-500">Likes This Week</p>
        </div>

        <div className="text-center">
          <div className="mb-1">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Top {percentile}%
            </span>
          </div>
          <p className="text-xs text-gray-500">In Your Area</p>
        </div>
      </div>
    </motion.div>
  );
}