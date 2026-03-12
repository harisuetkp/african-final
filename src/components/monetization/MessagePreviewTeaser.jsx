import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Crown, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";

export default function MessagePreviewTeaser({ 
  message, 
  senderName,
  senderPhoto,
  isPremium = false,
  className = "" 
}) {
  if (isPremium || !message) return null;

  // Show first 3 words then blur
  const words = message.split(' ');
  const visibleWords = words.slice(0, 3).join(' ');
  const hasMore = words.length > 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-white rounded-xl border border-purple-100 shadow-sm overflow-hidden ${className}`}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <img 
              src={senderPhoto || '/default-avatar.png'}
              alt={senderName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
              <MessageCircle size={10} className="text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{senderName}</h4>
            <p className="text-xs text-purple-600">New message</p>
          </div>
        </div>

        {/* Message preview with blur effect */}
        <div className="relative">
          <p className="text-gray-700">
            {visibleWords}
            {hasMore && (
              <span className="relative inline-block ml-1">
                <span className="blur-sm select-none">
                  {words.slice(3, 8).join(' ')}...
                </span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <Lock size={14} className="text-purple-500" />
                </span>
              </span>
            )}
          </p>
        </div>

        {hasMore && (
          <Link to={createPageUrl('PricingPlans')}>
            <Button 
              size="sm" 
              className="w-full mt-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Crown size={14} className="mr-2" />
              Upgrade to Read Full Message
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}