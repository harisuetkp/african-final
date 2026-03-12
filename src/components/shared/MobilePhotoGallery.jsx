import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

export default function MobilePhotoGallery({ photos, initialIndex = 0 }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (diff > threshold && currentIndex < photos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (diff < -threshold && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const openFullscreen = (index) => {
    setSelectedIndex(index);
    setCurrentIndex(index);
  };

  const closeFullscreen = () => {
    setSelectedIndex(null);
  };

  const goNext = (e) => {
    e?.stopPropagation();
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goPrev = (e) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!photos || photos.length === 0) return null;

  return (
    <>
      {/* Grid View */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {photos.map((photo, idx) => (
          <motion.div
            key={idx}
            className="relative aspect-square rounded-lg sm:rounded-xl overflow-hidden cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openFullscreen(idx)}
          >
            <img
              src={photo}
              alt={`Photo ${idx + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
            </div>
            {idx === 0 && (
              <div className="absolute top-1 left-1 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                Main
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
            onClick={closeFullscreen}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white z-10">
              <span className="text-sm font-medium">
                {currentIndex + 1} / {photos.length}
              </span>
              <button
                onClick={closeFullscreen}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Image Container */}
            <div
              className="flex-1 flex items-center justify-center relative overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentIndex}
                  src={photos[currentIndex]}
                  alt={`Photo ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2 }}
                  draggable={false}
                />
              </AnimatePresence>

              {/* Navigation Arrows (Desktop) */}
              {currentIndex > 0 && (
                <button
                  onClick={goPrev}
                  className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition text-white"
                >
                  <ChevronLeft size={28} />
                </button>
              )}
              {currentIndex < photos.length - 1 && (
                <button
                  onClick={goNext}
                  className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition text-white"
                >
                  <ChevronRight size={28} />
                </button>
              )}
            </div>

            {/* Dot Indicators */}
            <div className="flex items-center justify-center gap-2 p-4">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'bg-white w-6'
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>

            {/* Swipe Hint (Mobile) */}
            <p className="sm:hidden text-white/50 text-xs text-center pb-4">
              Swipe to navigate
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}