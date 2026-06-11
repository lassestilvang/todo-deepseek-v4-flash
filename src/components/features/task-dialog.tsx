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
  GripVertical,
  Repeat,
  Bell,
  History,
  FileText,
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
import type { TaskWithRelations, Subtask, Priority, Recurrence, RecurrenceType, Reminder } from '@/types';
import { useToast } from '@/components/toast-provider';
import { useListCache, useLabelCache } from '@/hooks/use-cache';
import { cn, getContrastColor, parseNaturalDate } from '@/lib/utils';

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
  const [recurrenceInterval, setRecurrenceInterval] = useState(task?.recurrence?.interval || 1);
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>(task?.recurrence?.daysOfWeek || []);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState<number | undefined>(task?.recurrence?.dayOfMonth);
  const [recurrenceMonthOfYear, setRecurrenceMonthOfYear] = useState<number | undefined>(task?.recurrence?.monthOfYear);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string | undefined>(task?.recurrence?.endDate);
  const [listId, setListId] = useState(task?.listId || 'inbox');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || []);
  const [reminders, setReminders] = useState<Omit<Reminder, 'taskId' | 'sent'>[]>(task?.reminders || []);
  const [activityLogs, setActivityLogs] = useState<TaskWithRelations['activityLogs']>(task?.activityLogs || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(task?.labels || []);
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { lists } = useListCache();
  const { labels: allLabels } = useLabelCache();

  useEffect(() => {
    if (open) {
      // Use requestAnimationFrame for reliable focus after dialog mount
      const raf = requestAnimationFrame(() => nameInputRef.current?.focus());

      // Fetch full task details (reminders, activity logs) if editing
      if (task) {
        fetch(`/api/tasks?id=${task.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.reminders) setReminders(data.reminders);
            if (data.activityLogs) setActivityLogs(data.activityLogs);
          })
          .catch(console.error);
      }

      return () => cancelAnimationFrame(raf);
    }
  }, [open, task]);

  // Reset state is handled by key prop in parent component

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const recurrence: Recurrence | null = recurrenceType === 'none' ? null : { 
      type: recurrenceType, 
      interval: recurrenceInterval,
      daysOfWeek: recurrenceDaysOfWeek.length > 0 ? recurrenceDaysOfWeek : undefined,
      dayOfMonth: recurrenceDayOfMonth,
      monthOfYear: recurrenceMonthOfYear,
      endDate: recurrenceEndDate,
    };

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
      reminders: { id: string; time: string; type: Reminder['type'] }[];
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
      reminders: reminders.map(r => ({ id: r.id, time: r.time, type: r.type })),
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
      position: subtasks.length,
      createdAt: new Date().toISOString(),
    };
    setSubtasks([...subtasks, st]);
    setNewSubtask('');
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const addReminder = () => {
    const r: Omit<Reminder, 'taskId' | 'sent'> = {
      id: `temp-${Date.now()}`,
      time: new Date(Date.now() + 3600000).toISOString().slice(0, 16), // 1 hour from now
      type: 'notification',
    };
    setReminders([...reminders, r]);
  };

  const removeReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const updateReminder = (id: string, updates: Partial<Omit<Reminder, 'taskId' | 'sent'>>) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-dvh sm:max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0 rounded-xl sm:rounded-xl sm:shadow-2xl">
        <DialogHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-2 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
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
            </div>
            {task && (
              <div className="flex bg-muted/50 p-1 rounded-xl">
                <Button
                  variant={activeTab === 'details' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn("h-8 rounded-lg text-xs gap-1.5 px-3", activeTab === 'details' && "shadow-sm bg-background")}
                  onClick={() => setActiveTab('details')}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Details
                </Button>
                <Button
                  variant={activeTab === 'activity' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn("h-8 rounded-lg text-xs gap-1.5 px-3", activeTab === 'activity' && "shadow-sm bg-background")}
                  onClick={() => setActiveTab('activity')}
                >
                  <History className="h-3.5 w-3.5" />
                  Activity
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' ? (
            <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
              {/* Task Name & Description */}
              <div className="space-y-4">
                <Input
                  ref={nameInputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What needs to be done?"
                  className="text-base sm:text-xl font-bold h-auto py-2 px-0 border-none focus-visible:ring-0 placeholder:text-muted-foreground/30 bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSave();
                    }
                  }}
                />
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description..."
                    rows={3}
                    className="w-full bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground/40 leading-relaxed"
                  />
                </div>
              </div>

              <Separator className="opacity-50" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                {/* Date & Deadline */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <ULabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-primary/60" />
                      Schedule
                    </ULabel>
                    <div className="flex gap-2">
                      <div className="relative group flex-1">
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full h-9 rounded-xl border border-input bg-muted/20 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                        />
                        {date && (
                          <button
                            type="button"
                            onClick={() => setDate('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-background shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      <div className="relative group w-32">
                        <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40 pointer-events-none" />
                        <input
                          type="time"
                          value={estimate}
                          onChange={(e) => setEstimate(e.target.value)}
                          className="w-full h-9 rounded-xl border border-input bg-muted/20 pl-7 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                          placeholder="Est."
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Natural date (e.g. 'tomorrow')"
                        className="w-full h-7 bg-transparent border-b border-dashed border-muted-foreground/20 px-1 text-[11px] text-muted-foreground/70 placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40 transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value;
                            if (val.trim()) {
                              const parsed = parseNaturalDate(val.trim());
                              if (parsed.date) {
                                setDate(parsed.date);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <ULabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                      <Clock className="h-3 w-3 text-destructive/60" />
                      Deadline
                    </ULabel>
                    <div className="relative group">
                      <input
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full h-9 rounded-xl border border-input bg-muted/20 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                      />
                      {deadline && (
                        <button
                          type="button"
                          onClick={() => setDeadline('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-background shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <ULabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                      <Flag className="h-3 w-3 text-primary/60" />
                      Priority
                    </ULabel>
                    <div className="flex p-1 bg-muted/30 rounded-xl gap-1">
                      {priorities.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => setPriority(p.value as Priority)}
                          className={cn(
                            "flex-1 h-8 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5",
                            priority === p.value 
                              ? "bg-background shadow-sm text-foreground" 
                              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                          )}
                        >
                          <Flag className={cn("h-3 w-3", priority === p.value ? p.color : "text-muted-foreground/40")} />
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* List & Labels */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <ULabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                      <ListIcon className="h-3 w-3 text-primary/60" />
                      List
                    </ULabel>
                    <select
                      value={listId}
                      onChange={(e) => setListId(e.target.value)}
                      className="w-full h-9 rounded-xl border border-input bg-muted/20 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all appearance-none"
                    >
                      {lists.map((l) => (
                        <option key={l.id} value={l.id}>{l.icon} {l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <ULabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                      <Tags className="h-3 w-3 text-primary/60" />
                      Labels
                    </ULabel>
                    <div className="flex flex-wrap gap-1.5 p-1 bg-muted/30 rounded-xl min-h-[44px]">
                      {allLabels.map((label) => {
                        const selected = selectedLabels.includes(label.id);
                        return (
                          <Badge
                            key={label.id}
                            variant={selected ? 'default' : 'outline'}
                            className={cn(
                              'cursor-pointer text-[10px] transition-all px-2 py-0.5 rounded-lg border-primary/10',
                              selected ? 'shadow-sm' : 'bg-background/50 text-muted-foreground hover:bg-background'
                            )}
                            style={selected ? { backgroundColor: label.color, color: getContrastColor(label.color), border: 'none' } : {}}
                            onClick={() => {
                              setSelectedLabels(prev => prev.includes(label.id) ? prev.filter(id => id !== label.id) : [...prev, label.id]);
                            }}
                          >
                            {label.icon} {label.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="opacity-50" />

              {/* Subtasks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <ULabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                    <GripVertical className="h-3 w-3 text-primary/60" />
                    Subtasks ({subtasks.filter(s => s.completed).length}/{subtasks.length})
                  </ULabel>
                  {subtasks.length > 0 && (
                    <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: `${(subtasks.filter(s => s.completed).length / subtasks.length) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  {subtasks.map((st) => (
                    <div key={st.id} className="flex items-center gap-3 group rounded-xl px-2 py-1.5 hover:bg-muted/40 transition-colors">
                      <Checkbox
                        checked={st.completed}
                        onCheckedChange={() => {
                          setSubtasks(subtasks.map(s => s.id === st.id ? { ...s, completed: !s.completed } : s));
                        }}
                        className="rounded-lg h-4 w-4"
                      />
                      <span className={cn('flex-1 text-sm transition-colors', st.completed && 'line-through text-muted-foreground/40')}>
                        {st.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeSubtask(st.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={(e) => { e.preventDefault(); addSubtask(); }}
                  className="flex items-center gap-2 mt-2"
                >
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add a subtask..."
                    className="h-8 text-xs rounded-lg bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
                  />
                  <Button type="submit" size="sm" variant="secondary" className="h-8 w-8 rounded-lg p-0" disabled={!newSubtask.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>
              </div>

              <Separator className="opacity-50" />

              {/* Reminders & Recurrence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <ULabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                    <Bell className="h-3 w-3 text-primary/60" />
                    Reminders
                  </ULabel>
                  <div className="space-y-2">
                    {reminders.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 bg-muted/30 rounded-xl p-1.5 animate-scale-in">
                        <input
                          type="datetime-local"
                          value={r.time.slice(0, 16)}
                          onChange={(e) => updateReminder(r.id, { time: new Date(e.target.value).toISOString() })}
                          className="flex-1 bg-transparent text-[11px] focus:outline-none px-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => removeReminder(r.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 border-dashed rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-primary hover:border-primary/30"
                      onClick={addReminder}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add reminder
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <ULabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                    <Repeat className="h-3 w-3 text-primary/60" />
                    Recurrence
                  </ULabel>
                  <div className="space-y-3">
                    <select
                      value={recurrenceType}
                      onChange={(e) => {
                        setRecurrenceType(e.target.value as RecurrenceType);
                        // Reset custom fields when type changes
                        setRecurrenceDaysOfWeek([]);
                        setRecurrenceDayOfMonth(undefined);
                        setRecurrenceMonthOfYear(undefined);
                      }}
                      className="w-full h-8 rounded-xl border border-input bg-muted/20 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all capitalize"
                    >
                      {(['none', 'daily', 'weekdays', 'weekly', 'monthly', 'yearly', 'custom'] as const).map(t => (
                        <option key={t} value={t}>{t === 'none' ? 'No repeat' : t}</option>
                      ))}
                    </select>
                    {recurrenceType !== 'none' && (
                      <div className="space-y-3 animate-fade-in">
                        {recurrenceType !== 'weekdays' && (
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[10px] text-muted-foreground/60">Every</span>
                            <Input
                              type="number"
                              min={1}
                              value={recurrenceInterval}
                              onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                              className="h-7 w-12 text-xs rounded-lg text-center bg-muted/20 border-none"
                            />
                            <span className="text-[10px] text-muted-foreground/60 capitalize">
                              {recurrenceType === 'daily' ? 'days' : recurrenceType === 'weekly' ? 'weeks' : recurrenceType === 'monthly' ? 'months' : recurrenceType === 'yearly' ? 'years' : 'intervals'}
                            </span>
                          </div>
                        )}

                        {recurrenceType === 'weekly' || recurrenceType === 'custom' ? (
                          <div className="space-y-1">
                            <ULabel className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Days of week</ULabel>
                            <div className="flex flex-wrap gap-1 px-1">
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                                <Button
                                  key={day}
                                  variant={recurrenceDaysOfWeek.includes(idx) ? 'secondary' : 'outline'}
                                  size="xs"
                                  className={cn("h-7 w-9 rounded-lg text-xs", recurrenceDaysOfWeek.includes(idx) && "shadow-sm")}
                                  onClick={() => {
                                    setRecurrenceDaysOfWeek(prev => 
                                      prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx].sort()
                                    );
                                    setRecurrenceType('custom'); // Switch to custom if days selected
                                  }}
                                >
                                  {day}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {recurrenceType === 'monthly' || recurrenceType === 'custom' ? (
                          <div className="space-y-1">
                            <ULabel className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Day of month</ULabel>
                            <Input
                              type="number"
                              min={1}
                              max={31}
                              value={recurrenceDayOfMonth || ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setRecurrenceDayOfMonth(val > 0 && val <= 31 ? val : undefined);
                                setRecurrenceType('custom'); // Switch to custom
                              }}
                              placeholder="e.g. 15"
                              className="h-7 w-24 text-xs rounded-lg bg-muted/20 border-none px-2"
                            />
                          </div>
                        ) : null}

                        {recurrenceType === 'yearly' || recurrenceType === 'custom' ? (
                          <div className="space-y-1">
                            <ULabel className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Month of year</ULabel>
                            <Input
                              type="number"
                              min={1}
                              max={12}
                              value={recurrenceMonthOfYear || ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setRecurrenceMonthOfYear(val > 0 && val <= 12 ? val : undefined);
                                setRecurrenceType('custom'); // Switch to custom
                              }}
                              placeholder="e.g. 6 (June)"
                              className="h-7 w-24 text-xs rounded-lg bg-muted/20 border-none px-2"
                            />
                          </div>
                        ) : null}

                        <div className="space-y-1">
                          <ULabel className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Ends on</ULabel>
                          <input
                            type="date"
                            value={recurrenceEndDate || ''}
                            onChange={(e) => setRecurrenceEndDate(e.target.value || undefined)}
                            className="w-full h-8 rounded-xl border border-input bg-muted/20 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6 animate-fade-in">
              <div className="space-y-4">
                {activityLogs?.map((log) => (
                  <div key={log.id} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary/20 border-2 border-primary group-first:bg-primary transition-all shadow-[0_0_10px_rgba(var(--primary),0.2)]" />
                      <div className="w-0.5 flex-1 bg-border/50 group-last:hidden" />
                    </div>
                    <div className="pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold capitalize text-foreground/80">{log.action}</span>
                        <span className="text-[10px] text-muted-foreground/40 tabular-nums">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground/70 leading-relaxed">
                        {log.field && <span className="text-primary/70 font-medium">{log.field} </span>}
                        {log.oldValue && (
                          <>
                            <span className="line-through opacity-50">{log.oldValue}</span>
                            <span className="mx-1.5 opacity-30">→</span>
                          </>
                        )}
                        <span className="text-foreground/70">{log.newValue || ''}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!activityLogs || activityLogs.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="h-10 w-10 text-muted-foreground/20 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground/60">No activity yet</p>
                    <p className="text-xs text-muted-foreground/40 mt-1">Changes to this task will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 bg-muted/20 border-t">
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Created</span>
              <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                {task ? new Date(task.createdAt).toLocaleDateString() : 'Today'}
              </span>
            </div>
            {task?.updatedAt && (
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 leading-none mb-1">Modified</span>
                <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                  {new Date(task.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl text-xs hover:bg-muted font-medium">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!name.trim() || saving} className={cn("rounded-xl shadow-lg shadow-primary/20 px-6 h-9 text-xs font-bold transition-all active:scale-95", saving && "animate-pulse")}>
              {saving ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
