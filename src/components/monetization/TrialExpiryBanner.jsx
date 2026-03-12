import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Crown, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function TrialExpiryBanner({ userProfile }) {
  const { t } = useLanguage();
  
  // Check both premium status and date presence
  const isPremium = userProfile?.is_premium;
  const premiumUntil = userProfile?.premium_until;
  
  const expiresAt = premiumUntil ? new Date(premiumUntil) : null;
  const now = new Date();
  const hoursLeft = expiresAt ? Math.floor((expiresAt - now) / (1000 * 60 * 60)) : 999;
  const daysLeft = Math.floor(hoursLeft / 24);

  // Self-correction: If expired but still marked as premium in frontend prop, 
  // trigger a backend check to force downgrade if needed.
  useEffect(() => {
    if (hoursLeft <= 0 && isPremium) {
      const verifyStatus = async () => {
        try {
          await base44.functions.invoke('checkMySubscription');
        } catch (e) {
          console.error('Failed to verify subscription:', e);
        }
      };
      verifyStatus();
    }
  }, [hoursLeft, isPremium]);
  
  // Early return after hooks
  if (!isPremium || !premiumUntil) {
    return null;
  }
  
  // Don't show if more than 24 hours left
  if (hoursLeft > 24) {
    return null;
  }

  // Already expired
  if (hoursLeft <= 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4"
      >
        <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300">
          <Crown className="h-5 w-5 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{t('admin.trial.ended')}</p>
              <p className="text-sm text-gray-600 mt-1">
                {t('admin.trial.upgradeToKeep')}
              </p>
            </div>
            <Link to={createPageUrl('PricingPlans')}>
              <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 ml-4">
                <Sparkles size={16} className="mr-2" />
                {t('admin.common.upgrade')}
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  // Less than 24 hours left
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4"
    >
      <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300">
        <Clock className="h-5 w-5 text-purple-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">
              {t('admin.trial.endsIn')} {hoursLeft < 24 ? `${hoursLeft} ${t('admin.trial.hours')}` : `${daysLeft} ${t('admin.trial.days')}`}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {t('admin.trial.dontLose')}
            </p>
          </div>
          <Link to={createPageUrl('PricingPlans')}>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 ml-4">
              <Crown size={16} className="mr-2" />
              {t('admin.tierGate.upgradeNow')}
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}