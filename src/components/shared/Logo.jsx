import React from 'react';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6940c70dbf312aa4658a9066/539bcd82a_EA8B1C93-B120-4D4F-A79F-9725395A9A37.png';

export default function Logo({ size = 'default', showText = false }) {
  const sizes = {
    small: 'h-8',
    default: 'h-12',
    large: 'h-16',
    xlarge: 'h-32'
  };

  return (
    <div className="flex items-center justify-center">
      <img 
        src={LOGO_URL} 
        alt="Afrinnect Dating" 
        className={`${sizes[size]} w-auto object-contain`}
      />
    </div>
  );
}