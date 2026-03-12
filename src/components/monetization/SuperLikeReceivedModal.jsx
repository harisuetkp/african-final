import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Crown, Lock, Heart, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export default function SuperLikeReceivedModal({ 
  isOpen,
  onClose,
  senderName,
  senderPhoto,
  isPremium = false
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-0">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-1"
        >
          <div className="bg-white rounded-[22px] p-6 text-center relative overflow-hidden">
            {/* Sparkle decorations */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              className="absolute top-4 left-4"
            >
              <Sparkles size={20} className="text-amber-400" />
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="absolute top-4 right-4"
            >
              <Star size={20} className="text-blue-400" fill="currentColor" />
            </motion.div>

            {/* Star burst animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="relative w-32 h-32 mx-auto mb-6"
            >
              {/* Pulsing rings */}
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 rounded-full bg-blue-400/30"
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                className="absolute inset-0 rounded-full bg-purple-400/30"
              />

              {/* Photo or blurred placeholder */}
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-blue-500 shadow-xl">
                {isPremium ? (
                  <img
                    src={senderPhoto || '/default-avatar.png'}
                    alt={senderName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-300 via-purple-300 to-pink-300">
                    <div className="absolute inset-0 backdrop-blur-xl bg-white/30 flex items-center justify-center">
                      <Lock size={32} className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                )}
              </div>

              {/* Star badge */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-3 border-white"
              >
                <Star size={24} className="text-white" fill="white" />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                You Got a Super Like! ⭐
              </h2>
              <p className="text-gray-600 mb-6">
                {isPremium 
                  ? `${senderName} thinks you're amazing!`
                  : 'Someone special super liked you!'
                }
              </p>

              {isPremium ? (
                <div className="space-y-3">
                  <Link to={createPageUrl('WhoLikesYou')}>
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      <Heart size={18} className="mr-2" />
                      View Profile & Like Back
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={onClose} className="w-full text-gray-500">
                    Maybe Later
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-purple-600 font-medium">
                    Upgrade to see who super liked you!
                  </p>
                  <Link to={createPageUrl('PricingPlans')}>
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                      <Crown size={18} className="mr-2" />
                      Unlock Super Like
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={onClose} className="w-full text-gray-500">
                    Close
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}