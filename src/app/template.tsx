'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { CommandPalette } from '@/components/features/command-palette';
import { Command } from 'lucide-react';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = useState(false);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !(document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA')) {
        e.preventDefault();
        setShowHints(prev => !prev);
      }
      if (e.key === 'Escape' && showHints) {
        setShowHints(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHints]);

  return (
    <>
      <div key={pathname} className="animate-fade-in">
        {children}
      </div>

      {/* Keyboard shortcut hints */}
      {showHints && (
        <div
          className="fixed inset-0 z-[180] bg-black/40 flex items-center justify-center animate-fade-in"
          onClick={() => setShowHints(false)}
        >
          <div
            className="bg-background border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Command className="h-4 w-4 text-primary" />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2.5">
              {[
                { keys: 'N', desc: 'Create new task' },
                { keys: 'Q', desc: 'Focus quick add' },
                { keys: '⌘K', desc: 'Toggle command palette' },
                { keys: '1-4', desc: 'Switch views (Today, 7d, Upcoming, All)' },
                { keys: '?', desc: 'Toggle this help' },
                { keys: 'ESC', desc: 'Close dialogs / search' },
              ].map(({ keys, desc }) => (
                <div key={keys} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground/70">{desc}</span>
                  <kbd className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted/70 text-muted-foreground/60 font-mono tabular-nums border border-border/50">{keys}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </>
  );
}

