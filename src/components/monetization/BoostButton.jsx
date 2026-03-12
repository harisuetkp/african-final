import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Crown, Users, Loader2, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import confetti from 'canvas-confetti';

export default function BoostButton({ userProfile, onBoostActivated }) {
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [boostTimeLeft, setBoostTimeLeft] = useState(0);
  const [liveViewers, setLiveViewers] = useState(0);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Check if boost is active
  useEffect(() => {
    if (!userProfile) return;
    
    if (userProfile.profile_boost_active && userProfile.boost_expires_at) {
      const expiresAt = new Date(userProfile.boost_expires_at).getTime();
      const now = Date.now();
      
      if (expiresAt > now) {
        setIsBoostActive(true);
        setBoostTimeLeft(Math.floor((expiresAt - now) / 1000 / 60)); // minutes left
        
        // Simulate live viewers during boost
        setLiveViewers(Math.floor(Math.random() * 15) + 8);
      }
    }
  }, [userProfile]);

  // Update boost timer every minute
  useEffect(() => {
    if (!isBoostActive) return;
    
    const interval = setInterval(() => {
      if (userProfile?.boost_expires_at) {
        const expiresAt = new Date(userProfile.boost_expires_at).getTime();
        const now = Date.now();
        const minutesLeft = Math.floor((expiresAt - now) / 1000 / 60);
        
        if (minutesLeft <= 0) {
          setIsBoostActive(false);
          setBoostTimeLeft(0);
          setLiveViewers(0);
        } else {
          setBoostTimeLeft(minutesLeft);
          // Fluctuate viewers
          setLiveViewers(prev => Math.max(5, prev + Math.floor(Math.random() * 5) - 2));
        }
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [isBoostActive, userProfile]);

  const activateBoost = async () => {
    setIsPurchasing(true);
    try {
      const tier = userProfile?.subscription_tier || 'free';
      
      // Check boost limits by tier
      if (tier === 'free') {
        // Free users need to pay
        setShowPurchaseModal(true);
        setIsPurchasing(false);
        return;
      }
      
      // Premium: 1/month, Elite/VIP: unlimited
      if (tier === 'premium') {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const boostsThisMonth = await base44.entities.ProfileBoost.filter({
          user_profile_id: userProfile.id,
          created_date: { $gte: monthStart.toISOString() }
        });
        
        if (boostsThisMonth.length >= 1) {
          alert('You\'ve used your monthly boost. Upgrade to Elite for unlimited boosts!');
          setIsPurchasing(false);
          return;
        }
      }

      // Create boost record
      const boostDuration = 30 * 60 * 1000; // 30 minutes
      const expiresAt = new Date(Date.now() + boostDuration).toISOString();
      
      await base44.entities.ProfileBoost.create({
        user_profile_id: userProfile.id,
        boost_type: 'standard',
        started_at: new Date().toISOString(),
        expires_at: expiresAt,
        is_active: true
      });
      
      await base44.entities.UserProfile.update(userProfile.id, {
        profile_boost_active: true,
        boost_expires_at: expiresAt
      });
      
      setIsBoostActive(true);
      setBoostTimeLeft(30);
      setLiveViewers(Math.floor(Math.random() * 12) + 10);
      
      // Celebration
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
      
      onBoostActivated?.();
    } catch (e) {
      console.error('Boost failed:', e);
      alert('Failed to activate boost');
    }
    setIsPurchasing(false);
  };

  const purchaseBoost = async () => {
    // Redirect to pricing with boost selected
    window.location.href = createPageUrl('PricingPlans') + '?boost=true';
  };

  return (
    <>
      {/* Main Boost Button */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        {isBoostActive ? (
          // Active Boost State
          <motion.div
            animate={{ 
              boxShadow: ['0 0 20px rgba(168, 85, 247, 0.4)', '0 0 40px rgba(168, 85, 247, 0.6)', '0 0 20px rgba(168, 85, 247, 0.4)']
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <Zap size={24} className="text-yellow-300" />
                </motion.div>
                <span className="font-bold text-lg">BOOST ACTIVE!</span>
              </div>
              <Badge className="bg-white/20 text-white border-0">
                {boostTimeLeft} min left
              </Badge>
            </div>
            
            {/* Live Viewers */}
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 bg-green-400 rounded-full"
              />
              <Users size={16} />
              <span className="text-sm font-medium">{liveViewers} people viewing your profile now</span>
            </div>
          </motion.div>
        ) : (
          // Inactive State - CTA
          <Button
            onClick={activateBoost}
            disabled={isPurchasing}
            className="w-full h-14 bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 hover:from-purple-700 hover:via-pink-600 hover:to-amber-600 text-white font-bold text-lg shadow-lg"
          >
            {isPurchasing ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <>
                <Zap size={22} className="mr-2" />
                Boost Your Profile
                <Badge className="ml-2 bg-white/20 border-0">10x visibility</Badge>
              </>
            )}
          </Button>
        )}
      </motion.div>

      {/* Purchase Modal for Free Users */}
      <AnimatePresence>
        {showPurchaseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowPurchaseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <button 
                onClick={() => setShowPurchaseModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Boost Your Profile</h3>
                <p className="text-gray-600 mt-2">Be seen by 10x more people for 30 minutes!</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-green-500">✓</span>
                  <span>Appear at the top of discovery</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-green-500">✓</span>
                  <span>Get up to 10x more profile views</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-green-500">✓</span>
                  <span>See live viewer count</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={purchaseBoost}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Zap size={18} className="mr-2" />
                  Get Boost - $2.99
                </Button>
                
                <Link to={createPageUrl('PricingPlans')}>
                  <Button variant="outline" className="w-full h-12">
                    <Crown size={18} className="mr-2 text-amber-500" />
                    Get Unlimited with Premium
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}