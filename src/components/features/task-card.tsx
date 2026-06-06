'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Flag,
  CheckCircle2,
  Circle,
  ChevronRight,
  Trash2,
  Pencil,
  X,
  Timer,
  Repeat,
  Check,
  GripVertical,
  Pin,
  PinOff,
} from 'lucide-react';
import { cn, formatDate, formatRelativeDate, formatEstimate, getContrastColor, isOverdue } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/toast-provider';
import type { TaskWithRelations } from '@/types';
import { invalidateCache } from '@/hooks/use-cache';
import { Confetti } from './confetti';
import { FocusTimer } from './focus-timer';

const priorityConfig: Record<string, { color: string; label: string; bar: string }> = {
  high: { color: 'text-red-500', label: 'High', bar: 'bg-red-500' },
  medium: { color: 'text-amber-500', label: 'Medium', bar: 'bg-amber-500' },
  low: { color: 'text-blue-500', label: 'Low', bar: 'bg-blue-500' },
  none: { color: 'text-muted-foreground', label: '', bar: 'bg-transparent' },
};

interface TaskCardProps {
  task: TaskWithRelations;
  isFocused?: boolean;
  isSelected?: boolean;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect?: (id: string, selected: boolean) => void;
}

export const TaskCard = memo(function TaskCard({ task, isFocused, isSelected, onToggle, onEdit, onDelete, onSelect }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [togglingSubtask, setTogglingSubtask] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<{ x: number; y: number } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showFocusForTask, setShowFocusForTask] = useState(false);
  const { toast } = useToast();
  const overdue = task.date ? isOverdue(task.date) && !task.completed : false;
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const subtaskProgress = task.subtasks.length > 0 ? completedSubtasks / task.subtasks.length : 0;
  const priority = priorityConfig[task.priority];

  const handleToggleSubtask = useCallback(async (subtaskId: string) => {
    setTogglingSubtask(subtaskId);
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, _action: 'toggle-subtask', subtaskId }),
      });
    } catch (e) {
      console.error('Failed to toggle subtask', e);
    } finally {
      setTogglingSubtask(null);
    }
  }, [task.id]);

  // Inline editing
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(task.name);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName) {
      setEditNameValue(task.name);
      requestAnimationFrame(() => editInputRef.current?.focus());
      requestAnimationFrame(() => editInputRef.current?.select());
    }
  }, [editingName, task.name]);

  const handleSaveInline = useCallback(async () => {
    const newName = editNameValue.trim();
    if (!newName || newName === task.name) {
      setEditingName(false);
      return;
    }
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, name: newName }),
      });
      if (!res.ok) throw new Error('Failed to update');
      invalidateCache('task-counts');
      toast('Task renamed', 'success');
    } catch (e) {
      toast('Failed to rename task', 'error');
      console.error('Inline rename failed', e);
    }
    setEditingName(false);
  }, [editNameValue, task.id, task.name, toast]);

  const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveInline();
    }
    if (e.key === 'Escape') {
      setEditingName(false);
    }
  }, [handleSaveInline]);

  const handleTogglePin = useCallback(async () => {
    const previousPinned = task.pinned;
    // Optimistic update via onToggle-like pattern
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, _action: 'toggle-pin' }),
      });
      if (!res.ok) throw new Error('Failed to toggle pin');
      invalidateCache('task-counts');
      toast(previousPinned ? 'Task unpinned' : 'Task pinned', 'success');
    } catch (e) {
      toast('Failed to update pin', 'error');
      console.error('Pin toggle failed', e);
    }
  }, [task.id, task.pinned, toast]);

  return (
    <div
      className={cn(
        'group task-card-hover task-card-gpu relative overflow-hidden rounded-xl border bg-card transition-all duration-300',
        'focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-primary/30',
        'hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5',
        'active:translate-y-0 active:scale-[0.997]',
        isFocused && 'ring-2 ring-primary border-primary/50 shadow-md -translate-y-0.5',
        isSelected && 'ring-2 ring-primary border-primary/50 bg-primary/[0.03] shadow-sm',
        task.completed && 'opacity-70 border-primary/10 bg-gradient-to-br from-card via-primary/[0.02] to-transparent'
      )}
    >
      {/* Shine effect on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-transparent via-primary/[0.02] to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]" />

      {/* Priority/overdue left bar - shown once, overdue takes precedence over non-high priority */}
      {!task.completed && (
        <div className={cn(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-opacity duration-200',
          overdue
            ? 'bg-gradient-to-b from-red-500 to-red-400'
            : task.priority === 'high'
              ? 'bg-gradient-to-b from-red-500 to-red-400'
              : task.priority === 'medium'
                ? 'bg-gradient-to-b from-amber-500 to-amber-400'
                : task.priority === 'low'
                  ? 'bg-gradient-to-b from-blue-500 to-blue-400'
                  : 'opacity-0'
        )} />
      )}

      {task.completed && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
      )}

      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3 relative">
          <div className="flex flex-col items-center gap-2.5 mt-0.5 shrink-0">
            <button
              onClick={(e) => {
                if (!task.completed) {
                  setConfetti({ x: e.clientX, y: e.clientY });
                }
                onToggle(task.id);
              }}
              className={cn(
                'transition-transform duration-150',
                'hover:scale-110 active:scale-90',
                'focus:outline-none focus:ring-2 focus:ring-ring/30 rounded-full'
              )}
              aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {task.completed ? (
                <span className="block animate-scale-check">
                  <CheckCircle2 className="h-5 w-5 text-primary drop-shadow-sm" />
                </span>
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary/70 transition-colors duration-200 hover:drop-shadow-sm" />
              )}
            </button>
            
            {onSelect && (
              <div className={cn(
                "transition-all duration-300",
                isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100"
              )}>
                <Checkbox 
                  checked={isSelected} 
                  onCheckedChange={(checked) => onSelect(task.id, !!checked)}
                  className="rounded-lg h-4 w-4 border-muted-foreground/20"
                />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {editingName ? (
                  <Input
                    ref={editInputRef}
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    onBlur={handleSaveInline}
                    className="h-8 text-sm font-semibold px-2 rounded-lg border-primary/40"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h3
                    className={cn(
                      'font-semibold text-sm leading-tight cursor-pointer transition-colors duration-150 rounded-md px-1 -ml-1',
                      'hover:text-primary hover:bg-muted/40',
                      task.completed && 'line-through text-muted-foreground/60'
                    )}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (!task.completed) setEditingName(true);
                    }}
                    title="Double-click to rename"
                  >
                    {task.pinned && (
                      <Pin className="h-3 w-3 inline-block -ml-0.5 mr-0.5 text-amber-500/70 fill-amber-500/20 align-middle" />
                    )}
                    {task.name}
                  </h3>
                )}
                {task.description && (
                  <p className="text-xs text-muted-foreground/60 mt-0.5 line-clamp-1 group-hover:text-muted-foreground/80 transition-colors duration-150">
                    {task.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-0.5 shrink-0 task-card-actions md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-all duration-200">
                {!task.completed && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 rounded-lg text-primary/60 hover:text-primary" onClick={(e) => { e.stopPropagation(); setShowFocusForTask(true); }} aria-label="Focus on this task">
                    <Timer className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className={cn("h-8 w-8 sm:h-7 sm:w-7 rounded-lg transition-all", task.pinned && "text-amber-500 hover:text-amber-600")} onClick={(e) => { e.stopPropagation(); handleTogglePin(); }} aria-label={task.pinned ? 'Unpin task' : 'Pin task'}>
                  {task.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 rounded-lg" onClick={() => onEdit(task.id)} aria-label="Edit task">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {confirmingDelete ? (
                  <span className="flex items-center gap-0.5">
                    <Button variant="destructive" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 rounded-lg animate-scale-in" onClick={() => { onDelete(task.id); setConfirmingDelete(false); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 rounded-lg animate-scale-in" onClick={() => setConfirmingDelete(false)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                ) : (
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 rounded-lg text-muted-foreground/60 hover:text-destructive md:opacity-0 md:group-hover:opacity-100 transition-all duration-200" onClick={() => setConfirmingDelete(true)} aria-label="Delete task">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {task.priority !== 'none' && (
                <span className={cn('flex items-center gap-1 text-[11px] font-medium', priority.color)}>
                  <Flag className="h-3 w-3" />
                  {priority.label}
                </span>
              )}

              {task.date ? (
                <span className={cn(
                  'inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md transition-colors',
                  overdue
                    ? 'bg-red-500/10 text-red-500 font-semibold'
                    : 'text-muted-foreground/70'
                )}>
                  <Calendar className="h-3 w-3" />
                  {formatRelativeDate(task.date)}
                </span>
              ) : !task.completed && (
                <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const today = new Date().toISOString().split('T')[0];
                      try {
                        await fetch('/api/tasks', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: task.id, date: today }),
                        });
                        invalidateCache('task-counts');
                        toast('Task set for today', 'success');
                      } catch { toast('Failed to set date', 'error'); }
                    }}
                    className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-medium"
                  >
                    Today
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const dateStr = tomorrow.toISOString().split('T')[0];
                      try {
                        await fetch('/api/tasks', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: task.id, date: dateStr }),
                        });
                        invalidateCache('task-counts');
                        toast('Task set for tomorrow', 'success');
                      } catch { toast('Failed to set date', 'error'); }
                    }}
                    className="px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground/70 hover:bg-muted transition-colors text-[10px]"
                  >
                    Tomorrow
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const d = new Date();
                      const day = d.getDay();
                      const diff = day <= 1 ? (1 - day + 7) % 7 : 8 - day;
                      d.setDate(d.getDate() + diff);
                      const dateStr = d.toISOString().split('T')[0];
                      try {
                        await fetch('/api/tasks', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: task.id, date: dateStr }),
                        });
                        invalidateCache('task-counts');
                        toast('Task set for next Monday', 'success');
                      } catch { toast('Failed to set date', 'error'); }
                    }}
                    className="px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground/70 hover:bg-muted transition-colors text-[10px]"
                  >
                    Next Mon
                  </button>
                </span>
              )}

              {task.estimate && (
                <span className="text-[11px] text-muted-foreground/70 inline-flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {formatEstimate(task.estimate)}
                </span>
              )}

              {task.deadline && (
                <span className="text-[11px] text-muted-foreground/70 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50">
                  <Clock className="h-3 w-3" />
                  {formatDate(task.deadline, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}

              {task.list && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 rounded-md font-normal">
                  {task.list.icon} {task.list.name}
                </Badge>
              )}

              {task.subtasks.length > 0 && (
                <span className="text-[11px] text-muted-foreground/60 tabular-nums">
                  {completedSubtasks}/{task.subtasks.length}
                </span>
              )}

              {task.labelObjects && task.labelObjects.length > 0 && task.labelObjects.slice(0, 2).map((label) => (
                <Badge
                  key={label.id}
                  className="text-[10px] px-1.5 py-0 h-5 rounded-md font-normal border-0"
                  style={{ backgroundColor: label.color, color: getContrastColor(label.color) }}
                >
                  {label.icon} {label.name}
                </Badge>
              ))}
              {task.labelObjects && task.labelObjects.length > 2 && (
                <span className="text-[10px] text-muted-foreground/50 font-medium">
                  +{task.labelObjects.length - 2}
                </span>
              )}

              {task.recurrence && task.recurrence.type !== 'none' && (
                <span className="inline-flex items-center gap-1 text-[11px] text-primary/70 px-1.5 py-0.5 rounded-md bg-primary/5">
                  <Repeat className="h-3 w-3" />
                  {task.recurrence.type}
                </span>
              )}

              {task.completed && task.completedAt && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/50">
                  Done {formatRelativeDate(task.completedAt)}
                </span>
              )}
            </div>

            {task.subtasks.length > 0 && (
              <>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-2 mt-2.5 w-full text-left group/sub"
                >
                  <div className="flex-1 h-1 rounded-full bg-muted/70 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500 ease-out', priority.bar === 'bg-transparent' ? 'bg-primary/60' : priority.bar)}
                      style={{ width: `${subtaskProgress * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1 shrink-0">
                    <ChevronRight className={cn('h-3 w-3 transition-transform duration-200', expanded && 'rotate-90')} />
                    {completedSubtasks}/{task.subtasks.length}
                  </span>
                </button>

                {expanded && (
                  <div className="mt-2 space-y-0.5 pl-1 overflow-hidden animate-fade-in">
                    {task.subtasks.map((st, idx) => (
                      <div
                        key={st.id}
                        draggable
                        onDragStart={(e) => {
                          setDragIndex(idx);
                          e.dataTransfer.setData('text/plain', String(idx));
                        }}
                        onDragEnd={() => setDragIndex(null)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                          setDragIndex(null);
                          if (isNaN(fromIdx) || fromIdx === idx) return;
                          const reordered = [...task.subtasks];
                          const [moved] = reordered.splice(fromIdx, 1);
                          reordered.splice(idx, 0, moved);
                          try {
                            await fetch('/api/tasks', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                id: task.id,
                                _action: 'reorder-subtasks',
                                subtaskIds: reordered.map(s => s.id),
                              }),
                            });
                            invalidateCache('task-counts');
                          } catch (e) {
                            console.error('Failed to reorder subtasks', e);
                          }
                        }}
                        className={cn(
                          'flex items-center gap-1.5 py-1 px-1 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group/sub',
                          dragIndex === idx && 'opacity-50'
                        )}
                      >
                        <span className="shrink-0 opacity-0 group-hover/sub:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 p-0.5 rounded">
                          <GripVertical className="h-3 w-3" />
                        </span>
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200',
                            st.completed
                              ? 'bg-primary border-primary'
                              : 'border-muted-foreground/30 group-hover/sub:border-primary/60'
                          )}
                          onClick={() => handleToggleSubtask(st.id)}
                        >
                          {st.completed && (
                            <Check className="h-2.5 w-2.5 text-primary-foreground" />
                          )}
                          {togglingSubtask === st.id && (
                            <span className="h-2.5 w-2.5 rounded-full border-2 border-current border-t-transparent animate-spin block" />
                          )}
                        </div>
                        <span className={cn(
                          'text-[13px] transition-colors flex-1',
                          st.completed ? 'line-through text-muted-foreground/40' : 'text-muted-foreground/80'
                        )}>
                          {st.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {confetti && (
        <Confetti
          originX={confetti.x}
          originY={confetti.y}
          onComplete={() => setConfetti(null)}
        />
      )}

      {showFocusForTask && (
        <FocusTimer
          onClose={() => setShowFocusForTask(false)}
          initialTaskId={task.id}
          initialTaskName={task.name}
        />
      )}
    </div>
  );
});
