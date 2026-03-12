import { useEffect } from 'react';

// Performance monitoring hook
export function usePerformanceMonitor(pageName) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Track page load performance
    const measurePageLoad = () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        const metrics = {
          page: pageName,
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
          timestamp: new Date().toISOString()
        };

        // Log to console in dev
        if (process.env.NODE_ENV === 'development') {
          console.log('⚡ Performance:', metrics);
        }

        // Could send to analytics service here
        // sendToAnalytics('page_performance', metrics);
      }
    };

    // Track API call times
    const measureApiCalls = () => {
      const resources = performance.getEntriesByType('resource');
      const apiCalls = resources.filter(r => r.name.includes('/api/') || r.name.includes('supabase'));
      
      const slowCalls = apiCalls.filter(call => call.duration > 1000);
      if (slowCalls.length > 0 && process.env.NODE_ENV === 'development') {
        console.warn('🐌 Slow API calls detected:', slowCalls.map(c => ({
          url: c.name,
          duration: `${Math.round(c.duration)}ms`
        })));
      }
    };

    const timeout = setTimeout(() => {
      measurePageLoad();
      measureApiCalls();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [pageName]);
}

// Track component render times
export function useRenderMonitor(componentName) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 50 && process.env.NODE_ENV === 'development') {
        console.warn(`⏱️ ${componentName} render took ${Math.round(renderTime)}ms`);
      }
    };
  });
}

// Error boundary logger
export function logError(error, errorInfo) {
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error caught:', error, errorInfo);
  }
  
  // Could send to error tracking service here
  // sendToSentry(error, errorInfo);
}