'use client';

import { useLinkStatus } from 'next/link';
import { useEffect, useState } from 'react';

export function NavigationProgress() {
  const { pending } = useLinkStatus();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (pending) {
      setVisible(true);
      setProgress(0);
      const t1 = setTimeout(() => setProgress(30), 50);
      const t2 = setTimeout(() => setProgress(60), 300);
      const t3 = setTimeout(() => setProgress(85), 800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else if (visible) {
      setProgress(100);
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    }
  }, [pending, visible]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-0.5 pointer-events-none">
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100
            ? 'width 0.2s ease-out, opacity 0.4s ease-out'
            : 'width 0.3s ease-out',
        }}
      />
    </div>
  );
}
