import { useEffect } from 'react';
import { toast } from 'sonner';

export function useServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('✅ SW registered:', registration);

            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  toast.info('App update available', {
                    description: 'Refresh to get the latest version',
                    action: {
                      label: 'Refresh',
                      onClick: () => window.location.reload()
                    },
                    duration: Infinity
                  });
                }
              });
            });
          })
          .catch((err) => {
            console.error('SW registration failed:', err);
          });
      });

      // Listen for SW messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_UPDATED') {
          console.log('Cache updated:', event.data.url);
        }
      });
    }
  }, []);

  const clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      toast.success('Cache cleared successfully');
      window.location.reload();
    }
  };

  return { clearCache };
}