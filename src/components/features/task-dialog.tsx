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
import type { TaskWithRelations, Subtask, Label as LabelType, List, Priority } from '@/types';
import { useToast } from '@/components/toast-provider';
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
  onSave: () => void;
}

export function TaskDialog({ open, onOpenChange, task, onSave }: TaskDialogProps) {
  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [date, setDate] = useState(task?.date || '');
  const [deadline, setDeadline] = useState(task?.deadline || '');
  const [estimate, setEstimate] = useState(task?.estimate || '');
  const [priority, setPriority] = useState(task?.priority || 'none');
  const [listId, setListId] = useState(task?.listId || 'inbox');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [lists, setLists] = useState<List[]>([]);
  const [allLabels, setAllLabels] = useState<LabelType[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(task?.labels || []);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const listsFetched = useRef(false);
  const labelsFetched = useRef(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (!listsFetched.current) {
        fetch('/api/lists').then(r => r.json()).then(data => {
          setLists(data);
          listsFetched.current = true;
        }).catch(() => {});
      }
      if (!labelsFetched.current) {
        fetch('/api/labels').then(r => r.json()).then(data => {
          setAllLabels(data);
          labelsFetched.current = true;
        }).catch(() => {});
      }
      if (!task) {
        setTimeout(() => nameInputRef.current?.focus(), 100);
      }
    }
  }, [open, task]);

  useEffect(() => {
    if (!open) {
      listsFetched.current = false;
      labelsFetched.current = false;
    }
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

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
    };

    try {
      if (task) {
        await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: task.id, ...body }),
        });
      } else {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      toast(task ? 'Task updated' : 'Task created', 'success');
      onSave();
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
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl">{task ? 'Edit Task' : 'New Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update your task details.' : 'Create a new task to stay organized.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          <div>
            <Input
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What needs to be done?"
              className="text-lg font-semibold h-11 px-4 rounded-xl border-2 focus:border-primary/50"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <ULabel className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Date
              </ULabel>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
              />
            </div>

            <div className="space-y-2">
              <ULabel className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Deadline
              </ULabel>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
              />
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
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

            <div className="space-y-2 sm:col-span-2">
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

        <div className="flex items-center justify-between gap-2 px-6 py-4 bg-muted/30 border-t">
          <span className="text-xs text-muted-foreground/60">
            {task ? 'Editing existing task' : 'Press Enter to save quickly'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving} className="rounded-xl shadow-sm">
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
