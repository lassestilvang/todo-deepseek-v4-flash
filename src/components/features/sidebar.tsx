'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CalendarRange,
  ListTodo,
  Layers,
  Sun,
  Moon,
  Monitor,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Search,
  LayoutList,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/theme-provider';
import { useListCache, useLabelCache, useTaskCounts, invalidateCache } from '@/hooks/use-cache';
import type { TaskWithRelations } from '@/types';

const views = [
  { id: 'today', label: 'Today', icon: Calendar, href: '/today' },
  { id: 'next-7-days', label: 'Next 7 Days', icon: CalendarRange, href: '/next-7-days' },
  { id: 'upcoming', label: 'Upcoming', icon: Layers, href: '/upcoming' },
  { id: 'all', label: 'All Tasks', icon: ListTodo, href: '/all' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { lists } = useListCache();
  const { labels } = useLabelCache();
  const { counts } = useTaskCounts();
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingList, setEditingList] = useState<string | null>(null);
  const [editListName, setEditListName] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TaskWithRelations[]>([]);
  const [showNewLabel, setShowNewLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setConfirmingDelete(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const createList = async () => {
    if (!newListName.trim()) return;
    const colors = ['#d97706', '#059669', '#6366f1', '#dc2626', '#7c3aed', '#db2777', '#0284c7'];
    const icons = ['📋', '🎯', '⭐', '💼', '🏠', '📚', '🎨', '💪', '🎵', '✈️'];
    await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newListName,
        color: colors[Math.floor(Math.random() * colors.length)],
        icon: icons[Math.floor(Math.random() * icons.length)],
      }),
    });
    invalidateCache('lists');
    invalidateCache('task-counts');
    setNewListName('');
    setShowNewList(false);
  };

  const updateList = async (id: string) => {
    if (!editListName.trim()) return;
    await fetch('/api/lists', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editListName }),
    });
    invalidateCache('lists');
    setEditingList(null);
  };

  const deleteList = async (id: string) => {
    invalidateCache('lists');
    invalidateCache('task-counts');
    setConfirmingDelete(null);
    try {
      const res = await fetch('/api/lists', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) { console.error('Failed to delete list', await res.text()); return; }
    } catch (e) {
      console.error('Failed to delete list', e);
    }
  };

  const createLabel = async () => {
    if (!newLabelName.trim()) return;
    const colors = ['#d97706', '#059669', '#6366f1', '#dc2626', '#7c3aed', '#db2777', '#0284c7'];
    const icons = ['🏷️', '🔖', '⭐', '❤️', '💡', '🎯', '📌', '🔥', '💎', '⚡'];
    await fetch('/api/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newLabelName,
        color: colors[Math.floor(Math.random() * colors.length)],
        icon: icons[Math.floor(Math.random() * icons.length)],
      }),
    });
    invalidateCache('labels');
    invalidateCache('task-counts');
    setNewLabelName('');
    setShowNewLabel(false);
  };

  const deleteLabel = async (id: string) => {
    invalidateCache('labels');
    invalidateCache('task-counts');
    setConfirmingDelete(null);
    try {
      const res = await fetch('/api/labels', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) { console.error('Failed to delete label', await res.text()); return; }
    } catch (e) {
      console.error('Failed to delete label', e);
    }
  };

  const doSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        setSearchResults(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 200);
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <aside ref={sidebarRef} className="hidden md:flex flex-col w-64 border-r bg-sidebar text-sidebar-foreground shrink-0 overflow-hidden">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-primary">Planner</span>
            </h1>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSearchOpen(!searchOpen)}>
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : theme === 'light' ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Search tasks..."
                className="pl-8 h-8 text-sm rounded-lg"
                value={searchQuery}
                onChange={(e) => doSearch(e.target.value)}
                autoFocus
              />
              {searching && (
                <div className="absolute right-2.5 top-2.5">
                  <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin block" />
                </div>
              )}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-xl shadow-xl max-h-72 overflow-y-auto z-50 p-1">
                  {searchResults.map((task) => (
                    <Link
                      key={task.id}
                      href={`/list/${task.listId}?edit=${task.id}`}
                      prefetch={true}
                      className="block px-3 py-2.5 text-sm rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="font-medium leading-tight">{task.name}</div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground/70 truncate mt-0.5">{task.description}</div>
                      )}
                      {task.list && <div className="text-xs text-muted-foreground/50 mt-0.5">{task.list.icon} {task.list.name}</div>}
                    </Link>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-xl shadow-xl z-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground/70">No tasks found for &ldquo;{searchQuery}&rdquo;</p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <div className="px-2 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Views</span>
          </div>
          {views.map((view) => {
            const Icon = view.icon;
            const active = isActive(view.href);
            const count = view.id === 'today' ? counts.today
              : view.id === 'next-7-days' ? counts.next7Days
              : view.id === 'upcoming' ? counts.upcoming
              : view.id === 'all' ? counts.total : 0;
            return (
              <Link
                key={view.id}
                href={view.href}
                prefetch={true}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={cn('h-4 w-4 shrink-0', active && 'drop-shadow-sm')} />
                <span className="flex-1">{view.label}</span>
                {count > 0 && (
                  <span className={cn(
                    'text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md',
                    active ? 'bg-primary/15 text-primary' : 'bg-muted/50 text-muted-foreground/70'
                  )}>
                    {count}
                  </span>
                )}
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                  />
                )}
              </Link>
            );
          })}

          <Separator className="my-3" />

          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
              <LayoutList className="h-3 w-3" />
              Lists
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => setShowNewList(true)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <AnimatePresence>
            {showNewList && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={(e) => { e.preventDefault(); createList(); }}
                  className="flex items-center gap-1 px-1 py-1"
                >
                  <Input
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="List name..."
                    className="h-8 text-sm rounded-lg"
                    autoFocus
                  />
                  <Button type="submit" size="icon" variant="ghost" className="h-7 w-7 rounded-md">
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md" onClick={() => setShowNewList(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {lists.map((list) => {
            const listCount = counts.byList[list.id] || 0;
            const active = isActive(`/list/${list.id}`);
            return (
              <div key={list.id} className="group relative">
                {editingList === list.id ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); updateList(list.id); }}
                    className="flex items-center gap-1 px-1 py-1"
                  >
                    <Input
                      value={editListName}
                      onChange={(e) => setEditListName(e.target.value)}
                      className="h-8 text-sm rounded-lg"
                      autoFocus
                    />
                    <Button type="submit" size="icon" variant="ghost" className="h-7 w-7 rounded-md">
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                ) : (
                  <Link
                    href={`/list/${list.id}`}
                    prefetch={true}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group/link',
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                        : 'hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="text-base shrink-0">{list.icon}</span>
                    <span className="flex-1 truncate">{list.name}</span>
                    {listCount > 0 && (
                      <span className="text-[11px] tabular-nums text-muted-foreground/60 mr-1">{listCount}</span>
                    )}
                    {!list.isDefault && (
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setEditingList(list.id);
                            setEditListName(list.name);
                          }}
                          className="p-1 rounded-md hover:bg-sidebar-accent transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        {confirmingDelete === `list:${list.id}` ? (
                          <span className="flex items-center gap-0.5 text-xs">
                            <button
                              onClick={(e) => { e.preventDefault(); deleteList(list.id); }}
                              className="p-1 rounded-md text-destructive hover:bg-destructive/15 font-medium"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.preventDefault(); setConfirmingDelete(null); }}
                              className="p-1 rounded-md hover:bg-sidebar-accent"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setConfirmingDelete(`list:${list.id}`);
                            }}
                            className="p-1 rounded-md hover:bg-destructive/15 text-destructive/70 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </Link>
                )}
              </div>
            );
          })}

          <Separator className="my-3" />

          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
              <Tag className="h-3 w-3" />
              Labels
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => setShowNewLabel(true)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <AnimatePresence>
            {showNewLabel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={(e) => { e.preventDefault(); createLabel(); }}
                  className="flex items-center gap-1 px-1 py-1"
                >
                  <Input
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Label name..."
                    className="h-8 text-sm rounded-lg"
                    autoFocus
                  />
                  <Button type="submit" size="icon" variant="ghost" className="h-7 w-7 rounded-md">
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md" onClick={() => setShowNewLabel(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {labels.map((label) => {
            const labelCount = counts.byLabel[label.id] || 0;
            return (
              <div key={label.id} className="group relative">
                <Link
                  href={`/label/${label.id}`}
                  prefetch={true}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive(`/label/${label.id}`)
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                      : 'hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                  aria-current={isActive(`/label/${label.id}`) ? 'page' : undefined}
                >
                  <span className="text-base shrink-0">{label.icon}</span>
                  <span className="flex-1 truncate">{label.name}</span>
                  {labelCount > 0 && (
                    <span className="text-[11px] tabular-nums text-muted-foreground/60 mr-1">{labelCount}</span>
                  )}
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    {confirmingDelete === `label:${label.id}` ? (
                      <span className="flex items-center gap-0.5 text-xs">
                        <button
                          onClick={(e) => { e.preventDefault(); deleteLabel(label.id); }}
                          className="p-1 rounded-md text-destructive hover:bg-destructive/15 font-medium"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); setConfirmingDelete(null); }}
                          className="p-1 rounded-md hover:bg-sidebar-accent"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setConfirmingDelete(`label:${label.id}`);
                        }}
                        className="p-1 rounded-md hover:bg-destructive/15 text-destructive/70 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
