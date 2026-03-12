import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import LazyImage from '@/components/shared/LazyImage';

export default function EditProfilePhotos({
  photos = [],
  primaryPhoto,
  uploading,
  onPhotoUpload,
  onRemovePhoto,
  onSetPrimary,
  onReorder
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur">
      <div className="bg-gradient-to-r from-purple-600 to-amber-600 p-6">
        <div className="flex items-center gap-3 text-white">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
            <Camera size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Your Photos</h2>
            <p className="text-sm text-white/80">Add up to 6 photos (4:5 ratio recommended)</p>
            <p className="text-xs text-white/60 mt-1">💡 Keep important details in the top half of the photo</p>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {photos.map((photo, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden group shadow-lg"
              >
                <LazyImage 
                  src={photo} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
                
                {/* Overlay - Always visible on mobile touch, hover on desktop */}
                <div className="absolute inset-0 bg-black/40 md:bg-black/50 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onSetPrimary(photo)}
                    className="rounded-full h-8 px-3 text-xs"
                  >
                    <Sparkles size={12} className="mr-1" />
                    Main
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onRemovePhoto(idx)}
                    className="rounded-full h-8 w-8 p-0"
                  >
                    <X size={14} />
                  </Button>
                </div>
                
                {/* Primary Badge */}
                {photo === primaryPhoto && (
                  <Badge className="absolute top-2 left-2 bg-amber-500 text-white border-0 shadow-lg z-10">
                    <Sparkles size={10} className="mr-1" />
                    Main
                  </Badge>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Upload Button */}
          {photos.length < 6 && (
            <motion.label
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-[3/4] rounded-2xl border-3 border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-100/50 flex flex-col items-center justify-center cursor-pointer transition-all group"
            >
              <input 
                type="file" 
                accept="image/*" 
                onChange={onPhotoUpload} 
                className="hidden" 
                disabled={uploading} 
              />
              {uploading ? (
                <Loader2 className="animate-spin text-purple-600" size={32} />
              ) : (
                <>
                  <div className="p-4 bg-purple-200 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <Camera size={28} className="text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-purple-700">Add Photo</span>
                </>
              )}
            </motion.label>
          )}
        </div>
        
        {photos.length === 0 && (
          <p className="text-center text-gray-500 text-sm mt-4">
            ✨ Add at least 3 photos to stand out and get more matches
          </p>
        )}
        
        {photos.length > 1 && (
          <div className="text-center mt-4">
            <Button
              variant="outline"
              onClick={onReorder}
              className="border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              Reorder Photos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}