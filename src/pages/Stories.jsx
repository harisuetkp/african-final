import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Plus, X, Camera, ImagePlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { Input } from '@/components/ui/input';
import StoryRing from '@/components/stories/StoryRing';
import StoryViewer from '@/components/stories/StoryViewer';

export default function Stories() {
  const [myProfile, setMyProfile] = useState(null);
  const [storyGroups, setStoryGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState('');
  
  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) {
          setMyProfile(profiles[0]);
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    };
    loadProfile();
  }, []);

  // Load stories - Only from matches (like Tinder/Bumble)
  const loadStories = useCallback(async () => {
    if (!myProfile) return;
    setIsLoading(true);

    try {
      // First, get all my matches to know whose stories I can see
      const matches = await base44.entities.Match.filter({
        $or: [
          { user1_id: myProfile.id, is_match: true, status: 'active' },
          { user2_id: myProfile.id, is_match: true, status: 'active' }
        ]
      });

      // Get matched profile IDs
      const matchedProfileIds = matches.map(m => 
        m.user1_id === myProfile.id ? m.user2_id : m.user1_id
      );

      // Always include my own profile
      const allowedProfileIds = [myProfile.id, ...matchedProfileIds];

      // Get all non-expired stories
      const allStories = await base44.entities.Story.filter(
        { is_expired: false },
        '-created_date',
        100
      );

      // Filter: only from matches + my own, and not expired
      const now = new Date();
      const validStories = allStories.filter(story => {
        if (!allowedProfileIds.includes(story.user_profile_id)) return false;
        if (!story.expires_at) return true;
        return new Date(story.expires_at) > now;
      });

      if (validStories.length === 0) {
        setStoryGroups([]);
        setIsLoading(false);
        return;
      }

      // Get unique profile IDs
      const profileIds = [...new Set(validStories.map(s => s.user_profile_id).filter(Boolean))];

      // Batch fetch profiles
      const profileMap = {};
      for (const pid of profileIds) {
        try {
          const profs = await base44.entities.UserProfile.filter({ id: pid });
          if (profs.length > 0) profileMap[pid] = profs[0];
        } catch (e) { /* skip */ }
      }

      // Group stories by user
      const grouped = {};
      validStories.forEach(story => {
        const profile = profileMap[story.user_profile_id];
        if (!profile) return;

        if (!grouped[story.user_profile_id]) {
          grouped[story.user_profile_id] = {
            id: story.user_profile_id,
            profile,
            stories: []
          };
        }
        grouped[story.user_profile_id].stories.push({
          ...story,
          user_profile: profile
        });
      });

      // Convert to array and sort
      let groupsArray = Object.values(grouped);
      
      // Sort: My story first, then unviewed, then by recency
      groupsArray.sort((a, b) => {
        if (a.id === myProfile.id) return -1;
        if (b.id === myProfile.id) return 1;
        
        const aViewed = a.stories.every(s => s.views?.includes(myProfile.id));
        const bViewed = b.stories.every(s => s.views?.includes(myProfile.id));
        if (aViewed !== bViewed) return aViewed ? 1 : -1;
        
        return new Date(b.stories[0]?.created_date) - new Date(a.stories[0]?.created_date);
      });

      setStoryGroups(groupsArray);
    } catch (error) {
      console.error('Failed to load stories:', error);
      toast.error('Failed to load stories');
    }

    setIsLoading(false);
  }, [myProfile]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  // Upload handler
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !myProfile) return;

    setIsUploading(true);
    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Create story
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      await base44.entities.Story.create({
        user_profile_id: myProfile.id,
        media_url: file_url,
        media_type: file.type.startsWith('video/') ? 'video' : 'photo',
        caption: caption || '',
        expires_at: expiresAt,
        is_expired: false,
        views: []
      });

      toast.success('Story posted!');
      setCaption('');
      setUploadingStory(false);
      loadStories();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to post story');
    }
    setIsUploading(false);
  };

  // Open story viewer
  const openStoryViewer = (groupIndex) => {
    setActiveGroupIndex(groupIndex);
    setActiveStoryIndex(0);
    setViewerOpen(true);
  };

  // Navigation handlers
  const handleNext = () => {
    const currentGroup = storyGroups[activeGroupIndex];
    if (!currentGroup) return;

    if (activeStoryIndex < currentGroup.stories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
    } else if (activeGroupIndex < storyGroups.length - 1) {
      setActiveGroupIndex(prev => prev + 1);
      setActiveStoryIndex(0);
    } else {
      setViewerOpen(false);
    }
  };

  const handlePrev = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
    } else if (activeGroupIndex > 0) {
      const prevGroup = storyGroups[activeGroupIndex - 1];
      setActiveGroupIndex(prev => prev - 1);
      setActiveStoryIndex(prevGroup.stories.length - 1);
    }
  };

  const handleClose = () => {
    setViewerOpen(false);
    loadStories(); // Refresh to update view counts
  };

  // Get current stories for viewer
  const currentStories = storyGroups[activeGroupIndex]?.stories || [];
  const myGroup = storyGroups.find(g => g.id === myProfile?.id);
  const otherGroups = storyGroups.filter(g => g.id !== myProfile?.id);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black border-b border-gray-800 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft size={22} />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-white">Stories</h1>
          </div>
          <Button 
            onClick={() => setUploadingStory(true)}
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <Camera size={22} />
          </Button>
        </div>
      </header>

      <main className="px-4 py-6">
        {isLoading ? (
          /* Loading skeleton */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-gray-800 animate-pulse" />
                <div className="w-14 h-2 bg-gray-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Story Rings - Horizontal scroll */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {/* My Story */}
              {myProfile && (
                <StoryRing
                  profile={myProfile}
                  hasStory={!!myGroup}
                  isViewed={false}
                  storyCount={myGroup?.stories.length || 0}
                  isOwnProfile
                  onClick={() => {
                    if (myGroup) {
                      const idx = storyGroups.findIndex(g => g.id === myProfile.id);
                      openStoryViewer(idx);
                    } else {
                      setUploadingStory(true);
                    }
                  }}
                />
              )}

              {/* Other users */}
              {otherGroups.map((group) => {
                const isViewed = group.stories.every(s => s.views?.includes(myProfile?.id));
                const idx = storyGroups.findIndex(g => g.id === group.id);
                return (
                  <StoryRing
                    key={group.id}
                    profile={group.profile}
                    hasStory
                    isViewed={isViewed}
                    storyCount={group.stories.length}
                    onClick={() => openStoryViewer(idx)}
                  />
                );
              })}
            </div>

            {/* Empty state */}
            {storyGroups.length === 0 && (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Camera className="text-white" size={40} />
                </div>
                <h2 className="text-white text-xl font-semibold mb-2">No Stories Yet</h2>
                <p className="text-gray-400 mb-6">Only your matches can see your stories</p>
                <Button 
                  onClick={() => setUploadingStory(true)}
                  className="bg-gradient-to-r from-pink-500 to-orange-500 hover:opacity-90"
                >
                  <Plus size={18} className="mr-2" />
                  Add Your Story
                </Button>
              </div>
            )}

            {/* Grid preview */}
            {storyGroups.length > 0 && (
              <div className="mt-6">
                <h3 className="text-gray-400 text-sm font-medium mb-3">Recent</h3>
                <div className="grid grid-cols-3 gap-2">
                  {storyGroups.slice(0, 9).map((group, idx) => (
                    <motion.button
                      key={group.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openStoryViewer(idx)}
                      className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-900"
                    >
                      {group.stories[0]?.media_type === 'video' ? (
                        <video 
                          src={group.stories[0]?.media_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img 
                          src={group.stories[0]?.media_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                        <img 
                          src={group.profile?.primary_photo}
                          alt=""
                          className="w-7 h-7 rounded-full border-2 border-white object-cover"
                        />
                        <span className="text-white text-xs font-medium truncate">
                          {group.id === myProfile?.id ? 'Your story' : group.profile?.display_name?.split(' ')[0]}
                        </span>
                      </div>
                      {group.stories.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black/50 px-2 py-0.5 rounded-full text-white text-xs">
                          {group.stories.length}
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {uploadingStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col safe-top safe-bottom"
          >
            <div className="flex items-center justify-between p-4">
              <button 
                onClick={() => setUploadingStory(false)}
                className="w-10 h-10 flex items-center justify-center"
                disabled={isUploading}
              >
                <X size={24} className="text-white" />
              </button>
              <span className="text-white font-semibold">Add to Story</span>
              <div className="w-10" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-8">
              <label htmlFor="story-file" className="w-full cursor-pointer">
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  className="border-2 border-dashed border-gray-600 rounded-3xl p-16 text-center"
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
                      <p className="text-white">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                        <ImagePlus size={36} className="text-white" />
                      </div>
                      <p className="text-white text-lg font-medium mb-1">Tap to select</p>
                      <p className="text-gray-400 text-sm">Photo or video</p>
                    </>
                  )}
                </motion.div>
              </label>
              <input
                id="story-file"
                type="file"
                accept="image/*,video/*"
                onChange={handleUpload}
                className="hidden"
                disabled={isUploading}
              />

              <div className="w-full mt-6">
                <Input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  disabled={isUploading}
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 rounded-full"
                />
              </div>
            </div>

            <div className="p-6 text-center">
              <p className="text-gray-500 text-xs">Stories disappear after 24 hours</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Viewer */}
      <AnimatePresence>
        {viewerOpen && currentStories.length > 0 && (
          <StoryViewer
            stories={currentStories}
            currentIndex={activeStoryIndex}
            onNext={handleNext}
            onPrev={handlePrev}
            onClose={handleClose}
            myProfileId={myProfile?.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}