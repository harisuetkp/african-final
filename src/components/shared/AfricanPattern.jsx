import React from 'react';

export default function AfricanPattern({ className = "", opacity = 0.05 }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        className="absolute w-full h-full"
        style={{ opacity }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="kente" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect fill="currentColor" x="0" y="0" width="10" height="10" />
            <rect fill="currentColor" x="10" y="10" width="10" height="10" />
            <path d="M0,5 L10,5 M5,0 L5,10 M10,15 L20,15 M15,10 L15,20" stroke="currentColor" strokeWidth="1" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#kente)" />
      </svg>
    </div>
  );
}