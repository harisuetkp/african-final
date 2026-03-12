import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Lock, Star, Check, ArrowRight } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export default function CouplesComparison({ isOpen, onClose }) {
  const [step, setStep] = useState('select_match'); // select_match, payment, results
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) setMyProfile(profiles[0]);
      } catch (e) { console.error(e); }
    };
    fetchMe();
  }, []);

  const { data: matches, isLoading: loadingMatches } = useQuery({
    queryKey: ['my-matches'],
    queryFn: async () => {
      if (!myProfile) return [];
      const matches1 = await base44.entities.Match.filter({ user1_id: myProfile.id });
      const matches2 = await base44.entities.Match.filter({ user2_id: myProfile.id });
      const allMatches = [...matches1, ...matches2];
      
      // Enhance with profile data
      const enhancedMatches = await Promise.all(allMatches.map(async (match) => {
        const otherId = match.user1_id === myProfile.id ? match.user2_id : match.user1_id;
        const otherProfiles = await base44.entities.UserProfile.filter({ id: otherId });
        return { ...match, otherProfile: otherProfiles[0] };
      }));
      
      return enhancedMatches.filter(m => m.otherProfile);
    },
    enabled: !!myProfile
  });

  const handleMatchSelect = async (match) => {
    setSelectedMatch(match);
    setStep('payment');
  };

  const handlePaymentSuccess = async () => {
    setStep('analyzing');
    // Simulate AI analysis or call backend
    setTimeout(async () => {
      // Generate mock comparison for now (or use backend function)
      const result = {
        score: 85,
        strengths: ["Communication Style", "Future Goals"],
        challenges: ["Spending Habits"],
        summary: "You and " + selectedMatch.otherProfile.display_name + " have a strong foundation. Your shared values in long-term goals align perfectly."
      };
      setComparisonResult(result);
      setStep('results');
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle>Couples Comparison</DialogTitle>
        </DialogHeader>

        {step === 'select_match' && (
          <div className="space-y-4">
            <p className="text-gray-600">Select a match to compare compatibility with:</p>
            {loadingMatches ? (
              <Loader2 className="animate-spin mx-auto text-purple-600" />
            ) : matches?.length > 0 ? (
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {matches.map(match => (
                  <div 
                    key={match.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-purple-50 cursor-pointer transition-colors"
                    onClick={() => handleMatchSelect(match)}
                  >
                    <Avatar>
                      <AvatarImage src={match.otherProfile.primary_photo} />
                      <AvatarFallback>{match.otherProfile.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{match.otherProfile.display_name}</p>
                    </div>
                    <ArrowRight size={16} className="text-gray-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No matches found yet. Keep swiping!</p>
            )}
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
             <div className="bg-purple-50 p-4 rounded-lg flex items-center gap-3 mb-4">
               <Star className="text-amber-500 fill-amber-500" />
               <div>
                 <p className="font-bold text-purple-900">Unlock Compatibility Report</p>
                 <p className="text-xs text-purple-700">Deep insights for just $2.00</p>
               </div>
             </div>
             
             <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 mb-2"
                onClick={() => {
                  alert('Payment will be available via in-app purchases.');
                }}
             >
                Proceed to Payment ($2.00)
             </Button>

             <Button variant="ghost" onClick={() => setStep('select_match')} className="w-full mt-2">Back</Button>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold animate-pulse">Analyzing compatibility...</p>
          </div>
        )}

        {step === 'results' && comparisonResult && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-purple-600 bg-purple-50 mb-2">
                <span className="text-3xl font-bold text-purple-700">{comparisonResult.score}%</span>
              </div>
              <p className="font-medium text-gray-900">Compatibility Score</p>
            </div>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <Check size={16} /> Strengths
                </p>
                <ul className="list-disc list-inside text-sm text-green-700">
                  {comparisonResult.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </CardContent>
            </Card>
            
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
              {comparisonResult.summary}
            </p>

            <Button onClick={onClose} className="w-full bg-purple-600 hover:bg-purple-700">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}