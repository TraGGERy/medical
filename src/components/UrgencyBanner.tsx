'use client';

import { useState, useEffect } from 'react';

export default function UrgencyBanner() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-red-600 text-white py-2 sm:py-3 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-pulse"></div>
      <div className="relative z-10 px-4">
        <p className="font-semibold text-sm sm:text-base">
          <span className="hidden sm:inline">🔥 LIMITED TIME: Free health reports ending in </span>
          <span className="sm:hidden">🔥 Free reports end in </span>
          <span className="bg-white text-red-600 px-1 sm:px-2 py-1 rounded font-bold mx-1 text-xs sm:text-sm">
            {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="hidden sm:inline">- Don't miss out!</span>
        </p>
      </div>
    </div>
  );
}