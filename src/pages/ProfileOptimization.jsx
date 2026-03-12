import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Sparkles, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function ProfileOptimization() {
  const [myProfile, setMyProfile] = useState(null);
  const [aiTips, setAiTips] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) setMyProfile(profiles[0]);
      } catch (e) {}
    };
    fetchProfile();
  }, []);

  const analyzeProfile = async () => {
    setLoading(true);
    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this dating profile and provide specific optimization tips:
        
Profile:
- Name: ${myProfile.display_name}
- Bio: ${myProfile.bio || 'No bio'}
- Photos: ${myProfile.photos?.length || 0}
- Interests: ${myProfile.interests?.join(', ') || 'None'}
- Prompts: ${myProfile.prompts?.length || 0}
- Education: ${myProfile.education || 'Not specified'}
- Profession: ${myProfile.profession || 'Not specified'}

Return analysis in this exact JSON format:
{
  "overall_score": 75,
  "strengths": ["Good photo count", "Clear bio"],
  "improvements": ["Add more interests", "Complete prompts"],
  "specific_tips": ["Try adding 2-3 more photos showing different activities", "Your bio could mention your hobbies"]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            specific_tips: { type: "array", items: { type: "string" } }
          }
        }
      });
      setAiTips(analysis);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 pb-24">
      <header className="bg-white/80 backdrop-blur-lg border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="font-bold text-lg">Profile Optimization</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {!aiTips ? (
          <Card className="text-center">
            <CardContent className="p-8">
              <Sparkles size={64} className="mx-auto text-purple-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">AI Profile Analysis</h2>
              <p className="text-gray-600 mb-6">
                Get personalized tips to improve your profile and get more matches
              </p>
              <Button 
                onClick={analyzeProfile}
                disabled={loading || !myProfile}
                className="bg-purple-600"
              >
                {loading ? 'Analyzing...' : 'Analyze My Profile'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-purple-600 mb-2">
                    {aiTips.overall_score}/100
                  </div>
                  <p className="text-gray-600">Profile Score</p>
                </div>
                <Progress value={aiTips.overall_score} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={20} className="text-green-600" />
                  <h3 className="font-semibold">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {aiTips.strengths?.map((strength, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={20} className="text-amber-600" />
                  <h3 className="font-semibold">Areas to Improve</h3>
                </div>
                <ul className="space-y-2">
                  {aiTips.improvements?.map((improvement, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-amber-600">→</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={20} className="text-purple-600" />
                  <h3 className="font-semibold">Specific Tips</h3>
                </div>
                <ul className="space-y-3">
                  {aiTips.specific_tips?.map((tip, idx) => (
                    <li key={idx} className="p-3 bg-purple-50 rounded-lg text-sm">
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Link to={createPageUrl('EditProfile')}>
              <Button className="w-full">Edit Profile</Button>
            </Link>
          </>
        )}
      </main>
    </div>
  );
}