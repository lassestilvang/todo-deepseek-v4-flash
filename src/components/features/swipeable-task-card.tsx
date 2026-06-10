'use client';

import { useRef, useState, useCallback } from 'react';
import { CheckCircle2, Trash2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskWithRelations } from '@/types';

interface SwipeableTaskCardProps {
  task: TaskWithRelations;
  children: React.ReactNode;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const SWIPE_THRESHOLD = 80;

export function SwipeableTaskCard({ task, children, onToggle, onDelete }: SwipeableTaskCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startXRef = useRef(0);
  const offsetRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    offsetRef.current = 0;
    setSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startXRef.current;
    const clamped = Math.max(-160, Math.min(160, dx));
    offsetRef.current = clamped;
    setOffsetX(clamped);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setSwiping(false);
    const offset = offsetRef.current;

    if (offset < -SWIPE_THRESHOLD) {
      // Swiped left — toggle complete
      onToggle(task.id);
    } else if (offset > SWIPE_THRESHOLD) {
      // Swiped right — delete
      onDelete(task.id);
    }

    setOffsetX(0);
    offsetRef.current = 0;
  }, [task.id, onToggle, onDelete]);

  if (offsetX === 0 && !swiping) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Left action (swipe right) — Delete */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-20 flex items-center justify-center rounded-l-xl transition-colors z-10',
          offsetX > 0 ? 'bg-red-500/15' : 'bg-red-500/5'
        )}
        style={{ opacity: Math.min(Math.abs(offsetX) / SWIPE_THRESHOLD, 1) }}
      >
        <Trash2 className={cn('h-5 w-5', offsetX > 0 ? 'text-red-500' : 'text-red-500/50')} />
      </div>

      {/* Right action (swipe left) — Complete */}
      <div
        className={cn(
          'absolute inset-y-0 right-0 w-20 flex items-center justify-center rounded-r-xl transition-colors z-10',
          offsetX < 0 ? 'bg-emerald-500/15' : 'bg-emerald-500/5'
        )}
        style={{ opacity: Math.min(Math.abs(offsetX) / SWIPE_THRESHOLD, 1) }}
      >
        {task.completed ? (
          <Circle className={cn('h-5 w-5', offsetX < 0 ? 'text-emerald-500' : 'text-emerald-500/50')} />
        ) : (
          <CheckCircle2 className={cn('h-5 w-5', offsetX < 0 ? 'text-emerald-500' : 'text-emerald-500/50')} />
        )}
      </div>

      {/* Sliding content */}
      <div
        className="relative bg-card transition-transform duration-200 ease-out"
        style={{ transform: swiping ? `translateX(${offsetX}px)` : undefined }}
      >
        {children}
      </div>
    </div>
  );
}
