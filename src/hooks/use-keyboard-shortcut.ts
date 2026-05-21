'use client';

import { useEffect } from 'react';

type Shortcut = {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  handler: (e: KeyboardEvent) => void;
  enabled?: boolean;
};

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;
        const metaDown = e.metaKey || e.ctrlKey;
        const needsMeta = shortcut.meta || shortcut.ctrl;
        if (e.key.toLowerCase() === shortcut.key.toLowerCase()) {
          if (needsMeta && !metaDown) continue;
          if (!needsMeta && metaDown) continue;
          if (shortcut.shift && !e.shiftKey) continue;
          if (!shortcut.shift && e.shiftKey) continue;
          e.preventDefault();
          shortcut.handler(e);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
