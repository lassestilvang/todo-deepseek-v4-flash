'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Flag,
  Plus,
  X,
  List as ListIcon,
  Tags,
  Clock,
  Calendar,
  AlignLeft,
  GripVertical,
  Repeat,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label as ULabel } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import type { TaskWithRelations, Subtask, Priority, Recurrence, RecurrenceType } from '@/types';
import { useToast } from '@/components/toast-provider';
import { useListCache, useLabelCache } from '@/hooks/use-cache';
import { cn, getContrastColor } from '@/lib/utils';

const priorities = [
  { value: 'none', label: 'None', color: 'text-muted-foreground' },
  { value: 'low', label: 'Low', color: 'text-blue-500' },
  { value: 'medium', label: 'Medium', color: 'text-amber-500' },
  { value: 'high', label: 'High', color: 'text-red-500' },
];

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskWithRelations;
  onSave: (saved: TaskWithRelations) => void;
}

export function TaskDialog({ open, onOpenChange, task, onSave }: TaskDialogProps) {
  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [date, setDate] = useState(task?.date || '');
  const [deadline, setDeadline] = useState(task?.deadline || '');
  const [estimate, setEstimate] = useState(task?.estimate || '');
  const [priority, setPriority] = useState(task?.priority || 'none');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(task?.recurrence?.type || 'none');
  const [listId, setListId] = useState(task?.listId || 'inbox');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(task?.labels || []);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { lists } = useListCache();
  const { labels: allLabels } = useLabelCache();

  useEffect(() => {
    if (open) {
      // Use requestAnimationFrame for reliable focus after dialog mount
      const raf = requestAnimationFrame(() => nameInputRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
  }, [open]);

  // Reset state is handled by key prop in parent component

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const recurrence: Recurrence | null = recurrenceType === 'none' ? null : { type: recurrenceType };

    const body: {
      name: string;
      description: string;
      date: string | null;
      deadline: string | null;
      estimate: string | null;
      priority: Priority;
      listId: string;
      labels: string[];
      subtasks: { id: string; title: string; completed: boolean }[];
      recurrence: Recurrence | null;
    } = {
      name: name.trim(),
      description,
      date: date || null,
      deadline: deadline || null,
      estimate: estimate || null,
      priority: priority as Priority,
      listId,
      labels: selectedLabels,
      subtasks: subtasks.map(s => ({ id: s.id, title: s.title, completed: s.completed })),
      recurrence,
    };

    try {
      let res;
      if (task) {
        res = await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: task.id, ...body }),
        });
      } else {
        res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) throw new Error('Failed to save');
      const saved = await res.json();
      toast(task ? 'Task updated' : 'Task created', 'success');
      onSave(saved);
      onOpenChange(false);
    } catch (e) {
      toast('Failed to save task', 'error');
      console.error('Failed to save task', e);
    } finally {
      setSaving(false);
    }
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const st: Subtask = {
      id: `temp-${Date.now()}`,
      taskId: task?.id || '',
      title: newSubtask.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setSubtasks([...subtasks, st]);
    setNewSubtask('');
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-dvh sm:max-h-[85vh] overflow-y-auto gap-0 p-0 rounded-xl sm:rounded-xl sm:shadow-2xl" data-vaul-no-drag>
        <DialogHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl">
            {task ? (
              <span className="animate-slide-right" key="edit">Edit Task</span>
            ) : (
              <span className="animate-slide-right" key="new">New Task</span>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {task ? 'Update your task details.' : 'Create a new task to stay organized.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-5">
          <div>
            <Input
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What needs to be done?"
              className="text-base sm:text-lg font-semibold h-10 sm:h-11 px-3 sm:px-4 rounded-xl border-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>

          <div className="relative">
            <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="w-full rounded-xl border border-input bg-transparent pl-10 pr-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <ULabel className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Date
              </ULabel>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } }}
                />
                {date && (
                  <button
                    type="button"
                    onClick={() => setDate('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-muted transition-colors"
                    aria-label="Clear date"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <ULabel className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Deadline
              </ULabel>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                />
                {deadline && (
                  <button
                    type="button"
                    onClick={() => setDeadline('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-muted transition-colors"
                    aria-label="Clear deadline"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <ULabel className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Estimate (HH:mm)
              </ULabel>
              <Input
                type="time"
                value={estimate}
                onChange={(e) => setEstimate(e.target.value)}
                className="h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <ULabel className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Flag className="h-3.5 w-3.5" />
                Priority
              </ULabel>
              <div className="flex gap-1.5">
                {priorities.map((p) => (
                  <Button
                    key={p.value}
                    variant={priority === p.value ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'h-8 text-xs flex-1 rounded-lg transition-all',
                      priority === p.value && 'shadow-sm'
                    )}
                    onClick={() => setPriority(p.value as Priority)}
                  >
                    <Flag className={cn('h-3 w-3 mr-1', p.color)} />
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
              <ULabel className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <ListIcon className="h-3.5 w-3.5" />
                List
              </ULabel>
              <select
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.25em',
                }}
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.icon} {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <ULabel className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5" />
                Repeat
              </ULabel>
              <div className="flex flex-wrap gap-1.5">
                {(['none', 'daily', 'weekdays', 'weekly', 'monthly', 'yearly'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={recurrenceType === type ? 'default' : 'outline'}
                    size="sm"
                    className={cn('h-8 text-xs rounded-lg transition-all capitalize', recurrenceType === type && 'shadow-sm')}
                    onClick={() => setRecurrenceType(type)}
                  >
                    {type === 'none' ? 'No repeat' : type}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <ULabel className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Tags className="h-3.5 w-3.5" />
              Labels
            </ULabel>
            <div className="flex flex-wrap gap-1.5">
              {allLabels.map((label) => {
                const selected = selectedLabels.includes(label.id);
                return (
                  <Badge
                    key={label.id}
                    variant={selected ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer text-xs transition-all px-2.5 py-1 rounded-lg',
                      selected && 'shadow-sm'
                    )}
                    style={
                      selected
                        ? { backgroundColor: label.color, color: getContrastColor(label.color) }
                        : {}
                    }
                    onClick={() => {
                      setSelectedLabels((prev) =>
                        prev.includes(label.id)
                          ? prev.filter((id) => id !== label.id)
                          : [...prev, label.id]
                      );
                    }}
                  >
                    {label.icon} {label.name}
                  </Badge>
                );
              })}
              {allLabels.length === 0 && (
                <span className="text-xs text-muted-foreground">No labels yet &mdash; create one in the sidebar</span>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <ULabel className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <GripVertical className="h-3.5 w-3.5" />
              Subtasks
            </ULabel>
            <div className="space-y-1.5">
              {subtasks.map((st) => (
                <div key={st.id} className="flex items-center gap-2.5 group rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
                  <Checkbox
                    checked={st.completed}
                    onCheckedChange={() => {
                      setSubtasks(subtasks.map(s => s.id === st.id ? { ...s, completed: !s.completed } : s));
                    }}
                    className="rounded-md"
                  />
                  <span className={cn('flex-1 text-sm transition-colors', st.completed && 'line-through text-muted-foreground/60')}>
                    {st.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                    onClick={() => removeSubtask(st.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); addSubtask(); }}
              className="flex items-center gap-2"
            >
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a subtask..."
                className="h-8 text-sm rounded-lg"
              />
              <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 rounded-lg" disabled={!newSubtask.trim()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-muted/30 border-t sticky bottom-0">
          <span className="text-xs text-muted-foreground/60 hidden sm:inline">
            {task ? 'Editing existing task' : 'Press Enter to save quickly'}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl text-muted-foreground hover:text-foreground border-muted-foreground/20">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!name.trim() || saving} className={cn("rounded-xl shadow-md hover:shadow-lg transition-shadow", saving && "animate-pulse")}>
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Saving...
                </span>
              ) : (
                task ? 'Save Changes' : 'Create Task'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
