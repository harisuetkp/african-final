import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Shield, Ban, Eye, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function FakeProfileScanner() {
  const [scanning, setScanning] = useState(false);
  const queryClient = useQueryClient();

  const { data: detections = [] } = useQuery({
    queryKey: ['fake-profile-detections'],
    queryFn: () => base44.entities.FakeProfileDetection.filter({}, '-risk_score', 100)
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['all-profiles-scan'],
    queryFn: () => base44.entities.UserProfile.filter({}, '-created_date', 1000)
  });

  const scanProfileMutation = useMutation({
    mutationFn: async (profileId) => {
      const profile = profiles.find(p => p.id === profileId);
      if (!profile) return;

      const riskFactors = [];
      let riskScore = 0;

      // Check for suspicious patterns
      if (!profile.photos || profile.photos.length === 0) {
        riskFactors.push('No profile photos');
        riskScore += 25;
      }

      if (!profile.bio || profile.bio.length < 20) {
        riskFactors.push('Minimal or no bio');
        riskScore += 15;
      }

      if (!profile.verification_status?.photo_verified) {
        riskFactors.push('Not photo verified');
        riskScore += 20;
      }

      if (!profile.verification_status?.phone_verified) {
        riskFactors.push('Not phone verified');
        riskScore += 15;
      }

      // AI analysis
      const aiAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this dating profile for signs of being fake or a scammer. Profile: Name: ${profile.display_name}, Bio: ${profile.bio || 'None'}, Photos: ${profile.photos?.length || 0}, Location: ${profile.current_city}, ${profile.current_country}. Return JSON with is_suspicious (boolean), confidence (0-100), and reasons (array of strings).`,
        response_json_schema: {
          type: "object",
          properties: {
            is_suspicious: { type: "boolean" },
            confidence: { type: "number" },
            reasons: { type: "array", items: { type: "string" } }
          }
        }
      });

      if (aiAnalysis.is_suspicious) {
        riskScore += aiAnalysis.confidence * 0.25;
        riskFactors.push(...aiAnalysis.reasons);
      }

      riskScore = Math.min(riskScore, 100);

      let status = 'safe';
      if (riskScore >= 70) status = 'flagged';
      else if (riskScore >= 40) status = 'suspicious';

      // Create or update detection record
      await base44.entities.FakeProfileDetection.create({
        user_profile_id: profileId,
        risk_score: Math.round(riskScore),
        risk_factors: riskFactors,
        ai_analysis: aiAnalysis,
        status,
        reviewed_by_human: false,
        last_checked: new Date().toISOString()
      });

      return { profileId, riskScore, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fake-profile-detections']);
    }
  });

  const banProfileMutation = useMutation({
    mutationFn: async ({ profileId, detectionId }) => {
      await base44.entities.UserProfile.update(profileId, {
        is_banned: true,
        is_active: false,
        ban_reason: 'Flagged as fake/suspicious profile by admin'
      });

      if (detectionId) {
        await base44.entities.FakeProfileDetection.update(detectionId, {
          status: 'banned',
          reviewed_by_human: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fake-profile-detections']);
      queryClient.invalidateQueries(['all-profiles-scan']);
    }
  });

  const scanAllProfiles = async () => {
    setScanning(true);
    for (const profile of profiles.slice(0, 50)) {
      await scanProfileMutation.mutateAsync(profile.id);
    }
    setScanning(false);
  };

  const suspiciousProfiles = detections.filter(d => d.status === 'suspicious' || d.status === 'flagged');
  const bannedProfiles = detections.filter(d => d.status === 'banned');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fake Profile Detection</h2>
          <p className="text-gray-600">AI-powered scam detection system</p>
        </div>
        <Button
          onClick={scanAllProfiles}
          disabled={scanning}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <RefreshCw size={18} className={`mr-2 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Scan All Profiles'}
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Shield size={32} className="mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold">{detections.filter(d => d.status === 'safe').length}</p>
            <p className="text-sm text-gray-600">Safe Profiles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle size={32} className="mx-auto text-yellow-600 mb-2" />
            <p className="text-2xl font-bold">{detections.filter(d => d.status === 'suspicious').length}</p>
            <p className="text-sm text-gray-600">Suspicious</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Ban size={32} className="mx-auto text-red-600 mb-2" />
            <p className="text-2xl font-bold">{detections.filter(d => d.status === 'flagged').length}</p>
            <p className="text-sm text-gray-600">Flagged</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Ban size={32} className="mx-auto text-gray-600 mb-2" />
            <p className="text-2xl font-bold">{bannedProfiles.length}</p>
            <p className="text-sm text-gray-600">Banned</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suspicious Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          {suspiciousProfiles.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No suspicious profiles detected</p>
          ) : (
            <div className="space-y-4">
              {suspiciousProfiles.map(detection => {
                const profile = profiles.find(p => p.id === detection.user_profile_id);
                if (!profile) return null;

                return (
                  <div key={detection.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Avatar>
                      <AvatarImage src={profile.primary_photo || profile.photos?.[0]} />
                      <AvatarFallback>{profile.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{profile.display_name}</h4>
                        <Badge className={detection.risk_score >= 70 ? 'bg-red-600' : 'bg-yellow-600'}>
                          Risk: {detection.risk_score}%
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {profile.current_city}, {profile.current_country}
                      </p>
                      <Progress value={detection.risk_score} className="h-2 mb-2" />
                      <div className="flex flex-wrap gap-1">
                        {detection.risk_factors?.slice(0, 3).map((factor, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye size={16} className="mr-1" />
                        Review
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => banProfileMutation.mutate({ profileId: profile.id, detectionId: detection.id })}
                        disabled={banProfileMutation.isPending}
                      >
                        <Ban size={16} className="mr-1" />
                        Ban
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}