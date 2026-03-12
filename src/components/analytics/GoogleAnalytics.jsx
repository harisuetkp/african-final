import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

// GA ID is loaded dynamically from backend
const GA_ID = null;

export default function GoogleAnalytics() {
  const location = useLocation();
  const [gaId, setGaId] = useState(null);

  useEffect(() => {
    // Fetch GA ID from backend
    const loadGA = async () => {
      try {
        const response = await base44.functions.invoke('getGoogleAnalyticsId', {});
        const data = response.data;
        if (data.ga_id) {
          setGaId(data.ga_id);
          
          // Load GA script
          if (typeof window !== 'undefined' && !window.gtag) {
            const script = document.createElement('script');
            script.src = `https://www.googletagmanager.com/gtag/js?id=${data.ga_id}`;
            script.async = true;
            document.head.appendChild(script);

            window.dataLayer = window.dataLayer || [];
            function gtag() { window.dataLayer.push(arguments); }
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', data.ga_id);
          }
        }
      } catch (e) {
        // GA not configured, fail silently
      }
    };
    loadGA();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (window.gtag && gaId) {
      window.gtag('config', gaId, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location, gaId]);

  return null;
}

// Track custom events
export const trackEvent = (eventName, eventParams = {}) => {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};