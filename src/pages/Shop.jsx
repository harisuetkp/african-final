import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  ArrowLeft, Zap, Star, RotateCcw, Eye, Crown, Sparkles, 
  Check, ShoppingBag, Loader2, Gift
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const SHOP_ITEMS = [
  {
    id: 'boost_1',
    type: 'boost',
    name: 'Profile Boost',
    description: 'Be seen by 10x more people for 30 minutes',
    price: 2.99,
    quantity: 1,
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    popular: true
  },
  {
    id: 'boost_3',
    type: 'boost',
    name: '3 Boosts Pack',
    description: 'Save 15% - Best for regular boosting',
    price: 7.49,
    originalPrice: 8.97,
    quantity: 3,
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    badge: 'Save 15%'
  },
  {
    id: 'superlike_3',
    type: 'super_likes',
    name: '3 Super Likes',
    description: 'Stand out from the crowd',
    price: 4.99,
    quantity: 3,
    icon: Star,
    color: 'from-blue-500 to-purple-500'
  },
  {
    id: 'superlike_10',
    type: 'super_likes',
    name: '10 Super Likes',
    description: 'For when you see someone special',
    price: 12.99,
    originalPrice: 16.63,
    quantity: 10,
    icon: Star,
    color: 'from-blue-500 to-purple-500',
    badge: 'Save 22%',
    popular: true
  },
  {
    id: 'unlock_24h',
    type: '24hr_unlock',
    name: 'See Who Likes You',
    description: '24-hour access to see all your admirers',
    price: 1.99,
    quantity: 1,
    icon: Eye,
    color: 'from-pink-500 to-red-500'
  },
  {
    id: 'rewind_5',
    type: 'rewind',
    name: '5 Rewinds',
    description: 'Undo accidental passes',
    price: 3.99,
    quantity: 5,
    icon: RotateCcw,
    color: 'from-amber-500 to-orange-500'
  }
];

export default function Shop() {
  const [myProfile, setMyProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) {
          setMyProfile(profiles[0]);
        }
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      }
    };
    fetchProfile();
  }, []);

  const handlePurchase = async (item) => {
    // Show coming soon message - payments will be via App Store/Play Store
    alert('In-app purchases coming soon! This will be available through the App Store and Google Play.');
  };

  const tier = myProfile?.subscription_tier || 'free';
  const isPremium = ['premium', 'elite', 'vip'].includes(tier);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-amber-50/20 pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <ShoppingBag size={20} className="text-purple-600" />
            Shop
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Coming Soon Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 mb-6 text-white"
        >
          <div className="flex items-center gap-3">
            <Sparkles size={32} className="flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold">Coming Soon!</p>
              <p className="text-sm text-white/80">In-app purchases will be available via App Store & Google Play</p>
            </div>
          </div>
        </motion.div>

        {/* Premium Upsell Banner */}
        {!isPremium && (
          <Link to={createPageUrl('PricingPlans')}>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-4 mb-6 text-white"
            >
              <div className="flex items-center gap-3">
                <Crown size={32} className="flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold">Get Premium</p>
                  <p className="text-sm text-white/80">Unlimited everything + exclusive features</p>
                </div>
                <Button size="sm" variant="secondary" className="flex-shrink-0">
                  View Plans
                </Button>
              </div>
            </motion.div>
          </Link>
        )}

        {/* Current Balance */}
        {(myProfile?.purchased_boosts > 0 || myProfile?.purchased_super_likes > 0) && (
          <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Your Balance</h3>
            <div className="flex gap-4">
              {myProfile?.purchased_boosts > 0 && (
                <div className="flex items-center gap-2 bg-purple-50 rounded-lg px-3 py-2">
                  <Zap size={16} className="text-purple-600" />
                  <span className="font-bold text-purple-700">{myProfile.purchased_boosts}</span>
                  <span className="text-sm text-gray-600">Boosts</span>
                </div>
              )}
              {myProfile?.purchased_super_likes > 0 && (
                <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                  <Star size={16} className="text-blue-600 fill-blue-600" />
                  <span className="font-bold text-blue-700">{myProfile.purchased_super_likes}</span>
                  <span className="text-sm text-gray-600">Super Likes</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shop Items */}
        <div className="space-y-4">
          {SHOP_ITEMS.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`relative overflow-hidden ${item.popular ? 'ring-2 ring-purple-500' : ''}`}>
                {item.popular && (
                  <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                {item.badge && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                    {item.badge}
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <item.icon size={28} className="text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        {item.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">${item.originalPrice}</span>
                        )}
                        <span className="text-xl font-bold text-gray-900">${item.price}</span>
                      </div>
                      <Button
                        onClick={() => handlePurchase(item)}
                        size="sm"
                        className={`mt-1 bg-gradient-to-r ${item.color} hover:opacity-90`}
                      >
                        Coming Soon
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Purchases are one-time and don't expire.</p>
          <p className="mt-1">Questions? <Link to={createPageUrl('Support')} className="text-purple-600 hover:underline">Contact Support</Link></p>
        </div>
      </main>
    </div>
  );
}