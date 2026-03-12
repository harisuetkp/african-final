import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, differenceInDays } from 'date-fns';

export default function SubscriptionReminder({ userProfile }) {
  const [showReminder, setShowReminder] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!userProfile?.id) return;

      const subs = await base44.entities.Subscription.filter({
        user_profile_id: userProfile.id,
        status: 'active'
      });

      if (subs.length > 0) {
        const activeSub = subs[0];
        setSubscription(activeSub);

        // Show reminder if expiring in 7 days
        const daysUntilExpiry = differenceInDays(new Date(activeSub.end_date), new Date());
        
        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
          const reminderShown = localStorage.getItem(`renewal_reminder_${activeSub.id}`);
          if (!reminderShown) {
            setShowReminder(true);
          }
        }
      }
    };

    checkSubscription();
  }, [userProfile]);

  const dismissReminder = () => {
    setShowReminder(false);
    if (subscription) {
      localStorage.setItem(`renewal_reminder_${subscription.id}`, 'true');
    }
  };

  if (!showReminder || !subscription) return null;

  const daysLeft = differenceInDays(new Date(subscription.end_date), new Date());

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-40"
      >
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 shadow-2xl text-white relative">
          <button
            onClick={dismissReminder}
            className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Crown size={24} />
            </div>
            <div>
              <h4 className="font-bold text-lg">Subscription Expiring Soon</h4>
              <p className="text-sm text-white/90">
                Your {subscription.plan_type.replace('_', ' ')} plan expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="bg-white/20 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} />
              <span>Expires: {format(new Date(subscription.end_date), 'MMM dd, yyyy')}</span>
            </div>
          </div>

          <Link to={createPageUrl('PricingPlans')}>
            <Button className="w-full bg-white text-amber-600 hover:bg-gray-100">
              Renew Now
            </Button>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}