import React from 'react';
import { motion } from 'framer-motion';

export default function TypingIndicator({ name }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow max-w-xs"
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-purple-600 rounded-full"
            animate={{
              y: ['0%', '-50%', '0%']
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15
            }}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600">{name} is typing...</span>
    </motion.div>
  );
}