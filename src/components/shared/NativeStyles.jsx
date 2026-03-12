import React from 'react';

// Native App Styles Component
// Import this in Layout to apply native-like behaviors globally

export const NativeStyles = () => (
  <style>{`
    /* Disable text selection globally except inputs */
    * {
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
    }
    
    input, textarea, [contenteditable="true"], .selectable {
      -webkit-user-select: text;
      user-select: text;
    }

    /* Smooth momentum scrolling */
    * {
      -webkit-overflow-scrolling: touch;
    }

    /* Prevent overscroll/bounce */
    html, body {
      overscroll-behavior: none;
      position: fixed;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    
    #root {
      width: 100%;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }

    /* Remove tap highlight */
    * {
      -webkit-tap-highlight-color: transparent;
    }

    /* Touch manipulation for all interactive elements */
    button, a, [role="button"], input[type="submit"], .touchable {
      touch-action: manipulation;
    }

    /* Native-like button press effect */
    button:active, .btn-press:active {
      transform: scale(0.97);
      transition: transform 0.1s ease-out;
    }

    /* Prevent context menu on long press */
    img, a {
      -webkit-touch-callout: none;
    }

    /* Safe area handling */
    .safe-top {
      padding-top: env(safe-area-inset-top);
    }
    
    .safe-bottom {
      padding-bottom: env(safe-area-inset-bottom);
    }
    
    .safe-left {
      padding-left: env(safe-area-inset-left);
    }
    
    .safe-right {
      padding-right: env(safe-area-inset-right);
    }

    /* Hide scrollbars but keep functionality */
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    /* Smooth transitions */
    .native-transition {
      transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    /* iOS-style blur effects */
    .glass {
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    /* Prevent zoom on input focus (iOS) */
    input, select, textarea {
      font-size: 16px !important;
    }

    /* Fix for iOS keyboard push */
    @supports (-webkit-touch-callout: none) {
      .keyboard-fix {
        padding-bottom: env(keyboard-inset-height, 0px);
      }
    }
  `}</style>
);

// Hook for haptic feedback
export const useHaptics = () => {
  const light = () => {
    if (navigator.vibrate) navigator.vibrate(10);
  };
  
  const medium = () => {
    if (navigator.vibrate) navigator.vibrate(30);
  };
  
  const heavy = () => {
    if (navigator.vibrate) navigator.vibrate(50);
  };
  
  const success = () => {
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  };
  
  const error = () => {
    if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
  };
  
  return { light, medium, heavy, success, error };
};

// Native-like pull to refresh indicator
export const PullIndicator = ({ progress }) => (
  <div 
    className="flex items-center justify-center py-4"
    style={{ 
      opacity: Math.min(progress / 100, 1),
      transform: `rotate(${progress * 3.6}deg)`
    }}
  >
    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default NativeStyles;