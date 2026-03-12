import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ 
  children, 
  requireAuth = true,
  requireProfile = false,
  redirectTo = 'Landing'
}) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!requireAuth) {
          setLoading(false);
          return;
        }

        const isAuth = await base44.auth.isAuthenticated();
        
        if (!isAuth) {
          window.location.href = createPageUrl(redirectTo);
          return;
        }

        setAuthenticated(true);

        // Check for profile if required
        if (requireProfile) {
          const user = await base44.auth.me();
          const profiles = await base44.entities.UserProfile.filter({ 
            user_id: user.id 
          });

          if (profiles.length === 0) {
            window.location.href = createPageUrl('Onboarding');
            return;
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = createPageUrl(redirectTo);
      }
    };

    checkAuth();
  }, [requireAuth, requireProfile, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-purple-600" size={48} />
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!authenticated && requireAuth) {
    return null;
  }

  return <>{children}</>;
}