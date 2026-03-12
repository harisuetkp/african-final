import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TIER_HIERARCHY = {
  free: 0,
  premium: 1,
  elite: 2,
  vip: 3
};

const TIER_NAMES = {
  premium: 'Premium',
  elite: 'Elite',
  vip: 'VIP Matchmaker'
};

export default function TierGate({ 
  currentTier = 'free', 
  requiredTier, 
  children, 
  showUpgrade = true,
  fallback = null
}) {
  const [showDialog, setShowDialog] = React.useState(false);
  
  const hasAccess = TIER_HIERARCHY[currentTier] >= TIER_HIERARCHY[requiredTier];

  if (hasAccess) {
    return children;
  }

  if (!showUpgrade) {
    return fallback;
  }

  return (
    <>
      <div className="relative">
        <div className="opacity-50 pointer-events-none blur-sm">
          {fallback || children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            onClick={() => setShowDialog(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 shadow-xl"
          >
            <Crown size={16} className="mr-2" />
            Upgrade to {TIER_NAMES[requiredTier]}
          </Button>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock size={20} className="text-amber-500" />
              {TIER_NAMES[requiredTier]} Feature
            </DialogTitle>
            <DialogDescription>
              This feature requires {TIER_NAMES[requiredTier]} subscription or higher.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Link to={createPageUrl('PricingPlans')}>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700">
                View Plans & Upgrade
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}