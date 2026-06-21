'use client';

import { useFocusMode } from '@/components/focus-mode-provider';
import { Sidebar } from '@/components/features/sidebar';
import { Suspense } from 'react';
import { cn } from '@/lib/utils';

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const { focusMode } = useFocusMode();

  return (
    <div className="flex h-screen overflow-hidden">
      <div className={cn(
        'transition-all duration-300 ease-in-out',
        focusMode ? 'w-0 overflow-hidden opacity-0' : 'w-auto opacity-100'
      )}>
        <Sidebar />
      </div>
      <main
        id="main-content"
        className={cn(
          'flex-1 overflow-y-auto bg-background focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/30 contain-layout',
          'transition-all duration-300 ease-in-out'
        )}
        tabIndex={-1}
      >
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
