import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Zap, Shield, Crown, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";


export default function BoostProfileButton({ userProfile, onBoostSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [error, setError] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);

  // Allow boosting if EITHER photo OR ID is verified
  const isVerified = userProfile?.verification_status?.id_verified || 
                     userProfile?.verification_status?.photo_verified;
  
  const hasActiveBoost = userProfile?.profile_boost_active && 
                         userProfile?.boost_expires_at && 
                         new Date(userProfile.boost_expires_at) > new Date();

  const handleBoost = async () => {
    if (!isVerified) {
      setError('You must be verified to boost your profile. Complete ID and photo verification first.');
      return;
    }

    setIsBoosting(true);
    setError('');

    try {
      const response = await base44.functions.invoke('boostProfile');
      
      if (response.data.success) {
        alert('🚀 Profile Boosted! Your profile will be shown to more people for 24 hours.');
        setShowDialog(false);
        if (onBoostSuccess) onBoostSuccess();
      } else if (response.data.error) {
        if (response.data.limit_reached) {
          setShowPaywall(true); // Trigger paywall
        } else {
          setError(response.data.error);
        }
      }
    } catch (err) {
      console.error('Boost failed:', err);
      if (err.response?.data?.limit_reached) {
         setShowPaywall(true);
      } else {
         setError(err.response?.data?.error || 'Failed to boost profile. Please try again.');
      }
    } finally {
      setIsBoosting(false);
    }
  };

  const handlePurchaseBoost = () => {
    alert('Payment will be available via in-app purchases.');
  };

  // Calculate time remaining for active boost
  const getTimeRemaining = () => {
    if (!hasActiveBoost) return null;
    const now = new Date();
    const expires = new Date(userProfile.boost_expires_at);
    const hoursLeft = Math.floor((expires - now) / (1000 * 60 * 60));
    const minutesLeft = Math.floor(((expires - now) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hoursLeft}h ${minutesLeft}m`;
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant={hasActiveBoost ? "outline" : "default"}
        className={hasActiveBoost ? "border-purple-600 text-purple-600" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"}
        size="lg"
      >
        <Zap size={20} className={hasActiveBoost ? "fill-purple-600" : "fill-white"} />
        <span className="ml-2">
          {hasActiveBoost ? `Boosted (${getTimeRemaining()})` : 'Boost Profile'}
        </span>
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Zap size={28} className="text-purple-600" />
              Boost Your Profile
            </DialogTitle>
            <DialogDescription>
              Get up to 10x more views for 24 hours
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Verification Check */}
            {!isVerified && (
              <Alert className="bg-red-50 border-red-300">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-900">
                  <strong>Verification Required</strong><br />
                  You must be verified to boost. Please complete photo verification to unlock this feature.
                </AlertDescription>
              </Alert>
            )}

            {/* Active Boost */}
            {hasActiveBoost && (
              <Alert className="bg-purple-50 border-purple-300">
                <Clock className="h-5 w-5 text-purple-600" />
                <AlertDescription className="text-purple-900">
                  <strong>Boost Active</strong><br />
                  Your profile is currently boosted for {getTimeRemaining()} more.
                </AlertDescription>
              </Alert>
            )}

            {showPaywall ? (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-amber-900">Out of Boosts?</h3>
                  <p className="text-sm text-amber-700">You've used all your boosts for this month.</p>
                  <p className="text-base font-medium text-amber-800 mt-2">Get an instant 24h boost for just $5!</p>
                </div>
                
                <div className="space-y-3">
                    <Button 
                        onClick={handlePurchaseBoost} 
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold"
                    >
                        Purchase Boost - $5.00
                    </Button>
                    <p className="text-xs text-center text-amber-700">In-App Purchase</p>
                </div>
                
                <div className="text-center mt-3">
                   <Button variant="ghost" size="sm" onClick={() => setShowPaywall(false)} className="text-amber-700 hover:text-amber-900 hover:bg-amber-100">
                     Back
                   </Button>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <Alert className="bg-red-50 border-red-300">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <AlertDescription className="text-red-900">{error}</AlertDescription>
                  </Alert>
                )}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-gray-900">Boost Benefits:</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="text-green-600 mt-0.5" />
                  <p className="text-sm text-gray-700">Your profile appears first in discovery</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="text-green-600 mt-0.5" />
                  <p className="text-sm text-gray-700">Up to 10x more profile views</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="text-green-600 mt-0.5" />
                  <p className="text-sm text-gray-700">Shown to users in your area first</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={18} className="text-green-600 mt-0.5" />
                  <p className="text-sm text-gray-700">Active for 24 hours</p>
                </div>
              </div>
            </div>

            {/* Tier-based limits */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <strong>Your Plan:</strong>{' '}
                <Badge className={
                  userProfile?.subscription_tier === 'vip' ? 'bg-gradient-to-r from-purple-600 to-pink-600' :
                  userProfile?.subscription_tier === 'elite' ? 'bg-gradient-to-r from-amber-600 to-orange-600' :
                  userProfile?.subscription_tier === 'premium' ? 'bg-blue-600' :
                  'bg-gray-600'
                }>
                  {userProfile?.subscription_tier === 'vip' && <Crown size={12} className="mr-1" />}
                  {(userProfile?.subscription_tier || 'free').toUpperCase()}
                </Badge>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {userProfile?.subscription_tier === 'vip' ? '∞ Unlimited boosts per month' :
                 userProfile?.subscription_tier === 'elite' ? '10 boosts per month' :
                 userProfile?.subscription_tier === 'premium' ? '5 boosts per month' :
                 '1 boost per month (upgrade for more!)'}
              </p>
            </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBoost}
                    disabled={isBoosting || hasActiveBoost || !isVerified}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isBoosting ? 'Boosting...' : hasActiveBoost ? 'Already Boosted' : 'Boost Now'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}