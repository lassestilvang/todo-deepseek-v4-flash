'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Command } from 'lucide-react';

const CommandPalette = dynamic(() => import('@/components/features/command-palette').then(m => m.CommandPalette), {
  loading: () => null,
});

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const showHintsRef = useRef(showHints);

  useEffect(() => {
    showHintsRef.current = showHints;
  }, [showHints]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowHints(prev => !prev);
      }
      if (e.key === 'Escape' && showHintsRef.current) {
        setShowHints(false);
      }
      
      // Navigation
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        switch (e.key) {
          case '1': router.push('/today'); break;
          case '2': router.push('/next-7-days'); break;
          case '3': router.push('/upcoming'); break;
          case '4': router.push('/all'); break;
          case '5': router.push('/calendar'); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

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
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">General</p>
                <div className="space-y-2">
                  {[
                    { keys: '⌘K', desc: 'Command Palette' },
                    { keys: '?', desc: 'Keyboard Shortcuts' },
                    { keys: 'ESC', desc: 'Close / Cancel' },
                  ].map(({ keys, desc }) => (
                    <div key={keys} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground/70">{desc}</span>
                      <kbd className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted/70 text-muted-foreground/60 font-mono tabular-nums border border-border/50">{keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">Tasks</p>
                <div className="space-y-2">
                  {[
                    { keys: 'N', desc: 'New Task' },
                    { keys: 'Q / A', desc: 'Quick Add' },
                  ].map(({ keys, desc }) => (
                    <div key={keys} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground/70">{desc}</span>
                      <kbd className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted/70 text-muted-foreground/60 font-mono tabular-nums border border-border/50">{keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">Navigation</p>
                <div className="space-y-2">
                  {[
                    { keys: '1', desc: 'Today' },
                    { keys: '2', desc: 'Next 7 Days' },
                    { keys: '3', desc: 'Upcoming' },
                    { keys: '4', desc: 'All Tasks' },
                    { keys: '5', desc: 'Calendar' },
                  ].map(({ keys, desc }) => (
                    <div key={keys} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground/70">{desc}</span>
                      <kbd className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted/70 text-muted-foreground/60 font-mono tabular-nums border border-border/50">{keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">Features</p>
                <div className="space-y-2">
                  {[
                    { keys: '⌥T', desc: 'Focus Timer' },
                  ].map(({ keys, desc }) => (
                    <div key={keys} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground/70">{desc}</span>
                      <kbd className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted/70 text-muted-foreground/60 font-mono tabular-nums border border-border/50">{keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </>
  );
}

