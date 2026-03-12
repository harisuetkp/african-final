import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, Heart, Eye, Zap, Gift, Star, Check, Users, Rocket } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FoundingMemberWelcome({ isOpen, onClose, profile }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isOpen && step === 0) {
      // Trigger confetti on open
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.4 },
          colors: ['#f59e0b', '#d97706', '#b45309', '#fbbf24', '#fcd34d']
        });
      }, 300);
    }
  }, [isOpen, step]);

  const benefits = [
    { icon: Heart, text: 'Unlimited likes every day', color: 'text-pink-500' },
    { icon: Eye, text: 'See who likes you', color: 'text-purple-500' },
    { icon: Zap, text: '5 Super Likes per day', color: 'text-amber-500' },
    { icon: Sparkles, text: 'Advanced filters & search', color: 'text-blue-500' },
    { icon: Check, text: 'Read receipts on messages', color: 'text-green-500' },
    { icon: Star, text: '1 free profile boost/month', color: 'text-orange-500' },
  ];

  const steps = [
    // Step 0: Main Welcome
    <motion.div
      key="welcome"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="text-center"
    >
      <motion.div 
        className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-xl"
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Crown size={48} className="text-white" />
      </motion.div>

      <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white mb-4 px-4 py-1.5">
        <Sparkles size={14} className="mr-1" /> EXCLUSIVE
      </Badge>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Welcome, Founding Member! 👑
      </h1>
      
      <p className="text-gray-600 mb-6">
        You're one of the <strong className="text-amber-600">first 1,000</strong> people to join Afrinnect. 
        As a thank you, you get <strong className="text-amber-600">6 months of Premium FREE</strong>!
      </p>

      <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Gift className="text-amber-600" size={24} />
          <span className="text-2xl font-bold text-amber-700">$0.00</span>
          <span className="text-gray-500 line-through">$149.94</span>
        </div>
        <p className="text-sm text-amber-800 font-medium">
          No credit card needed • No charges ever • Full Premium access
        </p>
      </div>

      <Button 
        onClick={() => setStep(1)}
        className="w-full py-6 text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg"
      >
        See My Benefits <Sparkles size={20} className="ml-2" />
      </Button>
    </motion.div>,

    // Step 1: Benefits Overview
    <motion.div
      key="benefits"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your Founding Member Benefits
        </h2>
        <p className="text-gray-500">Everything included, completely free:</p>
      </div>

      <div className="space-y-3 mb-6">
        {benefits.map((benefit, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
              <benefit.icon size={20} className={benefit.color} />
            </div>
            <span className="font-medium text-gray-800">{benefit.text}</span>
            <Check size={18} className="text-green-500 ml-auto" />
          </motion.div>
        ))}
      </div>

      <Button 
        onClick={() => setStep(2)}
        className="w-full py-6 text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
      >
        Continue <Rocket size={20} className="ml-2" />
      </Button>
    </motion.div>,

    // Step 2: Engagement & Commitment
    <motion.div
      key="commitment"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="text-center"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <Users size={40} className="text-purple-600" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        You're Part of Something Special
      </h2>

      <p className="text-gray-600 mb-6">
        As a Founding Member, you're helping us build the <strong>premier community</strong> for 
        African and African diaspora singles. Your feedback matters!
      </p>

      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-6 text-left">
        <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
          <Star className="text-amber-500" size={18} /> Why stay logged in?
        </h3>
        <ul className="space-y-2 text-sm text-purple-800">
          <li className="flex items-start gap-2">
            <Check size={16} className="mt-0.5 text-green-500 flex-shrink-0" />
            Get notified instantly when someone likes you
          </li>
          <li className="flex items-start gap-2">
            <Check size={16} className="mt-0.5 text-green-500 flex-shrink-0" />
            Don't miss your daily matches & boost opportunities
          </li>
          <li className="flex items-start gap-2">
            <Check size={16} className="mt-0.5 text-green-500 flex-shrink-0" />
            Your profile stays visible to potential matches
          </li>
          <li className="flex items-start gap-2">
            <Check size={16} className="mt-0.5 text-green-500 flex-shrink-0" />
            Active members get 3x more matches!
          </li>
        </ul>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
        <p className="text-green-800 font-medium text-sm">
          🔒 Your Premium status is locked in for <strong>6 months</strong> — no action needed!
        </p>
      </div>

      <Button 
        onClick={onClose}
        className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
      >
        Start Finding Matches! 💕
      </Button>

      <p className="text-xs text-gray-400 mt-4">
        Thank you for being a Founding Member. We're honored to have you!
      </p>
    </motion.div>
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 bg-gradient-to-br from-white via-amber-50/30 to-white border-0 shadow-2xl">
        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}