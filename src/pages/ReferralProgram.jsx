import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Gift, Copy, Share2, Users, Star } from 'lucide-react';
import { toast } from 'sonner';
import AfricanPattern from '@/components/shared/AfricanPattern';

export default function ReferralProgram() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  
  useEffect(() => {
    const init = async () => {
      const u = await base44.auth.me();
      setUser(u);
      
      const referrals = await base44.entities.Referral.filter({ referrer_id: u.id });
      setStats({
        total: referrals.length,
        completed: referrals.filter(r => r.status === 'completed').length,
        pending: referrals.filter(r => r.status === 'pending').length
      });
    };
    init();
  }, []);

  const referralLink = user ? `${window.location.origin}/Landing?ref=${user.id}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Link copied to clipboard!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Afrinnect',
          text: 'Join me on Afrinnect, the best place to connect with African singles worldwide!',
          url: referralLink,
        });
      } catch (err) {
        // Share cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 p-4 pb-24">
      <AfricanPattern className="text-purple-900" opacity={0.03} />
      
      <div className="max-w-md mx-auto space-y-6 relative z-10">
        <header className="text-center space-y-2 mt-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Invite Friends</h1>
          <p className="text-gray-600">Earn 3 days of Premium for every friend who joins!</p>
        </header>

        <Card className="border-purple-200 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Your Unique Link</CardTitle>
            <CardDescription>Share this link to start earning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={referralLink} 
                readOnly 
                className="bg-gray-50 border-gray-200"
              />
              <Button onClick={handleCopy} variant="outline" size="icon">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            <Button onClick={handleShare} className="w-full bg-purple-600 hover:bg-purple-700 gap-2">
              <Share2 className="w-4 h-4" />
              Share Link
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Users className="w-6 h-6 text-blue-500 mb-2" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-gray-500">Friends Invited</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Star className="w-6 h-6 text-amber-500 mb-2" />
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-xs text-gray-500">Rewards Earned</div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="font-semibold text-purple-900 mb-2">How it works</h3>
          <ul className="text-sm text-purple-800 space-y-2 list-disc list-inside">
            <li>Share your unique link with friends</li>
            <li>They sign up and complete their profile</li>
            <li>You automatically get 3 days of Premium access!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}