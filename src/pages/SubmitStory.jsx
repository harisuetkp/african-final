import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Heart, Upload, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function SubmitStory() {
  const [myProfile, setMyProfile] = useState(null);
  const [storyText, setStoryText] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('dating');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) setMyProfile(profiles[0]);
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      }
    };
    fetchProfile();
  }, []);

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const submitStoryMutation = useMutation({
    mutationFn: async () => {
      let photoUrl = null;
      if (photo) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });
        photoUrl = file_url;
      }

      await base44.entities.SuccessStory.create({
        user1_profile_id: myProfile.id,
        story_text: storyText,
        relationship_status: relationshipStatus,
        match_date: matchDate || new Date().toISOString(),
        couple_photo_url: photoUrl,
        is_approved: false,
        is_featured: false,
        likes_count: 0
      });
    },
    onSuccess: () => {
      setSubmitted(true);
    }
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50/30 to-amber-50/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
              <Heart size={40} className="text-pink-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              Your success story has been submitted and is under review. We'll notify you once it's approved!
            </p>
            <Link to={createPageUrl('SuccessStories')}>
              <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                View Success Stories
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50/30 to-amber-50/20 pb-24">
      <header className="bg-white/80 backdrop-blur-lg border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={createPageUrl('SuccessStories')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="font-bold text-lg">Share Your Story</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Tell Your Love Story</h2>
              <p className="text-gray-600 text-sm">
                Inspire others by sharing how you found love on Afrinnect 💕
              </p>
            </div>

            <div className="space-y-4">
              {/* Photo Upload */}
              <div>
                <Label htmlFor="photo">Couple Photo (Optional)</Label>
                <div className="mt-2">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setPhoto(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute top-2 right-2"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <Upload size={40} className="text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Click to upload a photo</p>
                      <input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Story Text */}
              <div>
                <Label htmlFor="story">Your Story *</Label>
                <Textarea
                  id="story"
                  placeholder="Tell us about your journey... How did you meet? What makes your relationship special?"
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  rows={6}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {storyText.length}/500 characters
                </p>
              </div>

              {/* Match Date */}
              <div>
                <Label htmlFor="matchDate">When Did You Match?</Label>
                <Input
                  id="matchDate"
                  type="month"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="mt-2"
                />
              </div>

              {/* Relationship Status */}
              <div>
                <Label htmlFor="status">Relationship Status *</Label>
                <Select value={relationshipStatus} onValueChange={setRelationshipStatus}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dating">❤️ Dating</SelectItem>
                    <SelectItem value="engaged">💎 Engaged</SelectItem>
                    <SelectItem value="married">💍 Married</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button
                onClick={() => submitStoryMutation.mutate()}
                disabled={!myProfile || !storyText.trim() || storyText.length < 50 || submitStoryMutation.isPending}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                size="lg"
              >
                {submitStoryMutation.isPending ? (
                  <>
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Heart size={20} className="mr-2" />
                    Share Your Story
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Stories are reviewed before being published to ensure quality and authenticity.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}