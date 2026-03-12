import React from 'react';
import ComingSoon from '@/components/shared/ComingSoon';
import { Languages } from 'lucide-react';

export default function LanguageExchangeHub() {
  return (
    <ComingSoon 
      title="Language Exchange" 
      description="Connect with others to learn and practice new languages. A new way to bridge cultures is coming."
      icon={Languages}
    />
  );
}