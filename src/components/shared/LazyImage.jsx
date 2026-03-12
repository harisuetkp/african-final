import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export default function LazyImage({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  onLoad = () => {},
  priority = false 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (priority) return; // Skip intersection observer for priority images

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad();
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          {placeholder || <Loader2 className="animate-spin text-gray-400" size={24} />}
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
          Failed to load
        </div>
      ) : (
        isInView && (
          <img
            src={src}
            alt={alt}
            className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
          />
        )
      )}
    </div>
  );
}