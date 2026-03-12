import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useCacheWarmer() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch commonly accessed data when user is idle
    let idleTimeout;

    const prefetchData = () => {
      // Prefetch next set of profiles
      queryClient.prefetchQuery({
        queryKey: ['prefetch-profiles'],
        queryFn: async () => {
          // Prefetch logic here
          return [];
        },
        staleTime: 60000
      });
    };

    const handleActivity = () => {
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(prefetchData, 3000); // Prefetch after 3s of inactivity
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearTimeout(idleTimeout);
    };
  }, [queryClient]);
}

// Cache invalidation on critical events
export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnlineReconnect = () => {
      // Invalidate all queries when coming back online
      queryClient.invalidateQueries();
    };

    window.addEventListener('online-reconnect', handleOnlineReconnect);

    return () => {
      window.removeEventListener('online-reconnect', handleOnlineReconnect);
    };
  }, [queryClient]);
}

// Smart cache management
export const cacheConfig = {
  // Short-lived data
  realtime: {
    staleTime: 5000,
    cacheTime: 30000
  },
  
  // Medium-lived data
  dynamic: {
    staleTime: 30000,
    cacheTime: 300000
  },
  
  // Long-lived data
  static: {
    staleTime: 300000,
    cacheTime: 3600000
  }
};