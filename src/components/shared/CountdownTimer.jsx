import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    // Calculate immediately on mount
    const calculateTime = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        onExpire?.();
        return false;
      }

      const hours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
      const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
      const seconds = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      return true;
    };

    // Calculate immediately
    const shouldContinue = calculateTime();
    if (!shouldContinue) return;

    // Update every second with accurate timing
    const timer = setInterval(() => {
      const shouldContinue = calculateTime();
      if (!shouldContinue) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (!timeLeft) return null;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-xs font-medium shadow-lg">
      <Clock size={12} className="animate-pulse" />
      <span>{timeLeft}</span>
    </div>
  );
}