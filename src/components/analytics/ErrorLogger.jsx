import React, { createContext, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useBreadcrumbs, getBreadcrumbs, addBreadcrumb } from './BreadcrumbTracker';
import { useLocation } from 'react-router-dom';

const ErrorLoggerContext = createContext();

export function ErrorLoggerProvider({ children }) {
  useBreadcrumbs(); // Activate breadcrumb tracking
  const location = useLocation();

  useEffect(() => {
    // Track page views as breadcrumbs
    addBreadcrumb('navigation', `Navigated to ${location.pathname}`);
  }, [location]);

  const captureError = async (error, errorInfo = {}) => {
    try {
      // Get context
      const user = await base44.auth.me().catch(() => null);
      const breadcrumbs = getBreadcrumbs();
      
      const payload = {
        message: error.message || String(error),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        type: errorInfo.type || 'error',
        url: window.location.href,
        userId: user?.id,
        userEmail: user?.email,
        browser: navigator.userAgent,
        os: navigator.platform,
        device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        breadcrumbs,
        severity: errorInfo.severity || 'medium'
      };

      // 1. Log to console for dev
      console.error('[ErrorLogger]', payload);

      // 2. Send to backend
      await base44.functions.invoke('logClientError', payload);

      // 3. User feedback (if critical)
      if (payload.severity === 'critical') {
        toast.error('Something went wrong', {
          description: 'Our team has been notified.'
        });
      }
    } catch (loggingError) {
      console.error('Failed to send error log:', loggingError);
    }
  };

  useEffect(() => {
    // Global Runtime Errors
    const handleError = (event) => {
      captureError(event.error || new Error(event.message), {
        type: 'runtime_error',
        severity: 'high'
      });
    };

    // Unhandled Promise Rejections
    const handleRejection = (event) => {
      captureError(event.reason || new Error('Unhandled Rejection'), {
        type: 'unhandled_rejection',
        severity: 'medium'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return (
    <ErrorLoggerContext.Provider value={{ captureError, addBreadcrumb }}>
      {children}
    </ErrorLoggerContext.Provider>
  );
}

export const useErrorLogger = () => useContext(ErrorLoggerContext);