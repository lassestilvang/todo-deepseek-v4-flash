'use client';

import { useState, useEffect } from 'react';
import {
  Flag,
  Plus,
  X,
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
import { cn, getContrastColor } from '@/lib/utils';

const priorities = [
  { value: 'none', label: 'None', color: 'text-muted-foreground' },
  { value: 'low', label: 'Low', color: 'text-blue-500' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-500' },
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

  useEffect(() => {
    fetch('/api/lists').then(r => r.json()).then(data => setLists(data)).catch(() => {});
    fetch('/api/labels').then(r => r.json()).then(data => setAllLabels(data)).catch(() => {});
  }, []);

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
      onSave();
      onOpenChange(false);
    } catch (e) {
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
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update your task details.' : 'Create a new task to stay organized.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Task name..."
              className="text-lg font-medium h-10"
              autoFocus={!task}
            />
          </div>

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date */}
            <div className="space-y-1.5">
              <ULabel className="text-xs text-muted-foreground">Date</ULabel>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <ULabel className="text-xs text-muted-foreground">Deadline</ULabel>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Estimate */}
            <div className="space-y-1.5">
              <ULabel className="text-xs text-muted-foreground">Estimate (HH:mm)</ULabel>
              <Input
                type="time"
                value={estimate}
                onChange={(e) => setEstimate(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <ULabel className="text-xs text-muted-foreground">Priority</ULabel>
              <div className="flex gap-1">
                {priorities.map((p) => (
                  <Button
                    key={p.value}
                    variant={priority === p.value ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs flex-1"
                    onClick={() => setPriority(p.value as Priority)}
                  >
                    <Flag className={cn('h-3 w-3 mr-1', p.color)} />
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="space-y-1.5">
              <ULabel className="text-xs text-muted-foreground">List</ULabel>
              <select
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.icon} {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-1.5">
            <ULabel className="text-xs text-muted-foreground">Labels</ULabel>
            <div className="flex flex-wrap gap-1.5">
              {allLabels.map((label) => (
                <Badge
                  key={label.id}
                  variant={selectedLabels.includes(label.id) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  style={
                    selectedLabels.includes(label.id)
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
              ))}
              {allLabels.length === 0 && (
                <span className="text-xs text-muted-foreground">No labels yet</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Subtasks */}
          <div className="space-y-2">
            <ULabel className="text-xs text-muted-foreground">Subtasks</ULabel>
            <div className="space-y-1">
              {subtasks.map((st) => (
                <div key={st.id} className="flex items-center gap-2 group">
                  <Checkbox
                    checked={st.completed}
                    onCheckedChange={() => {
                      setSubtasks(subtasks.map(s => s.id === st.id ? { ...s, completed: !s.completed } : s));
                    }}
                  />
                  <span className={cn('flex-1 text-sm', st.completed && 'line-through text-muted-foreground')}>
                    {st.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
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
                placeholder="Add subtask..."
                className="h-8 text-sm"
              />
              <Button type="submit" size="sm" variant="ghost" className="h-8">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}