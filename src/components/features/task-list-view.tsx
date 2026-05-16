'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Eye, EyeOff, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskCard } from './task-card';
import { TaskDialog } from './task-dialog';
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

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(endpoint);
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      console.error('Failed to fetch tasks', e);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks();
  }, [fetchTasks]);

  const toggleCompletion = async (task: TaskWithRelations) => {
    await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, _action: 'toggle' }),
    });
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await fetch('/api/tasks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchTasks();
  };

  const openEdit = (task: TaskWithRelations) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingTask(undefined);
    setDialogOpen(true);
  };

  const displayedTasks = showCompleted ? tasks : tasks.filter(t => !t.completed);
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showViewToggle && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
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
          <Button size="sm" className="h-8 text-xs" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Task count */}
      <div className="text-xs text-muted-foreground mb-4">
        {activeTasks.length} active{completedTasks.length > 0 && `, ${completedTasks.length} completed`}
      </div>

      {/* Loading */}
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

      {/* Task list */}
      {!loading && (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {displayedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ListTodo className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">{emptyMessage}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create your first task
                </Button>
              </div>
            ) : (
              displayedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => toggleCompletion(task)}
                  onEdit={() => openEdit(task)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSave={fetchTasks}
      />
    </div>
  );
}