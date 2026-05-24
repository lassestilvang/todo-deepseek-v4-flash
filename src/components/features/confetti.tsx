'use client';

import { memo, useState } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
const COUNT = 24;

function createParticles(ox: number, oy: number) {
  return Array.from({ length: COUNT }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    y: -(Math.random() * 200 + 100),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotate: Math.random() * 720 - 360,
    scale: Math.random() * 0.6 + 0.4,
  }));
}

export const Confetti = memo(function Confetti({
  originX,
  originY,
  onComplete,
}: {
  originX: number;
  originY: number;
  onComplete: () => void;
}) {
  const [particles] = useState(() => createParticles(originX, originY));

  return (
    <div className="fixed inset-0 pointer-events-none z-[150]">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{ left: originX, top: originY, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, rotate: 0, scale: 0, opacity: 1 }}
          animate={{
            x: p.x,
            y: p.y,
            rotate: p.rotate,
            scale: p.scale,
            opacity: 0,
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.4,
            ease: [0.25, 0.1, 0.25, 1],
            delay: Math.random() * 0.1,
          }}
          onAnimationComplete={p.id === 0 ? onComplete : undefined}
        />
      ))}
    </div>
  );
});
