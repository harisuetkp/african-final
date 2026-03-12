import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export default function StoryRing({ profile, hasStory, isViewed, onClick, isOwnProfile, storyCount = 0 }) {
  const photo = profile?.primary_photo || profile?.photos?.[0] || 'https://via.placeholder.com/80';
  
  // Gradient ring for unviewed, gray for viewed
  const ringStyle = hasStory && !isViewed
    ? { background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }
    : hasStory && isViewed
    ? { background: '#6b7280' }
    : { background: '#374151' };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        if (navigator.vibrate) navigator.vibrate(10);
        onClick();
      }}
      className="flex-shrink-0 flex flex-col items-center gap-2 touch-manipulation"
    >
      <div className="relative">
        <div 
          className="w-[76px] h-[76px] rounded-full p-[3px]"
          style={ringStyle}
        >
          <div className="w-full h-full bg-black p-[2px] rounded-full">
            <img
              src={photo}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        {/* Plus button for own profile */}
        {isOwnProfile && (
          <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center border-[3px] border-black">
            <Plus size={16} className="text-white" strokeWidth={3} />
          </div>
        )}

        {/* Story count badge */}
        {hasStory && storyCount > 1 && !isOwnProfile && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center border-2 border-black">
            <span className="text-white text-[10px] font-bold">{storyCount}</span>
          </div>
        )}
      </div>

      <span className={`text-xs font-medium w-[76px] text-center truncate ${
        hasStory && !isViewed ? 'text-white' : 'text-gray-500'
      }`}>
        {isOwnProfile ? 'Your story' : profile?.display_name?.split(' ')[0] || 'User'}
      </span>
    </motion.button>
  );
}