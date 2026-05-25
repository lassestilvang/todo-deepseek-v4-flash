'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, ArrowRight, Sparkles, ListTodo } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { TaskWithRelations } from '@/types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { id: '/today', label: 'Go to Today', icon: Calendar, keywords: 'today home' },
  { id: '/next-7-days', label: 'Go to Next 7 Days', icon: Calendar, keywords: '7 days week' },
  { id: '/upcoming', label: 'Go to Upcoming', icon: ListTodo, keywords: 'upcoming future' },
  { id: '/all', label: 'Go to All Tasks', icon: ListTodo, keywords: 'all tasks every' },
];

function filterNavItems(items: typeof NAV_ITEMS, query: string) {
  if (query.length < 2) return items;
  const q = query.toLowerCase();
  return items.filter(item =>
    item.label.toLowerCase().includes(q) || item.keywords.includes(q)
  );
}

export const CommandPalette = memo(function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const router = useRouter();

  const filteredNavItems = filterNavItems(NAV_ITEMS, query);
  const totalItems = filteredNavItems.length + tasks.length;

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (query.length < 2) {
      setTasks([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/search?q=' + encodeURIComponent(query));
        const data = await res.json();
        setTasks(data);
      } catch { /* silent */ }
      finally { setSearching(false); }
    }, 150);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTasks([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const execute = useCallback((item: { id: string } | TaskWithRelations) => {
    const isTask = 'name' in item && 'listId' in item;
    if (isTask) {
      router.push('/list/' + (item as TaskWithRelations).listId + '?edit=' + item.id);
    } else {
      router.push((item as { id: string }).id);
    }
    onClose();
  }, [router, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      if (selectedIndex < filteredNavItems.length) {
        execute(filteredNavItems[selectedIndex]);
      } else {
        execute(tasks[selectedIndex - filteredNavItems.length]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed left-1/2 top-[15vh] -translate-x-1/2 z-[210] w-full max-w-lg mx-4"
          >
            <div className="bg-background border rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b">
                <Search className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search tasks or navigate..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
                />
                {searching && (
                  <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin block shrink-0" />
                )}
                <kbd className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded-md bg-muted/70 text-muted-foreground/50 font-mono">
                  ESC
                </kbd>
              </div>
              <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
                {query.length < 2 && (
                  <>
                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Quick Navigation</div>
                    {filteredNavItems.map((item, idx) => (
                      <button key={item.id} onClick={() => execute(item)}
                        className={cn('flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors text-left',
                          selectedIndex === idx ? 'bg-primary/10 text-primary' : 'hover:bg-muted')}>
                        <item.icon className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                      </button>
                    ))}
                  </>
                )}
                {query.length >= 2 && filteredNavItems.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Navigation</div>
                    {filteredNavItems.map((item, idx) => (
                      <button key={item.id} onClick={() => execute(item)}
                        className={cn('flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors text-left',
                          selectedIndex === idx ? 'bg-primary/10 text-primary' : 'hover:bg-muted')}>
                        <item.icon className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                      </button>
                    ))}
                  </>
                )}
                {tasks.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" /> Tasks
                    </div>
                    {tasks.map((task, idx) => {
                      const globalIdx = filteredNavItems.length + idx;
                      return (
                        <button key={task.id} onClick={() => execute(task)}
                          className={cn('flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors text-left',
                            selectedIndex === globalIdx ? 'bg-primary/10 text-primary' : 'hover:bg-muted')}>
                          <div className={cn('h-2 w-2 rounded-full shrink-0',
                            task.completed ? 'bg-primary/40' : task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-muted-foreground/30')} />
                          <span className="flex-1 truncate">{task.name}</span>
                          {task.list && <span className="text-[10px] text-muted-foreground/50 shrink-0">{task.list.icon}</span>}
                          {task.date && <span className="text-[10px] text-muted-foreground/40 shrink-0 tabular-nums">{task.date}</span>}
                        </button>
                      );
                    })}
                  </>
                )}
                {query.length >= 2 && !searching && tasks.length === 0 && filteredNavItems.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Search className="h-8 w-8 text-muted-foreground/20 mb-2" />
                    <p className="text-sm text-muted-foreground/60">No results for &ldquo;{query}&rdquo;</p>
                    <p className="text-xs text-muted-foreground/40 mt-1">Try a different search term</p>
                  </div>
                )}
                {query.length === 0 && (
                  <div className="flex items-center justify-center py-3 text-[10px] text-muted-foreground/40 gap-3">
                    <span>↑↓ Navigate</span>
                    <span>↵ Open</span>
                    <span>ESC Close</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
