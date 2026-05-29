'use client';

import { memo, useState, useCallback, useRef } from 'react';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#14b8a6'];
const COUNT = 24;

const shapes = ['rounded-sm', 'rounded-full', 'rotate-45', 'rounded-md'] as const;

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
  const particlesRef = useRef(
    Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 320,
      y: -(Math.random() * 240 + 80),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: Math.random() * 720 - 360,
      scale: Math.random() * 0.6 + 0.3,
      delay: Math.random() * 0.1,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      size: Math.random() * 4 + 3,
    }))
  );

  const handleAnimationEnd = useCallback(() => {
    setFinished(true);
    setTimeout(onComplete, 50);
  }, [onComplete]);

  if (finished) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[150]">
      {particlesRef.current.map((p) => (
        <div
          key={p.id}
          className={`absolute confetti-particle ${p.shape}`}
          style={{
            left: originX,
            top: originY,
            width: p.size,
            height: p.size,
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
