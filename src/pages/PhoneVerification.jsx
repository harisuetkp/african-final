import React from 'react';
import ComingSoon from '@/components/shared/ComingSoon';
import { Phone } from 'lucide-react';

export default function PhoneVerification() {
  return (
    <ComingSoon 
      title="Phone Verification" 
      description="Enhanced security with phone verification is on its way to keep our community safe."
      icon={Phone}
    />
  );
}