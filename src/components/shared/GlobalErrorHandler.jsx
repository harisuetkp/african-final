import { useEffect } from 'react';
import { toast } from 'sonner';
import { useErrorLogger } from '@/components/analytics/ErrorLogger';

export function GlobalErrorHandler() {
  const { captureError } = useErrorLogger();

  useEffect(() => {
    // Handle fetch errors globally
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Sanitize response headers or data if needed (though we can't intercept stream easily here)
        
        // Handle rate limiting
        if (response.status === 429) {
          toast.error('Too many requests', {
            description: 'Please wait a moment and try again'
          });
        }
        
        // Handle authentication errors
        if (response.status === 401) {
          console.warn('Authentication required');
        }
        
        // Handle server errors
        if (response.status >= 500) {
          captureError(new Error(`Server Error ${response.status}: ${response.url}`), {
            type: 'network_error',
            severity: 'high'
          });
          toast.error('Server error', {
            description: 'Please try again later'
          });
        }
        
        return response;
      } catch (error) {
        // Filter out "base44" from error messages if possible
        if (error.message && error.message.includes('base44')) {
           error.message = error.message.replace(/base44/gi, 'Service');
        }

        // Network error
        if (!navigator.onLine) {
          toast.error('No internet connection');
        } else {
          toast.error('Network error', {
            description: 'Please check your connection'
          });
        }
        throw error;
      }
    };

    // Handle console errors in production
    if (process.env.NODE_ENV === 'production') {
      const originalError = console.error;
      console.error = (...args) => {
        // Log to error tracking service
        originalError(...args);
      };
    }

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}