'use client';

import { memo, useState, useCallback } from 'react';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
const COUNT = 20;

const particles = Array.from({ length: COUNT }, (_, i) => ({
  id: i,
  x: (Math.random() - 0.5) * 280,
  y: -(Math.random() * 200 + 100),
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
  rotate: Math.random() * 720 - 360,
  scale: Math.random() * 0.6 + 0.4,
  delay: Math.random() * 0.08,
}));

export const Confetti = memo(function Confetti({
  originX,
  originY,
  onComplete,
}: {
  originX: number;
  originY: number;
  onComplete: () => void;
}) {
  const [finished, setFinished] = useState(false);

  const handleAnimationEnd = useCallback(() => {
    setFinished(true);
    setTimeout(onComplete, 50);
  }, [onComplete]);

  if (finished) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[150]">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-sm confetti-particle"
          style={{
            left: originX,
            top: originY,
            backgroundColor: p.color,
            '--tx': `${p.x}px`,
            '--ty': `${p.y}px`,
            '--tr': `${p.rotate}deg`,
            '--ts': p.scale,
            animationDelay: `${p.delay}s`,
          } as React.CSSProperties}
          onAnimationEnd={p.id === 0 ? handleAnimationEnd : undefined}
        />
      ))}
    </div>
  );
});
