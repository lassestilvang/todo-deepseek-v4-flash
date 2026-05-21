'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Eye, EyeOff, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskCard } from './task-card';
import { TaskDialog } from './task-dialog';
import { useToast } from '@/components/toast-provider';
import { invalidateCache } from '@/hooks/use-cache';
import type { TaskWithRelations } from '@/types';

interface TaskListViewProps {
  title: string;
  description?: string;
  endpoint: string;
  showViewToggle?: boolean;
  emptyMessage?: string;
}

export function TaskListView({ title, description, endpoint, showViewToggle = true, emptyMessage = 'No tasks yet' }: TaskListViewProps) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | undefined>();
  const [dialogKey, setDialogKey] = useState(0);
  const fetchRef = useRef(0);
  const { toast } = useToast();

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
    setLoading(true);
    const ac = new AbortController();
    fetchTasks(ac.signal);
    return () => ac.abort();
  }, [fetchTasks]);

  const handleToggle = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const toggled = {
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : null,
    };
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
      toast(toggled.completed ? 'Task completed' : 'Task reopened', 'success');
    } catch (e) {
      startTransition(() => {
        setTasks(prev => prev.map(t => t.id === id ? task : t));
      });
      toast('Failed to update task', 'error');
      console.error('Toggle failed, reverted', e);
    }
  }, [tasks, toast]);

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
      toast('Task deleted', 'success');
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

  const displayedTasks = showCompleted ? tasks : tasks.filter(t => !t.completed);
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

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
          <Button size="sm" className="h-8 text-xs rounded-xl shadow-sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Task
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground/60 mb-4 tabular-nums">
        {activeTasks.length} active{completedTasks.length > 0 && `, ${completedTasks.length} completed`}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {displayedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-5">
                  <ListTodo className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground/70 font-medium">{emptyMessage}</p>
                <p className="text-xs text-muted-foreground/50 mt-1 mb-4">Stay productive, stay organized</p>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create your first task
                </Button>
              </div>
            ) : (
              displayedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      <TaskDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSave={() => {
          fetchTasks();
          invalidateCache('task-counts');
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
