import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, MapPin, Calendar, DollarSign, Sparkles, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SafetyCheckSetup from '@/components/safety/SafetyCheckSetup';

export default function DatePlanner() {
  const [myProfile, setMyProfile] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [existingPlan, setExistingPlan] = useState(null);
  const [matchProfile, setMatchProfile] = useState(null);
  
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('matchId');
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;

        // 1. Get My Profile
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length === 0) return;
        setMyProfile(profiles[0]);
        const myId = profiles[0].id;

        // 2. Get Match Details & Profile
        const matches = await base44.entities.Match.filter({ id: matchId });
        if (matches.length > 0) {
            const match = matches[0];
            const otherId = match.user1_id === myId ? match.user2_id : match.user1_id;
            const otherProfiles = await base44.entities.UserProfile.filter({ id: otherId });
            if (otherProfiles.length > 0) setMatchProfile(otherProfiles[0]);
        }

        // 3. Get Active Date Plans
        const plans = await base44.entities.DatePlan.filter({ 
            match_id: matchId,
            status: { $in: ['proposed', 'accepted'] }
        });
        
        // Sort by created date desc
        plans.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        
        if (plans.length > 0) {
            setExistingPlan(plans[0]);
        }
      } catch (e) {
        console.error("Error fetching data", e);
      }
    };
    fetchData();
  }, [matchId]);

  const respondMutation = useMutation({
    mutationFn: async ({ status }) => {
        await base44.functions.invoke('respondToDate', {
            datePlanId: existingPlan.id,
            response: status
        });
    },
    onSuccess: () => {
        alert("Response sent!");
        window.location.reload();
    }
  });

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest 3 date ideas in ${myProfile.current_city}, ${myProfile.current_country} for a culturally-minded couple. Include venue name, type, estimated budget, and why it's good for a first date.

Return JSON array:
[
  {
    "venue_name": "African Art Museum",
    "venue_address": "123 Main St",
    "date_type": "cultural_event",
    "budget_estimate": 30,
    "description": "Great conversation starter"
  }
]`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  venue_name: { type: "string" },
                  venue_address: { type: "string" },
                  date_type: { type: "string" },
                  budget_estimate: { type: "number" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });
      setSuggestions(result.suggestions || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const suggestDateMutation = useMutation({
    mutationFn: async (suggestion) => {
      const response = await base44.functions.invoke('proposeDate', {
        matchId,
        suggestion
      });
      return response.data;
    },
    onSuccess: () => {
      alert('Date suggestion sent!');
      window.location.reload();
    }
  });

  // Render Logic
  const renderContent = () => {
    // 1. Existing Plan: Accepted
    if (existingPlan?.status === 'accepted') {
        return (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-green-900">It's a Date!</h2>
                    <p className="text-green-800">
                        You and {matchProfile?.display_name} are going to <span className="font-bold">{existingPlan.venue_name}</span>.
                    </p>
                    
                    <div className="bg-white/60 rounded-xl p-4 text-left space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                            <MapPin size={18} className="text-green-600" />
                            {existingPlan.venue_address}
                        </div>
                        {existingPlan.budget_estimate && (
                            <div className="flex items-center gap-2 text-gray-700">
                                <DollarSign size={18} className="text-green-600" />
                                Est. budget: ${existingPlan.budget_estimate}
                            </div>
                        )}
                    </div>

                    <div className="pt-4">
                        <SafetyCheckSetup 
                            myProfile={myProfile} 
                            matchProfile={matchProfile}
                            initialData={{
                                venue_name: existingPlan.venue_name,
                                venue_address: existingPlan.venue_address
                            }}
                        />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // 2. Existing Plan: Proposed (Incoming)
    if (existingPlan?.status === 'proposed' && existingPlan.created_by_profile !== myProfile?.id) {
        return (
            <Card>
                <CardContent className="p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <Calendar size={32} className="text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-2">{matchProfile?.display_name} proposed a date!</h2>
                        <p className="text-gray-600">How does this sound to you?</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 text-left border">
                        <h3 className="font-bold text-lg mb-2">{existingPlan.venue_name}</h3>
                        <p className="text-gray-600 text-sm mb-4">{existingPlan.venue_address}</p>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium capitalize">
                                {existingPlan.date_type?.replace('_', ' ')}
                            </span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                ~${existingPlan.budget_estimate}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button 
                            variant="outline" 
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => respondMutation.mutate({ status: 'declined' })}
                        >
                            <XCircle size={18} className="mr-2" />
                            Decline
                        </Button>
                        <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => respondMutation.mutate({ status: 'accepted' })}
                        >
                            <CheckCircle size={18} className="mr-2" />
                            Accept Date
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // 3. Existing Plan: Proposed (Outgoing)
    if (existingPlan?.status === 'proposed' && existingPlan.created_by_profile === myProfile?.id) {
        return (
            <Card>
                <CardContent className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                        <Clock size={32} className="text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold">Proposal Sent!</h2>
                    <p className="text-gray-600">
                        Waiting for {matchProfile?.display_name} to respond to your date idea at <span className="font-semibold">{existingPlan.venue_name}</span>.
                    </p>
                    <Button variant="outline" disabled className="w-full">
                        Pending Response...
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // 4. No Plan: Create Flow
    return (
      <div className="space-y-6">
        {suggestions.length === 0 ? (
          <Card className="text-center">
            <CardContent className="p-8">
              <Sparkles size={64} className="mx-auto text-purple-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">AI Date Planner</h2>
              <p className="text-gray-600 mb-6">
                Get personalized date suggestions for your area
              </p>
              <Button 
                onClick={generateSuggestions}
                disabled={loading || !myProfile}
                className="bg-purple-600"
              >
                {loading ? 'Finding Ideas...' : 'Get Suggestions'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {suggestions.map((suggestion, idx) => (
              <Card key={idx}>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">{suggestion.venue_name}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} />
                      {suggestion.venue_address}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign size={16} />
                      ~${suggestion.budget_estimate} per person
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">{suggestion.description}</p>
                  <Button 
                    onClick={() => suggestDateMutation.mutate(suggestion)}
                    className="w-full"
                  >
                    Suggest This Date
                  </Button>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 pb-24">
      <header className="bg-white/80 backdrop-blur-lg border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl(`Chat?matchId=${matchId}`)}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="font-bold text-lg">Plan a Date</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {renderContent()}
      </main>
    </div>
  );
}