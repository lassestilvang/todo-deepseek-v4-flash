'use client';

import { memo, useState, useCallback, useRef } from 'react';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#14b8a6'];
const SINGLE_COUNT = 24;
const BURST_COUNT = 100;

const shapes = ['rounded-sm', 'rounded-full', 'rotate-45', 'rounded-md'] as const;

export const Confetti = memo(function Confetti({
  originX,
  originY,
  onComplete,
  variant = 'single',
}: {
  originX: number;
  originY: number;
  onComplete: () => void;
  variant?: 'single' | 'burst';
}) {
  const [finished, setFinished] = useState(false);
  const count = variant === 'burst' ? BURST_COUNT : SINGLE_COUNT;
  
  const particlesRef = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * (variant === 'burst' ? 800 : 320),
      y: -(Math.random() * (variant === 'burst' ? 500 : 240) + 80),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: Math.random() * 720 - 360,
      scale: Math.random() * (variant === 'burst' ? 1.2 : 0.6) + 0.3,
      delay: Math.random() * (variant === 'burst' ? 0.4 : 0.1),
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      size: Math.random() * (variant === 'burst' ? 8 : 4) + 3,
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
