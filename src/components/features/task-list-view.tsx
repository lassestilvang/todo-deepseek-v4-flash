'use client';

import { useState, useEffect, useCallback, useRef, startTransition, useDeferredValue, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Plus, Eye, EyeOff, Zap, CalendarDays, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskCard } from './task-card';
import { LazyTaskCardWrapper } from './lazy-task-card-wrapper';
import { EmptyState } from './empty-state';
import type { EmptyStateType } from './empty-state';
import { useToast } from '@/components/toast-provider';
import { invalidateCache } from '@/hooks/use-cache';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcut';
import { cn, formatRelativeDate, isToday, isTomorrow } from '@/lib/utils';
import type { TaskWithRelations } from '@/types';

const TaskDialog = dynamic(() => import('./task-dialog').then(mod => mod.TaskDialog), {
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-[600px] max-h-[85vh] p-6 animate-fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded-xl w-1/3" />
          <div className="h-4 bg-muted rounded-xl w-1/2" />
          <div className="h-12 bg-muted rounded-xl w-full" />
          <div className="h-24 bg-muted rounded-xl w-full" />
          <div className="flex gap-4">
            <div className="h-10 bg-muted rounded-xl flex-1" />
            <div className="h-10 bg-muted rounded-xl flex-1" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <div className="h-9 bg-muted rounded-xl w-20" />
            <div className="h-9 bg-muted rounded-xl w-28" />
          </div>
        </div>
      </div>
    </div>
  ),
});

interface TaskListViewProps {
  title: string;
  description?: string;
  endpoint: string;
  showViewToggle?: boolean;
  emptyMessage?: string;
}

const TaskCardMemo = memo(TaskCard);

export function TaskListView({ title, description, endpoint, showViewToggle = true, emptyMessage = 'No tasks yet' }: TaskListViewProps) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | undefined>();
  const [dialogKey, setDialogKey] = useState(0);
  const [quickAddValue, setQuickAddValue] = useState('');
  const [quickAddFocused, setQuickAddFocused] = useState(false);
  const quickAddRef = useRef<HTMLInputElement>(null);
  const fetchRef = useRef(0);
  const { toast } = useToast();

  // Determine empty state type from current pathname - computed once
  const pathname = usePathname();
  const emptyStateType = useMemo<EmptyStateType>(() => {
    if (pathname.startsWith('/today')) return 'today';
    if (pathname.startsWith('/next-7-days')) return 'next-7-days';
    if (pathname.startsWith('/upcoming')) return 'upcoming';
    if (pathname.startsWith('/all')) return 'all';
    if (pathname.startsWith('/list')) return 'list';
    if (pathname.startsWith('/label')) return 'label';
    return 'default';
  }, [pathname]);

  // Use deferred value for rendered tasks to avoid jank during updates
  const deferredTasks = useDeferredValue(tasks);
  const isStale = tasks !== deferredTasks;

  const fetchTasks = useCallback(async (signal?: AbortSignal) => {
    const id = ++fetchRef.current;
    try {
      const res = await fetch(endpoint, { signal });
      if (id !== fetchRef.current) return;
      const data = await res.json();
      if (id !== fetchRef.current) return;
      setTasks(data);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('Failed to fetch tasks', e);
      }
    } finally {
      if (id === fetchRef.current) {
        setLoading(false);
      }
    }
  }, [endpoint]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional loading state
    setLoading(true);
    const ac = new AbortController();
    fetchTasks(ac.signal);
    return () => ac.abort();
  }, [fetchTasks]);

  // Track if we've handled the edit URL param to avoid re-triggers
  const handledEditRef = useRef(false);

  useEffect(() => {
    if (handledEditRef.current || tasks.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (editId) {
      const task = tasks.find(t => t.id === editId);
      if (task && !dialogOpen) {
        handledEditRef.current = true;
        setEditingTask(task);
        setDialogKey(k => k + 1);
        setDialogOpen(true);
      }
    }
  }, [tasks, dialogOpen]);

  useEffect(() => {
    if (!dialogOpen) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('edit')) {
        url.searchParams.delete('edit');
        window.history.replaceState({}, '', url.toString());
        handledEditRef.current = false;
      }
    }
  }, [dialogOpen]);

  const toggleRef = useRef<((id: string) => void) | null>(null);

  const handleToggle = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const toggled = {
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : null,
    };
    const wasCompleted = task.completed;
    startTransition(() => {
      setTasks(prev => prev.map(t => t.id === id ? toggled : t));
    });

    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, _action: 'toggle' }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      const updated = await res.json();
      startTransition(() => {
        setTasks(prev => prev.map(t => t.id === id ? updated : t));
      });
      invalidateCache('task-counts');
      toast(wasCompleted ? 'Task reopened' : 'Task completed', 'success', {
        label: 'Undo',
        onClick: () => toggleRef.current?.(id),
      });
    } catch (e) {
      startTransition(() => {
        setTasks(prev => prev.map(t => t.id === id ? task : t));
      });
      toast('Failed to update task', 'error');
      console.error('Toggle failed, reverted', e);
    }
  }, [tasks, toast]);

  useEffect(() => { toggleRef.current = handleToggle; }, [handleToggle]);

  const handleDelete = useCallback(async (id: string) => {
    const previousTasks = tasks;
    startTransition(() => {
      setTasks(prev => prev.filter(t => t.id !== id));
    });

    try {
      const res = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      invalidateCache('task-counts');
      toast('Task deleted', 'success', {
        label: 'Undo',
        onClick: async () => {
          const prev = previousTasks.find(t => t.id === id);
          if (prev) {
            startTransition(() => setTasks(p => [...p, prev]));
            await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: prev.name, description: prev.description, date: prev.date, priority: prev.priority, listId: prev.listId }),
            });
            invalidateCache('task-counts');
          }
        },
      });
    } catch (e) {
      startTransition(() => {
        setTasks(previousTasks);
      });
      toast('Failed to delete task', 'error');
      console.error('Delete failed, reverted', e);
    }
  }, [tasks, toast]);

  const handleEdit = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setEditingTask(task);
      setDialogKey(k => k + 1);
      setDialogOpen(true);
    }
  }, [tasks]);

  const openCreate = useCallback(() => {
    setEditingTask(undefined);
    setDialogKey(k => k + 1);
    setDialogOpen(true);
  }, []);

  useKeyboardShortcuts([
    { key: 'n', handler: openCreate, enabled: !dialogOpen },
    { key: 'a', handler: () => quickAddRef.current?.focus(), enabled: !dialogOpen },
    { key: 'q', handler: () => quickAddRef.current?.focus(), enabled: !dialogOpen },
  ]);

  const handleQuickAdd = useCallback(async () => {
    if (!quickAddValue.trim()) return;
    const name = quickAddValue.trim();
    setQuickAddValue('');
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          date: window.location.pathname === '/today' ? new Date().toISOString().split('T')[0] : undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      const saved = await res.json();
      startTransition(() => {
        setTasks(prev => [saved, ...prev]);
      });
      invalidateCache('task-counts');
      toast('Task created', 'success');
    } catch (e) {
      toast('Failed to create task', 'error');
      console.error('Quick add failed', e);
    }
  }, [quickAddValue, toast]);

  const displayedTasks = useMemo(
    () => showCompleted ? deferredTasks : deferredTasks.filter(t => !t.completed),
    [showCompleted, deferredTasks]
  );

  // Group tasks by date for upcoming/7-days views
  const shouldGroupByDate = useMemo(
    () => pathname.startsWith('/today') || pathname.startsWith('/next-7-days') || pathname.startsWith('/upcoming'),
    [pathname]
  );
  const groupedTasks = useMemo(() => {
    if (!shouldGroupByDate) return null;
    const groups: Record<string, TaskWithRelations[]> = {};
    const activeTasks = displayedTasks.filter(t => !t.completed);
    for (const task of activeTasks) {
      const key = task.date || 'unscheduled';
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    }
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === 'unscheduled') return 1;
      if (b === 'unscheduled') return -1;
      return a.localeCompare(b);
    });
  }, [displayedTasks, shouldGroupByDate]);

  const getDateLabel = (dateStr: string) => {
    if (dateStr === 'unscheduled') return 'Unscheduled';
    if (isToday(dateStr)) return 'Today';
    if (isTomorrow(dateStr)) return 'Tomorrow';
    return formatRelativeDate(dateStr);
  };
  const activeTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);

  const handleClearCompleted = useCallback(async () => {
    const completed = tasks.filter(t => t.completed);
    if (completed.length === 0) return;
    const ids = completed.map(t => t.id);
    startTransition(() => {
      setTasks(prev => prev.filter(t => !t.completed));
    });
    try {
      const res = await fetch('/api/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error('Failed to clear completed');
      invalidateCache('task-counts');
      toast(`Cleared ${completed.length} completed task${completed.length > 1 ? 's' : ''}`, 'success');
    } catch (e) {
      // Revert on failure - re-fetch tasks
      toast('Failed to clear completed tasks', 'error');
      console.error('Clear completed failed', e);
    }
  }, [tasks, toast]);

  const handleSave = useCallback((saved: TaskWithRelations) => {
    startTransition(() => {
      setTasks(prev => {
        const exists = prev.find(t => t.id === saved.id);
        if (exists) return prev.map(t => t.id === saved.id ? saved : t);
        return [saved, ...prev];
      });
    });
    invalidateCache('task-counts');
    setDialogOpen(false);
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground/70 mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showViewToggle && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-xl"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? (
                <EyeOff className="h-3.5 w-3.5 mr-1" />
              ) : (
                <Eye className="h-3.5 w-3.5 mr-1" />
              )}
              {showCompleted ? 'Hide' : 'Show'} completed
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-xl"
            onClick={() => {
              setLoading(true);
              fetchTasks();
            }}
            title="Refresh tasks"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-8 text-xs rounded-xl shadow-sm relative active:scale-95 transition-transform" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Task
            <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 tabular-nums hidden sm:inline">N</span>
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground/60 mb-4 tabular-nums">
        {activeTasks.length} active{completedTasks.length > 0 && `, ${completedTasks.length} completed`}
        <span className="ml-3 text-muted-foreground/30 hidden sm:inline">· N to add · Q to quick-add</span>
      </div>

      {/* Quick Add */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleQuickAdd(); }}
        className={cn(
          'mb-4 flex items-center gap-2 rounded-xl border bg-card p-3 sm:p-3 min-h-[48px] transition-all duration-200 group',
          quickAddFocused ? 'border-primary/40 shadow-sm shadow-primary/5' : 'border-border hover:border-primary/20'
        )}
      >
        <Zap className={cn('h-4 w-4 sm:h-4 sm:w-4 shrink-0 transition-colors', quickAddFocused ? 'text-primary' : 'text-muted-foreground/40')} />
        <Input
          ref={quickAddRef}
          value={quickAddValue}
          onChange={(e) => setQuickAddValue(e.target.value)}
          placeholder="Quick add a task..."
          className="h-8 sm:h-8 border-0 bg-transparent px-0 text-base sm:text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/40"
          onFocus={() => setQuickAddFocused(true)}
          onBlur={() => setQuickAddFocused(false)}
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <kbd className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded-md bg-muted/70 text-muted-foreground/50 font-mono tabular-nums group-focus-within:text-muted-foreground/70 transition-colors">
            <span className="text-[8px] mr-0.5 opacity-60">⌘</span>Q
          </kbd>
          <kbd className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded-md bg-muted/70 text-muted-foreground/50 font-mono tabular-nums group-focus-within:text-muted-foreground/70 transition-colors">
            ⏎
          </kbd>
        </div>
      </form>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-4 animate-pulse" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-muted/60 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="space-y-2">
          {displayedTasks.length === 0 ? (
              <EmptyState
                type={emptyStateType}
                onCreate={openCreate}
                onFocusQuickAdd={() => quickAddRef.current?.focus()}
              />
            ) : (
              <>
                {/* Active Tasks */}
                {groupedTasks ? (
                  // Date-grouped view (today, next-7-days, upcoming)
                  groupedTasks.map(([dateStr, dateTasks]) => (
                    <div key={dateStr}>
                      <div className="flex items-center gap-2 px-1 py-2 mt-2 first:mt-0">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                        <span className="text-xs font-semibold text-muted-foreground/60">{getDateLabel(dateStr)}</span>
                        <span className="text-[10px] text-muted-foreground/30 tabular-nums">{dateTasks.length}</span>
                        <div className="flex-1 h-px bg-border/50" />
                      </div>
                      <div className="space-y-2">
                        {dateTasks.map((task, idx) => (
                          <LazyTaskCardWrapper key={task.id} id={task.id} style={{ animationDelay: `${idx * 0.03}s` }}>
                            <TaskCardMemo
                              task={task}
                              onToggle={handleToggle}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          </LazyTaskCardWrapper>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Flat view (all, list, label)
                  displayedTasks.filter(t => !t.completed).map((task, idx) => (
                    <LazyTaskCardWrapper key={task.id} id={task.id} style={{ animationDelay: `${idx * 0.03}s` }}>
                      <TaskCardMemo
                        task={task}
                        onToggle={handleToggle}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </LazyTaskCardWrapper>
                  ))
                )}

                {/* Completed Tasks Section */}
                {showCompleted && completedTasks.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 pt-4 pb-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[11px] font-medium text-muted-foreground/50 shrink-0">
                        Completed ({completedTasks.length})
                      </span>
                      <div className="flex-1 h-px bg-border" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-muted-foreground/50 hover:text-destructive rounded-lg shrink-0"
                        onClick={handleClearCompleted}
                      >
                        Clear all
                      </Button>
                    </div>
                    {displayedTasks.filter(t => t.completed).map((task, idx) => (
                      <LazyTaskCardWrapper key={task.id} id={task.id} style={{ animationDelay: `${idx * 0.03}s` }}>
                        <TaskCardMemo
                          task={task}
                          onToggle={handleToggle}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      </LazyTaskCardWrapper>
                    ))}
                  </>
                )}
              </>
            )}
        </div>
      )}

      <TaskDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSave={handleSave}
      />
    </div>
  );
}
