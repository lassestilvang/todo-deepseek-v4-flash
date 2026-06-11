'use client';

import { useRef, useEffect, useState, memo } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LazyTaskCardWrapperProps {
  children: ReactNode;
  id: string;
  style?: React.CSSProperties;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
  isDragSource?: boolean;
}

/**
 * Wraps a task card to lazily render it when it's in/near the viewport.
 * Uses IntersectionObserver with rootMargin to render content before user scrolls to it.
 * Falls back to always rendering when IntersectionObserver is not available.
 */
export const LazyTaskCardWrapper = memo(function LazyTaskCardWrapper({
  children,
  id,
  style,
  draggable,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver,
  isDragSource,
}: LazyTaskCardWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [alwaysRender, setAlwaysRender] = useState(false);

  useEffect(() => {
    // Check if we should always render (IntersectionObserver unavailable, or SSR)
    if (typeof IntersectionObserver === 'undefined') {
      setAlwaysRender(true);
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '400px 0px', // Start loading 400px before visible
        threshold: 0,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} style={{ minHeight: alwaysRender || visible ? 'auto' : '80px' }} className="contain-layout task-card-gpu" data-lazy-id={id}>
      {visible ? (
        <div
          style={style}
          className={cn(
            'transition-all duration-200',
            isDragOver && 'relative',
            isDragSource && 'opacity-40 scale-[0.97] rotate-[-1deg]'
          )}
          draggable={draggable}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {/* Drop indicator line */}
          {isDragOver && (
            <>
              <div className="absolute -top-[3px] left-2 right-2 h-[3px] bg-primary rounded-full z-20 animate-fade-in shadow-sm shadow-primary/50" />
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full animate-scale-in shadow-md">
                Drop here
              </div>
            </>
          )}
          {children}
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full shrink-0 mt-0.5 bg-muted/60" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
