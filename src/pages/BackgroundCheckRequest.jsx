import React from 'react';
import ComingSoon from '@/components/shared/ComingSoon';
import { Shield } from 'lucide-react';

export default function BackgroundCheckRequest() {
  return (
    <ComingSoon 
      title="Background Checks" 
      description="Verified background checks for added trust and safety. We are integrating with top providers."
      icon={Shield}
    />
  );
}