'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface FocusModeContextType {
  focusMode: boolean;
  toggleFocusMode: () => void;
}

const FocusModeContext = createContext<FocusModeContextType>({
  focusMode: false,
  toggleFocusMode: () => {},
});

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [focusMode, setFocusMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('planner-focus-mode') === 'true';
    }
    return false;
  });

  const toggleFocusMode = useCallback(() => {
    setFocusMode(prev => {
      const next = !prev;
      localStorage.setItem('planner-focus-mode', String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        toggleFocusMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFocusMode]);

  return (
    <FocusModeContext.Provider value={{ focusMode, toggleFocusMode }}>
      {children}
    </FocusModeContext.Provider>
  );
}

export const useFocusMode = () => useContext(FocusModeContext);
