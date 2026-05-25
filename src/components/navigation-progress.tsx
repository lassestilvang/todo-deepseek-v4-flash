'use client';

import { useLinkStatus } from 'next/link';
import { useEffect, useRef, useState } from 'react';

export function NavigationProgress() {
  const { pending } = useLinkStatus();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Clear any pending timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (pending) {
      setVisible(true);
      setProgress(0);
      timersRef.current = [
        setTimeout(() => setProgress(30), 50),
        setTimeout(() => setProgress(60), 300),
        setTimeout(() => setProgress(85), 800),
      ];
    } else if (visible) {
      setProgress(100);
      timersRef.current = [
        setTimeout(() => { setVisible(false); setProgress(0); }, 400),
      ];
    }

    return () => timersRef.current.forEach(clearTimeout);
  }, [pending, visible]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-1 pointer-events-none navigation-progress-bar">
      <div
        className="h-full bg-gradient-to-r from-primary/80 via-primary to-primary/80 rounded-full transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent rounded-full transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 0.6,
        }}
      />
    </div>
  );
}
