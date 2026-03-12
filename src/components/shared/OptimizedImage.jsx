import React, { useState, memo } from 'react';
import { cn } from '@/lib/utils';

// Optimized image component with lazy loading and error handling
const OptimizedImage = memo(function OptimizedImage({ 
  src, 
  alt, 
  className, 
  aspectRatio = 'aspect-square',
  priority = false,
  onLoad,
  ...props 
}) {
  const [isLoaded, setIsLoaded] = useState(priority); // Skip loading state for priority images
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className={cn('bg-gray-200 flex items-center justify-center', aspectRatio, className)}>
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', aspectRatio, className)}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200" />
      )}
      
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchpriority={priority ? 'high' : 'auto'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full object-cover',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />
    </div>
  );
});

export default OptimizedImage;