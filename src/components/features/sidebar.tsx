'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/theme-provider';
import type { List, Label, TaskWithRelations } from '@/types';

const views = [
  { id: 'today', label: 'Today', icon: Calendar, href: '/today' },
  { id: 'next-7-days', label: 'Next 7 Days', icon: CalendarRange, href: '/next-7-days' },
  { id: 'upcoming', label: 'Upcoming', icon: Layers, href: '/upcoming' },
  { id: 'all', label: 'All Tasks', icon: ListTodo, href: '/all' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [lists, setLists] = useState<List[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingList, setEditingList] = useState<string | null>(null);
  const [editListName, setEditListName] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TaskWithRelations[]>([]);
  const [showNewLabel, setShowNewLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/lists');
      const data = await res.json();
      setLists(data);
    } catch (e) {
      console.error('Failed to fetch lists', e);
    }
  };

  const fetchLabels = async () => {
    try {
      const res = await fetch('/api/labels');
      const data = await res.json();
      setLabels(data);
    } catch (e) {
      console.error('Failed to fetch labels', e);
    }
  };

  useEffect(() => {
    fetchLists();
    fetchLabels();
  }, []);

  const createList = async () => {
    if (!newListName.trim()) return;
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    const icons = ['📋', '🎯', '⭐', '💼', '🏠', '📚', '🎨', '💪', '🎵', '✈️'];
    const res = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newListName,
        color: colors[Math.floor(Math.random() * colors.length)],
        icon: icons[Math.floor(Math.random() * icons.length)],
      }),
    });
    if (res.ok) {
      setNewListName('');
      setShowNewList(false);
      fetchLists();
    }
  };

  const updateList = async (id: string) => {
    if (!editListName.trim()) return;
    await fetch('/api/lists', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editListName }),
    });
    setEditingList(null);
    fetchLists();
  };

  const deleteList = async (id: string) => {
    if (confirm('Delete this list? Tasks will be moved to Inbox.')) {
      await fetch('/api/lists', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      fetchLists();
    }
  };

  const createLabel = async () => {
    if (!newLabelName.trim()) return;
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    const icons = ['🏷️', '🔖', '⭐', '❤️', '💡', '🎯', '📌', '🔥', '💎', '⚡'];
    const res = await fetch('/api/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newLabelName,
        color: colors[Math.floor(Math.random() * colors.length)],
        icon: icons[Math.floor(Math.random() * icons.length)],
      }),
    });
    if (res.ok) {
      setNewLabelName('');
      setShowNewLabel(false);
      fetchLabels();
    }
  };

  const deleteLabel = async (id: string) => {
    if (confirm('Delete this label?')) {
      await fetch('/api/labels', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      fetchLabels();
    }
  };

  const doSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    }
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-sidebar text-sidebar-foreground shrink-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold tracking-tight">Planner</h1>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSearchOpen(!searchOpen)}>
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : theme === 'light' ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {searchOpen && (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-8 h-8 text-sm"
                value={searchQuery}
                onChange={(e) => doSearch(e.target.value)}
                autoFocus
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                  {searchResults.map((task) => (
                    <Link
                      key={task.id}
                      href={`/list/${task.listId}`}
                      className="block px-3 py-2 text-sm hover:bg-accent"
                    >
                      <div className="font-medium">{task.name}</div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground truncate">{task.description}</div>
                      )}
                      {task.list && <div className="text-xs text-muted-foreground">{task.list.icon} {task.list.name}</div>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Views */}
          <div className="px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Views</span>
          </div>
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <Link
                key={view.id}
                href={view.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(view.href)
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{view.label}</span>
              </Link>
            );
          })}

          <Separator className="my-3" />

          {/* Lists */}
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lists</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNewList(true)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <AnimatePresence>
            {showNewList && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-2"
              >
                <form
                  onSubmit={(e) => { e.preventDefault(); createList(); }}
                  className="flex items-center gap-1"
                >
                  <Input
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="List name..."
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button type="submit" size="icon" variant="ghost" className="h-8 w-8">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowNewList(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {lists.map((list) => (
            <div key={list.id} className="group relative">
              {editingList === list.id ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); updateList(list.id); }}
                  className="flex items-center gap-1 px-2"
                >
                  <Input
                    value={editListName}
                    onChange={(e) => setEditListName(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button type="submit" size="icon" variant="ghost" className="h-7 w-7">
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </form>
              ) : (
                <Link
                  href={`/list/${list.id}`}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive(`/list/${list.id}`)
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <span className="text-base">{list.icon}</span>
                  <span className="flex-1 truncate">{list.name}</span>
                  {!list.isDefault && (
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingList(list.id);
                          setEditListName(list.name);
                        }}
                        className="p-1 rounded hover:bg-sidebar-accent"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          deleteList(list.id);
                        }}
                        className="p-1 rounded hover:bg-destructive/20 text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </Link>
              )}
            </div>
          ))}

          <Separator className="my-3" />

          {/* Labels */}
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Labels</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNewLabel(true)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <AnimatePresence>
            {showNewLabel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-2"
              >
                <form
                  onSubmit={(e) => { e.preventDefault(); createLabel(); }}
                  className="flex items-center gap-1"
                >
                  <Input
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Label name..."
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button type="submit" size="icon" variant="ghost" className="h-8 w-8">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowNewLabel(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {labels.map((label) => (
            <div key={label.id} className="group relative">
              <Link
                href={`/label/${label.id}`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(`/label/${label.id}`)
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <span className="text-base">{label.icon}</span>
                <span className="flex-1 truncate">{label.name}</span>
                <div className="hidden group-hover:flex items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      deleteLabel(label.id);
                    }}
                    className="p-1 rounded hover:bg-destructive/20 text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}