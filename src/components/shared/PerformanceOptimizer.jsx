import { useEffect } from 'react';

// Optimize images across the app
export function optimizeImages() {
  useEffect(() => {
    // Add intersection observer for lazy loading
    const images = document.querySelectorAll('img[data-lazy]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-lazy');
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px'
    });

    images.forEach(img => imageObserver.observe(img));

    return () => imageObserver.disconnect();
  }, []);
}

// Debounce expensive operations
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle scroll events
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Measure component render time
export function measurePerformance(componentName) {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    if (renderTime > 16) { // Slower than 60fps
      console.warn(`⚠️ ${componentName} render took ${renderTime.toFixed(2)}ms`);
    }
  };
}

// Batch API calls
export class APIBatcher {
  constructor(batchDelay = 100) {
    this.queue = [];
    this.timeout = null;
    this.batchDelay = batchDelay;
  }

  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      
      if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }

  async flush() {
    const batch = [...this.queue];
    this.queue = [];
    this.timeout = null;

    try {
      // Execute all requests in parallel
      const results = await Promise.allSettled(
        batch.map(({ request }) => request())
      );

      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          batch[idx].resolve(result.value);
        } else {
          batch[idx].reject(result.reason);
        }
      });
    } catch (error) {
      batch.forEach(({ reject }) => reject(error));
    }
  }
}