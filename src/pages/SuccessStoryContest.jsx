import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Trophy, Upload, Camera, ThumbsUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SuccessStoryContest() {
  const [myProfile, setMyProfile] = useState(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyText, setStoryText] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = await base44.auth.me();
      if (user) {
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) setMyProfile(profiles[0]);
      }
    };
    fetchProfile();
  }, []);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: stories = [] } = useQuery({
    queryKey: ['success-stories', currentMonth],
    queryFn: () => base44.entities.SuccessStoryContest.filter(
      { contest_month: currentMonth, status: { $in: ['approved', 'winner'] } },
      '-votes'
    )
  });

  const { data: contestConfig } = useQuery({
    queryKey: ['contest-config', currentMonth],
    queryFn: async () => {
      const configs = await base44.entities.ContestPeriod.filter({ month: currentMonth });
      return configs[0] || null;
    }
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.SuccessStoryContest.create({
        user1_id: myProfile.id,
        story_title: storyTitle,
        story_text: storyText,
        photos: uploadedPhotos,
        contest_month: currentMonth,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['success-stories']);
      setShowSubmitDialog(false);
      setStoryTitle('');
      setStoryText('');
      setUploadedPhotos([]);
    }
  });

  const voteMutation = useMutation({
    mutationFn: async (storyId) => {
      const story = stories.find(s => s.id === storyId);
      return base44.entities.SuccessStoryContest.update(storyId, {
        votes: (story.votes || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['success-stories']);
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedPhotos([...uploadedPhotos, file_url]);
    }
  };

  const winner = stories.find(s => s.status === 'winner');
  const contestants = stories.filter(s => s.status === 'approved');

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-24">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('SuccessStories')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={24} />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Success Story Contest</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Hero Banner */}
        <Card className="mb-6 bg-gradient-to-br from-pink-600 to-purple-600 border-0 text-white">
          <CardContent className="p-6 text-center">
            <Trophy size={48} className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {contestConfig?.theme ? `${contestConfig.theme} - ` : ''} 
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Contest
            </h2>
            <p className="text-white/90 mb-4">Share your love story and win amazing prizes!</p>
            {contestConfig ? (
              <div className="flex justify-center gap-4 text-sm">
                <div>
                  <p className="font-bold text-2xl">{contestConfig.prizes?.first || '$500'}</p>
                  <p>1st Prize</p>
                </div>
                <div>
                  <p className="font-bold text-2xl">{contestConfig.prizes?.second || '$250'}</p>
                  <p>2nd Prize</p>
                </div>
                <div>
                  <p className="font-bold text-2xl">{contestConfig.prizes?.third || '$100'}</p>
                  <p>3rd Prize</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center gap-4 text-sm">
                <div>
                  <p className="font-bold text-2xl">$500</p>
                  <p>1st Prize</p>
                </div>
                <div>
                  <p className="font-bold text-2xl">$250</p>
                  <p>2nd Prize</p>
                </div>
                <div>
                  <p className="font-bold text-2xl">$100</p>
                  <p>3rd Prize</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Story CTA */}
        <Card className="mb-6 border-purple-200 bg-purple-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-purple-900">Have an amazing love story?</p>
              <p className="text-sm text-purple-700">Share it and compete for prizes!</p>
            </div>
            <Button onClick={() => setShowSubmitDialog(true)} className="bg-purple-600">
              Submit Story
            </Button>
          </CardContent>
        </Card>

        {/* Winner */}
        {winner && (
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Trophy className="text-amber-500" />
              This Month's Winner
            </h3>
            <Card className="border-amber-400 bg-amber-50">
              <CardContent className="p-6">
                <Badge className="mb-3 bg-amber-500">Winner - {winner.prize_awarded}</Badge>
                {winner.photos?.[0] && (
                  <img src={winner.photos[0]} className="w-full h-64 object-cover rounded-lg mb-4" />
                )}
                <h4 className="text-xl font-bold mb-2">{winner.story_title}</h4>
                <p className="text-gray-700 mb-3">{winner.story_text}</p>
                <div className="flex items-center gap-2 text-gray-600">
                  <Heart size={18} className="text-red-500" />
                  <span>{winner.votes || 0} votes</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contestants */}
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-3">Contest Entries</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {contestants.map(story => (
              <Card key={story.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {story.photos?.[0] && (
                    <img src={story.photos[0]} className="w-full h-40 object-cover rounded-lg mb-3" />
                  )}
                  <h4 className="font-bold mb-2">{story.story_title}</h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">{story.story_text}</p>
                  <Button
                    onClick={() => voteMutation.mutate(story.id)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <ThumbsUp size={16} className="mr-2" />
                    Vote ({story.votes || 0})
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Your Love Story</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Story Title</label>
              <Input
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                placeholder="How we met on Afrinnect..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Your Story</label>
              <Textarea
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="Share your beautiful love story..."
                rows={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Photos</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {uploadedPhotos.map((url, idx) => (
                  <img key={idx} src={url} className="w-20 h-20 object-cover rounded" />
                ))}
              </div>
              <Button variant="outline" className="w-full" onClick={() => document.getElementById('photo-upload').click()}>
                <Camera size={18} className="mr-2" />
                Add Photos
              </Button>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!storyTitle || !storyText || submitMutation.isPending}
              className="w-full bg-purple-600"
            >
              Submit Story
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}