import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Crown, Lock, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";

export default function LiveViewerNotification({ 
  viewerName,
  viewerPhoto,
  isPremium = false,
  onDismiss,
  className = "" 
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss?.(), 300);
    }, 10000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 ${className}`}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden">
            {/* Live indicator */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-1.5 flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 bg-white rounded-full"
              />
              <span className="text-white text-xs font-semibold uppercase tracking-wide">
                Live Now
              </span>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-4">
                {/* Blurred or clear photo based on premium */}
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full overflow-hidden border-2 border-purple-200 ${!isPremium ? 'relative' : ''}`}>
                    {isPremium ? (
                      <img
                        src={viewerPhoto || '/default-avatar.png'}
                        alt={viewerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <div className="w-full h-full bg-gradient-to-br from-purple-300 to-pink-300 blur-lg" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Lock size={20} className="text-white" />
                        </div>
                      </>
                    )}
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white"
                  >
                    <Eye size={12} className="text-white" />
                  </motion.div>
                </div>

                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">
                    {isPremium ? viewerName : 'Someone'} is viewing your profile
                  </h4>
                  <p className="text-sm text-gray-500">
                    {isPremium ? 'Check out their profile!' : 'Upgrade to see who 👀'}
                  </p>

                  {!isPremium && (
                    <Link to={createPageUrl('PricingPlans')}>
                      <Button size="sm" className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                        <Crown size={14} className="mr-1" />
                        Reveal Viewer
                      </Button>
                    </Link>
                  )}
                </div>

                <button
                  onClick={handleDismiss}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}