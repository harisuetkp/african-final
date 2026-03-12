import React, { useEffect } from 'react';
import { createPageUrl } from '@/utils';

export default function IDVerification() {
  useEffect(() => {
    // ID Verification is deprecated, redirecting to Photo Verification
    window.location.href = createPageUrl('VerifyPhoto');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Redirecting...
    </div>
  );
}