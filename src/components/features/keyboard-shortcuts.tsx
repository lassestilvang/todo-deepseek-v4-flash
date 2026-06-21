'use client';

import { memo, useState, useEffect, useRef } from 'react';
import { Command, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Shortcut {
  keys: string;
  desc: string;
  category: string;
}

const ALL_SHORTCUTS: Shortcut[] = [
  { keys: '⌘K', desc: 'Command Palette', category: 'General' },
  { keys: '?', desc: 'Keyboard Shortcuts', category: 'General' },
  { keys: '⌘.', desc: 'Toggle Focus Mode', category: 'General' },
  { keys: 'ESC', desc: 'Close / Cancel', category: 'General' },
  { keys: 'N', desc: 'New Task', category: 'Tasks' },
  { keys: 'Q / A', desc: 'Quick Add', category: 'Tasks' },
  { keys: 'J / ↓', desc: 'Move Focus Down', category: 'Tasks' },
  { keys: 'K / ↑', desc: 'Move Focus Up', category: 'Tasks' },
  { keys: 'Space / X', desc: 'Toggle Complete', category: 'Tasks' },
  { keys: 'Enter / E', desc: 'Edit Task', category: 'Tasks' },
  { keys: 'Delete / ⌫', desc: 'Delete Task', category: 'Tasks' },
  { keys: '1', desc: 'Priority: High', category: 'Tasks' },
  { keys: '2', desc: 'Priority: Medium', category: 'Tasks' },
  { keys: '3', desc: 'Priority: Low', category: 'Tasks' },
  { keys: '4', desc: 'Priority: None', category: 'Tasks' },
  { keys: '1', desc: 'Go to Today', category: 'Navigation' },
  { keys: '2', desc: 'Go to Next 7 Days', category: 'Navigation' },
  { keys: '3', desc: 'Go to Upcoming', category: 'Navigation' },
  { keys: '4', desc: 'Go to All Tasks', category: 'Navigation' },
  { keys: '5', desc: 'Go to Calendar', category: 'Navigation' },
  { keys: '⌥T', desc: 'Focus Timer', category: 'Features' },
  { keys: 'Tab', desc: 'Indent Subtask', category: 'Tasks' },
];

const categories = ['General', 'Navigation', 'Tasks', 'Features'];

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-primary rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

interface KeyboardShortcutsProps {
  open: boolean;
  onClose: () => void;
}

export const KeyboardShortcuts = memo(function KeyboardShortcuts({ open, onClose }: KeyboardShortcutsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const filtered = query
    ? ALL_SHORTCUTS.filter(s =>
        s.desc.toLowerCase().includes(query.toLowerCase()) ||
        s.keys.toLowerCase().includes(query.toLowerCase()) ||
        s.category.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_SHORTCUTS;

  const grouped = query
    ? { 'Search Results': filtered }
    : Object.fromEntries(
        categories.map(cat => [cat, ALL_SHORTCUTS.filter(s => s.category === cat)])
      ) as Record<string, Shortcut[]>;

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[180] bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-[10vh] -translate-x-1/2 z-[190] w-full max-w-xl mx-4 animate-scale-in"
      >
        <div className="bg-background border rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/20">
            <Command className="h-4 w-4 text-primary shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shortcuts..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40 font-medium"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-md hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground/50" />
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-3">
            {Object.entries(grouped).map(([category, shortcuts]) => {
              const visible = shortcuts as Shortcut[];
              if (visible.length === 0) return null;
              return (
                <div key={category} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      category === 'General' ? 'bg-primary' :
                      category === 'Navigation' ? 'bg-blue-500' :
                      category === 'Tasks' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    )} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                      <Highlight text={category} query={query} />
                    </span>
                    <span className="text-[9px] text-muted-foreground/30 tabular-nums">{visible.length}</span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>
                  <div className="space-y-0.5">
                    {visible.map((shortcut) => (
                      <div
                        key={shortcut.keys + shortcut.desc}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted/50 transition-colors group"
                      >
                        <span className="text-sm text-muted-foreground/80 group-hover:text-foreground transition-colors">
                          <Highlight text={shortcut.desc} query={query} />
                        </span>
                        <kbd className="text-[11px] px-2 py-0.5 rounded-lg bg-muted/80 text-muted-foreground/60 font-mono tabular-nums border border-border/40 shadow-sm">
                          {shortcut.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <Search className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-sm font-medium text-muted-foreground/60">No shortcuts found</p>
                <p className="text-xs text-muted-foreground/40 mt-1">Try a different search term</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 px-4 py-2.5 border-t bg-muted/10">
            <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
              <Command className="h-3 w-3" /> <kbd className="text-[9px] px-1 py-0.5 rounded bg-muted/60 font-mono">K</kbd> Command Palette
            </span>
            <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
              ↑↓ <span className="text-muted-foreground/30 mx-0.5">·</span> <kbd className="text-[9px] px-1 py-0.5 rounded bg-muted/60 font-mono">?</kbd> Toggle this
            </span>
          </div>
        </div>
      </div>
    </>
  );
});
