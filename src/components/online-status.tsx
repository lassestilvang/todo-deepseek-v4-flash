'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShow(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-1/2 -translate-x-1/2 z-[300] px-4 py-1.5 rounded-b-2xl text-xs font-medium shadow-lg transition-all duration-300 flex items-center gap-2',
        isOnline
          ? 'bg-emerald-500 text-white'
          : 'bg-amber-500 text-white'
      )}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          Back online
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          You are offline
        </>
      )}
    </div>
  );
}
