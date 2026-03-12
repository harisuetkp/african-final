import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Pause, Heart, Send, MoreHorizontal, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const STORY_DURATION = 5000; // 5 seconds per photo

export default function StoryViewer({ stories, currentIndex, onNext, onPrev, onClose, myProfileId }) {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showHeart, setShowHeart] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const lastTapRef = useRef(0);
  const touchStartRef = useRef(null);

  const story = stories[currentIndex];
  const isMyStory = story?.user_profile_id === myProfileId;

  // Mark as viewed
  useEffect(() => {
    if (!story || !myProfileId || isMyStory) return;
    if (story.views?.includes(myProfileId)) return;

    base44.entities.Story.update(story.id, {
      views: [...(story.views || []), myProfileId]
    }).catch(() => {});
  }, [story?.id, myProfileId, isMyStory]);

  // Reset on story change
  useEffect(() => {
    setProgress(0);
    setIsPaused(false);
    setShowMenu(false);
    
    // Reset video
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  // Auto-progress timer
  useEffect(() => {
    if (isPaused || story?.media_type === 'video') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const startTime = Date.now() - (progress / 100) * STORY_DURATION;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / STORY_DURATION) * 100;

      if (newProgress >= 100) {
        clearInterval(timerRef.current);
        onNext();
      } else {
        setProgress(newProgress);
      }
    }, 30);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused, story?.media_type, onNext]);

  // Video handlers
  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current?.duration) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    onNext();
  }, [onNext]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') onNext();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'Escape') onClose();
      else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onNext, onPrev, onClose]);

  // Touch handlers
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
  };

  const handleTouchEnd = (e) => {
    setIsPaused(false);
    const start = touchStartRef.current;
    if (!start) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const dt = Date.now() - start.time;

    // Quick tap
    if (dt < 200 && Math.abs(dx) < 30 && Math.abs(dy) < 30) {
      const now = Date.now();
      const screenW = window.innerWidth;
      
      // Double tap = heart
      if (now - lastTapRef.current < 300) {
        setShowHeart(true);
        if (navigator.vibrate) navigator.vibrate([50, 50]);
        setTimeout(() => setShowHeart(false), 1000);
      } else {
        // Single tap navigation
        if (touch.clientX < screenW * 0.3) onPrev();
        else if (touch.clientX > screenW * 0.7) onNext();
      }
      lastTapRef.current = now;
    }
    // Swipe down to close
    else if (dy > 100 && Math.abs(dx) < 50) {
      onClose();
    }

    touchStartRef.current = null;
  };

  // Delete story
  const handleDelete = async () => {
    if (!confirm('Delete this story?')) return;
    try {
      await base44.entities.Story.delete(story.id);
      toast.success('Story deleted');
      onClose();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  // Time ago
  const timeAgo = (date) => {
    if (!date) return '';
    const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (sec < 60) return 'now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
    return `${Math.floor(sec / 86400)}d`;
  };

  if (!story) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 select-none"
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-30 safe-top">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-75"
              style={{ width: i === currentIndex ? `${progress}%` : i < currentIndex ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 pt-8 z-30 safe-top">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/50">
            <img
              src={story.user_profile?.primary_photo || 'https://via.placeholder.com/80'}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              {story.user_profile?.display_name || 'User'}
            </p>
            <p className="text-white/60 text-xs">{timeAgo(story.created_date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isMyStory && (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
            >
              <MoreHorizontal size={22} className="text-white" />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            <X size={24} className="text-white" />
          </button>
        </div>
      </div>

      {/* Menu dropdown */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 right-4 bg-gray-900 rounded-xl overflow-hidden z-40 safe-top"
          >
            <button
              onClick={handleDelete}
              className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-white/10 w-full"
            >
              <Trash2 size={18} />
              <span>Delete Story</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story content */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
      >
        {story.media_type === 'video' ? (
          <video
            ref={videoRef}
            src={story.media_url}
            autoPlay
            playsInline
            muted={isMuted}
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={handleVideoEnded}
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            src={story.media_url}
            alt=""
            className="w-full h-full object-contain"
            draggable={false}
          />
        )}
      </div>

      {/* Heart animation */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none"
          >
            <Heart size={120} className="text-white fill-white drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause indicator */}
      <AnimatePresence>
        {isPaused && !showHeart && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-black/60 p-5 rounded-full pointer-events-none"
          >
            <Pause size={32} className="text-white" fill="white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Caption */}
      {story.caption && (
        <div className="absolute bottom-28 left-4 right-4 z-30">
          <div className="bg-black/50 backdrop-blur px-4 py-3 rounded-2xl">
            <p className="text-white">{story.caption}</p>
          </div>
        </div>
      )}

      {/* Video mute toggle */}
      {story.media_type === 'video' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          className="absolute top-24 right-4 z-40 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center safe-top"
        >
          {isMuted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
        </button>
      )}

      {/* Desktop nav arrows */}
      <button
        onClick={onPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 hidden md:flex items-center justify-center bg-black/40 rounded-full hover:bg-black/60"
      >
        <ChevronLeft size={28} className="text-white" />
      </button>
      <button
        onClick={onNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 hidden md:flex items-center justify-center bg-black/40 rounded-full hover:bg-black/60"
      >
        <ChevronRight size={28} className="text-white" />
      </button>

      {/* View count for own stories */}
      {isMyStory && (
        <div className="absolute bottom-20 left-4 z-30 flex items-center gap-2 bg-black/50 px-3 py-2 rounded-full safe-bottom">
          <span className="text-white text-sm">{story.views?.length || 0} views</span>
        </div>
      )}

      {/* Reply input (not for own stories) */}
      {!isMyStory && (
        <div className="absolute bottom-4 left-4 right-4 z-30 safe-bottom">
          <div className="flex items-center gap-3">
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Send a message..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-full h-11"
              onClick={(e) => e.stopPropagation()}
            />
            {replyText && (
              <button
                onClick={async () => {
                  try {
                    // Find match with story owner to send reply
                    const matches = await base44.entities.Match.filter({
                      $or: [
                        { user1_id: myProfileId, user2_id: story.user_profile_id, is_match: true },
                        { user1_id: story.user_profile_id, user2_id: myProfileId, is_match: true }
                      ]
                    });
                    
                    if (matches.length > 0) {
                      await base44.entities.Message.create({
                        match_id: matches[0].id,
                        sender_id: myProfileId,
                        receiver_id: story.user_profile_id,
                        content: `Replied to your story: ${replyText}`,
                        message_type: 'text'
                      });
                      toast.success('Reply sent!');
                    } else {
                      toast.error('You can only reply to stories from your matches');
                    }
                  } catch (e) {
                    toast.error('Failed to send reply');
                  }
                  setReplyText('');
                }}
                className="w-11 h-11 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center"
              >
                <Send size={18} className="text-white" />
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}