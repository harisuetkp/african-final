import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown, Calendar, Sparkles, ArrowRight, Gift, Clock, Heart, Eye, Zap, Check, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, differenceInDays } from 'date-fns';

export default function FoundingMemberStatus({ profile }) {
  if (!profile?.is_founding_member) return null;

  const trialEndsAt = profile.founding_member_trial_ends_at 
    ? new Date(profile.founding_member_trial_ends_at) 
    : null;
  const grantedAt = profile.founding_member_granted_at
    ? new Date(profile.founding_member_granted_at)
    : null;

  const now = new Date();
  const isTrialActive = trialEndsAt && trialEndsAt > now;
  const daysRemaining = trialEndsAt ? differenceInDays(trialEndsAt, now) : 0;
  const totalTrialDays = grantedAt && trialEndsAt 
    ? differenceInDays(trialEndsAt, grantedAt) 
    : 183;
  const progressPercent = totalTrialDays > 0 
    ? Math.max(0, Math.min(100, ((totalTrialDays - daysRemaining) / totalTrialDays) * 100))
    : 0;

  const benefits = [
    { icon: Heart, text: 'Unlimited likes', color: 'text-pink-500' },
    { icon: Eye, text: 'See who likes you', color: 'text-purple-500' },
    { icon: Zap, text: '5 Super Likes/day', color: 'text-amber-500' },
    { icon: Sparkles, text: 'Advanced filters', color: 'text-blue-500' },
    { icon: Check, text: 'Read receipts', color: 'text-green-500' },
    { icon: Star, text: 'Monthly boost', color: 'text-orange-500' }
  ];

  return (
    <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50 overflow-hidden shadow-lg">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-6 py-5">
        <div className="flex items-center gap-4 text-white">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur">
            <Crown size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xl">Founding Member</h3>
              <Badge className="bg-white/20 text-white text-xs">VIP</Badge>
            </div>
            <p className="text-sm text-white/90">You're one of our first 1,000 members! 🎉</p>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-5">
        {/* Free Premium Banner */}
        {isTrialActive && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Gift className="text-green-600" size={20} />
              <span className="text-green-800 font-bold text-lg">100% FREE Premium</span>
            </div>
            <p className="text-sm text-green-700">
              You won't be charged anything. Enjoy all premium features!
            </p>
          </div>
        )}

        {/* Trial Status */}
        {isTrialActive ? (
          <div className="space-y-3 bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Premium Access</span>
              <Badge className="bg-green-100 text-green-800">
                <Check size={12} className="mr-1" />
                Active
              </Badge>
            </div>
            
            <Progress value={progressPercent} className="h-2.5" />
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">
                {daysRemaining} days remaining
              </span>
              <span className="text-amber-600 font-semibold">
                Until {format(trialEndsAt, 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-800">
              <Clock size={18} />
              <span className="font-medium">Founding Period Ended</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              Your founding member benefits have expired. Subscribe to continue with Premium!
            </p>
          </div>
        )}

        {/* Benefits Grid */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            Your Founding Benefits
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {benefits.map((benefit, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2.5 shadow-sm"
              >
                <benefit.icon size={16} className={benefit.color} />
                <span className="text-sm text-gray-700 font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Reminder */}
        {isTrialActive && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <Star size={16} className="text-amber-500" />
              Stay Active for Best Results!
            </h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Active members get 3x more matches</li>
              <li>• Check back daily for new profiles</li>
              <li>• Your profile visibility increases with activity</li>
            </ul>
          </div>
        )}

        {/* Source Info */}
        <div className="text-xs text-gray-500 pt-3 border-t border-gray-100">
          <p>
            <span className="font-medium">Joined:</span> {grantedAt ? format(grantedAt, 'MMMM d, yyyy') : 'N/A'}
            {profile.founding_member_source && (
              <span className="ml-2">
                • {profile.founding_member_source === 'invite_code' 
                  ? `Invite code: ${profile.founding_member_code_used || ''}` 
                  : profile.founding_member_source === 'global_toggle' 
                    ? 'Early adopter bonus'
                    : profile.founding_member_source.replace('_', ' ')}
              </span>
            )}
          </p>
        </div>

        {/* CTA */}
        {!isTrialActive && (
          <Link to={createPageUrl('PricingPlans')}>
            <Button className="w-full py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md">
              Subscribe to Keep Premium
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        )}

        {isTrialActive && daysRemaining <= 14 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-800">
              <strong>Heads up!</strong> Your founding period ends soon. Subscribe now to keep all your premium benefits!
            </p>
            <Link to={createPageUrl('PricingPlans')}>
              <Button variant="outline" size="sm" className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100">
                View Plans
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}