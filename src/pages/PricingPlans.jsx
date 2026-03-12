import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Crown, Heart, Eye, Filter, Sparkles, Zap, Globe, Shield, 
  Check, Star, Infinity, Users, MessageCircle, Award, BadgeCheck as Verified, CircleHelp as HelpCircle, X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AfricanPattern from '@/components/shared/AfricanPattern';
import SocialProofPaywall from '@/components/monetization/SocialProofPaywall';

const PRICING_TIERS = {
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Level up your dating life',
    icon: Heart,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    prices: {
      monthly: { amount: 14.99, period: 'month', total: 14.99 },
      quarterly: { amount: 11.66, period: 'month', total: 34.99, save: '22%' },
      yearly: { amount: 9.99, period: 'month', total: 119.99, save: '33%' }
    },
    features: [
      { text: '50 Likes per day', tip: 'Generous daily like limit' },
      { text: 'See Who Liked You', tip: 'View your admirers instantly' },
      { text: '100 Messages per day', tip: 'Plenty of messages to connect' },
      { text: 'Advanced Filters', tip: 'Filter by ethnicity, religion, and more' },
      { text: 'Read Receipts', tip: 'Know when your messages are read' },
      { text: '5 Rewinds per day', tip: 'Undo accidental passes' },
      { text: '1 Profile Boost/month', tip: 'Be the top profile in your area for 30 mins' }
    ]
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    description: 'For those serious about love',
    icon: Star,
    popular: true,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    buttonColor: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
    prices: {
      monthly: { amount: 24.99, period: 'month', total: 24.99 },
      quarterly: { amount: 19.99, period: 'month', total: 59.99, save: '20%' },
      yearly: { amount: 14.99, period: 'month', total: 179.99, save: '40%' }
    },
    features: [
      { text: 'Unlimited Likes', tip: 'Swipe right as much as you want' },
      { text: 'Unlimited Messaging', tip: 'Chat without any restrictions' },
      { text: 'Unlimited Rewinds', tip: 'Never miss a potential match' },
      { text: 'See Who Liked You', tip: 'View your admirers instantly' },
      { text: 'Virtual Gifts', tip: 'Send digital gifts to stand out' },
      { text: 'Elite Verified Badge', tip: 'Show you are real and serious' },
      { text: 'Priority Ranking', tip: 'Get seen by more people first' },
      { text: 'Unlimited Profile Boosts', tip: 'Boost your profile anytime' },
      { text: 'Incognito Mode', tip: 'Browse profiles without being seen' },
      { text: 'VIP Events Access', tip: 'Join exclusive mixers and workshops' }
    ]
  },
  vip: {
    id: 'vip',
    name: 'VIP',
    description: 'The ultimate experience',
    icon: Crown,
    color: 'text-slate-900',
    bgColor: 'bg-slate-50',
    buttonColor: 'bg-slate-900 hover:bg-black',
    prices: {
      monthly: { amount: 49.99, period: 'month', total: 49.99 },
      quarterly: { amount: 39.99, period: 'month', total: 119.99, save: '20%', label: '3 Months' },
      yearly: { amount: 29.99, period: 'month', total: 359.99, save: '40%' }
    },
    features: [
      { text: 'Everything in Elite', tip: '' },
      { text: 'Virtual Speed Dating', tip: 'Join exclusive live video dating events' },
      { text: 'VIP Verified Badge', tip: 'Exclusive gold status symbol' },
      { text: 'Concierge Support', tip: 'Direct line to our team 24/7' },
      { text: 'Exclusive VIP Events', tip: 'VIP-only mixers and speed dating' },
      { text: 'Featured Profile Placement', tip: 'Always shown first in discovery' },
      { text: 'Profile Insights & Analytics', tip: 'See who viewed you and detailed stats' },
      { text: '5 Virtual Gifts/month', tip: 'Free monthly gift allowance' },
      { text: 'Priority DMs', tip: 'Your messages appear first' }
    ]
  }
};

export default function PricingPlans() {
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [myProfile, setMyProfile] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me().catch(() => null);
        
        if (user) {
          const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
          if (profiles[0]) setMyProfile(profiles[0]);
        }
      } catch (e) {
        console.error("Init error", e);
      }
    };
    init();
  }, []);

  const handleSubscribe = (tierKey) => {
    if (!myProfile) {
        base44.auth.redirectToLogin(window.location.href);
        return;
    }
    
    // Payments will be handled via native in-app purchases (iOS/Android)
    console.log('Subscribe to:', tierKey, billingCycle);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AfricanPattern className="text-purple-900" opacity={0.03} />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-purple-600">
              <ArrowLeft size={20} />
              Back
            </Button>
          </Link>
          <div className="font-semibold text-gray-900">Upgrade Plan</div>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Unlock Your Full Potential
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Get better matches and more dates with our premium features.
          </p>

        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-16">
          <div className="bg-white p-1.5 rounded-full border border-gray-200 shadow-sm inline-flex relative">
            {['monthly', 'quarterly', 'yearly'].map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`relative px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  billingCycle === cycle 
                    ? 'text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {billingCycle === cycle && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-gray-900 rounded-full"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 capitalize">
                  {cycle}
                  {cycle === 'yearly' && (
                    <span className="ml-2 text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
                      Save 40%
                    </span>
                  )}
                  {cycle === 'quarterly' && (
                    <span className="ml-2 text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
                      -20%
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {Object.entries(PRICING_TIERS).map(([key, tier]) => {
            const price = tier.prices[billingCycle];
            const isPopular = tier.popular;

            if (!price) return null;

            return (
              <div 
                key={key}
                className={`relative bg-white rounded-3xl transition-all duration-300 flex flex-col
                  ${isPopular 
                    ? 'shadow-2xl border-2 border-amber-500 scale-105 z-10' 
                    : 'shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1'
                  }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className="p-8 pb-0 flex-1">
                  <div className={`w-12 h-12 rounded-2xl ${tier.bgColor} flex items-center justify-center mb-6`}>
                    <tier.icon className={`w-6 h-6 ${tier.color}`} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-gray-500 text-sm mb-6 min-h-[40px]">{tier.description}</p>
                  
                  <div className="flex items-baseline mb-8">
                    <span className="text-4xl font-bold text-gray-900">${price.amount}</span>
                    <span className="text-gray-500 ml-2">/mo</span>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={`mt-1 p-0.5 rounded-full ${tier.bgColor}`}>
                          <Check className={`w-3 h-3 ${tier.color}`} strokeWidth={3} />
                        </div>
                        <div className="flex-1">
                          <TooltipProvider>
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger className="text-sm text-gray-700 text-left hover:text-gray-900 cursor-help flex items-center gap-1.5">
                                {feature.text}
                                {feature.tip && <HelpCircle size={12} className="text-gray-300" />}
                              </TooltipTrigger>
                              {feature.tip && (
                                <TooltipContent>
                                  <p>{feature.tip}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-8 pt-0 mt-auto">
                  <Button 
                    onClick={() => handleSubscribe(key)}
                    className={`w-full py-6 text-base font-semibold rounded-xl shadow-lg transition-all active:scale-95 ${tier.buttonColor}`}
                  >
                    {myProfile?.subscription_tier === key ? 'Current Plan' : 'Subscribe'}
                  </Button>
                  <p className="text-center text-xs text-gray-400 mt-4">
                    {billingCycle === 'monthly' 
                      ? `$${price.total}/month`
                      : `Billed ${billingCycle === 'yearly' ? 'annually' : (billingCycle === 'quarterly' ? 'every 3 months' : '')} at $${price.total}`
                    }
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Social Proof Section */}
        <div className="mt-16 max-w-md mx-auto">
          <SocialProofPaywall />
        </div>

        {/* Feature Comparison Table */}
        <div id="comparison" className="mt-16 max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100">
                <h3 className="text-xl font-bold text-center">Compare Features</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="p-4 text-left text-sm font-medium text-gray-500 pl-8">Features</th>
                            <th className="p-4 text-center text-sm font-bold text-purple-600">Premium</th>
                            <th className="p-4 text-center text-sm font-bold text-amber-600">Elite</th>
                            <th className="p-4 text-center text-sm font-bold text-slate-900">VIP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[
                            { name: 'Daily Likes', premium: '50/day', elite: 'Unlimited', vip: 'Unlimited' },
                            { name: 'See Who Likes You', premium: true, elite: true, vip: true },
                            { name: 'Daily Messages', premium: '100/day', elite: 'Unlimited', vip: 'Unlimited' },
                            { name: 'Advanced Filters', premium: true, elite: true, vip: true },
                            { name: 'Read Receipts', premium: true, elite: true, vip: true },
                            { name: 'Rewind Last Swipe', premium: '5/day', elite: 'Unlimited', vip: 'Unlimited' },
                            { name: 'Profile Boosts', premium: '1/mo', elite: 'Unlimited', vip: 'Unlimited' },
                            { name: 'Virtual Gifts', premium: false, elite: true, vip: true },
                            { name: 'Priority Ranking', premium: false, elite: true, vip: true },
                            { name: 'Incognito Mode', premium: false, elite: true, vip: true },
                            { name: 'Verified Badge', premium: false, elite: 'Elite', vip: 'VIP' },
                            { name: 'Virtual Speed Dating', premium: false, elite: false, vip: true },
                            { name: 'Featured Placement', premium: false, elite: false, vip: true },
                            { name: 'Profile Insights', premium: false, elite: false, vip: true },
                            { name: 'Concierge Support', premium: false, elite: false, vip: true },
                            { name: 'Exclusive Events', premium: false, elite: false, vip: true },
                        ].map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 text-sm font-medium text-gray-900 pl-8">{row.name}</td>
                                <td className="p-4 text-center">
                                    {row.premium === true ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : row.premium ? <span className="text-sm font-medium text-purple-600">{row.premium}</span> : <span className="text-gray-300">-</span>}
                                </td>
                                <td className="p-4 text-center">
                                    {row.elite === true ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : row.elite ? <span className="text-sm font-medium text-amber-600">{row.elite}</span> : <span className="text-gray-300">-</span>}
                                </td>
                                <td className="p-4 text-center">
                                    {row.vip === true ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : row.vip ? <span className="text-sm font-medium text-slate-900">{row.vip}</span> : <span className="text-gray-300">-</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </main>
    </div>
  );
}