'use client';

import { useLinkStatus } from 'next/link';
import { useEffect, useRef, useState } from 'react';

export function NavigationProgress() {
  const { pending } = useLinkStatus();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startTimeRef = useRef(0);

  useEffect(() => {
    // Clear any pending timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (pending) {
      setVisible(true);
      setProgress(0);
      startTimeRef.current = Date.now();

      // Adaptive progress simulation — early gains are fast, later gains slow down
      timersRef.current = [
        setTimeout(() => setProgress(20), 30),
        setTimeout(() => setProgress(40), 150),
        setTimeout(() => setProgress(55), 350),
        setTimeout(() => setProgress(70), 700),
        setTimeout(() => setProgress(82), 1200),
        setTimeout(() => setProgress(90), 2000),
      ];
    } else if (visible) {
      const elapsed = Date.now() - startTimeRef.current;
      // Snap to 100% with a delay proportional to how long the navigation took
      // Creates a more natural feel: fast navs snap instantly, slow ones complete smoothly
      const snapDelay = Math.min(elapsed * 0.15, 300);
      setProgress(100);
      timersRef.current = [
        setTimeout(() => { setVisible(false); setProgress(0); }, snapDelay + 150),
      ];
    }

    return () => timersRef.current.forEach(clearTimeout);
  }, [pending, visible]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-0.5 pointer-events-none navigation-progress-bar">
      <div
        className="h-full bg-gradient-to-r from-primary/80 via-primary to-primary/80 rounded-full transition-all duration-[250ms] ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent rounded-full transition-all duration-[250ms] ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 0.5,
        }}
      />
    </div>
  );
}
