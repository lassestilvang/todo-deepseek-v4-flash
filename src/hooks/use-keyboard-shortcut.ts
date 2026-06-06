'use client';

import { useEffect, useRef } from 'react';

type Shortcut = {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  handler: (e: KeyboardEvent) => void;
  enabled?: boolean;
};

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  // Store shortcuts in a ref to avoid re-attaching the listener on every render
  // when inline array literals are passed as props
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentShortcuts = shortcutsRef.current;
      for (const shortcut of currentShortcuts) {
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
  }, []); // Empty deps — never re-attach, always read from ref
}
