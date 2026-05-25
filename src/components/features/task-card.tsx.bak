'use client';

import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { cn, formatDate, formatRelativeDate, formatEstimate, getContrastColor, isOverdue } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/toast-provider';
import type { TaskWithRelations } from '@/types';
import { Confetti } from './confetti';

const priorityConfig: Record<string, { color: string; label: string; bar: string }> = {
  high: { color: 'text-red-500', label: 'High', bar: 'bg-red-500' },
  medium: { color: 'text-amber-500', label: 'Medium', bar: 'bg-amber-500' },
  low: { color: 'text-blue-500', label: 'Low', bar: 'bg-blue-500' },
  none: { color: 'text-muted-foreground', label: '', bar: 'bg-transparent' },
};

interface TaskCardProps {
  task: TaskWithRelations;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TaskCard = memo(function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [togglingSubtask, setTogglingSubtask] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<{ x: number; y: number } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card transition-all duration-300',
        'focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-primary/30',
        'hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20',
        task.completed && 'opacity-70 border-primary/10 bg-gradient-to-br from-card via-primary/[0.02] to-transparent'
      )}
    >
      {/* Shine effect on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-transparent via-primary/[0.02] to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]" />

      {/* Priority left bar */}
      {task.priority !== 'none' && !task.completed && (
        <div className={cn(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl',
          task.priority === 'high' ? 'bg-gradient-to-b from-red-500 to-red-400' :
          task.priority === 'medium' ? 'bg-gradient-to-b from-amber-500 to-amber-400' :
          'bg-gradient-to-b from-blue-500 to-blue-400'
        )} />
      )}

      {overdue && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-red-400 rounded-l-xl" />
      )}

      {task.completed && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
      )}

      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <motion.button
            onClick={(e) => {
              if (!task.completed) {
                setConfetti({ x: e.clientX, y: e.clientY });
              }
              onToggle(task.id);
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            className={cn(
              'mt-0.5 shrink-0',
              'focus:outline-none focus:ring-2 focus:ring-ring/30 rounded-full'
            )}
            aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {task.completed ? (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <CheckCircle2 className="h-5 w-5 text-primary drop-shadow-sm" />
              </motion.div>
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary/70 transition-colors duration-200" />
            )}
          </motion.button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3
                  className={cn(
                    'font-semibold text-sm leading-tight cursor-pointer transition-colors duration-150',
                    'hover:text-primary',
                    task.completed && 'line-through text-muted-foreground/60'
                  )}
                  onClick={() => onEdit(task.id)}
                >
                  {task.name}
                </h3>
                {task.description && (
                  <p className="text-xs text-muted-foreground/60 mt-0.5 line-clamp-1 group-hover:text-muted-foreground/80 transition-colors duration-150">
                    {task.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-0.5 shrink-0 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-all duration-200">
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

              {task.date && (
                <span className={cn(
                  'inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md transition-colors',
                  overdue
                    ? 'bg-red-500/10 text-red-500 font-semibold'
                    : 'text-muted-foreground/70'
                )}>
                  <Calendar className="h-3 w-3" />
                  {formatRelativeDate(task.date)}
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
                    <motion.div
                      className={cn('h-full rounded-full', priority.bar === 'bg-transparent' ? 'bg-primary/60' : priority.bar)}
                      initial={false}
                      animate={{ width: `${subtaskProgress * 100}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1 shrink-0">
                    <ChevronRight className={cn('h-3 w-3 transition-transform duration-200', expanded && 'rotate-90')} />
                    {completedSubtasks}/{task.subtasks.length}
                  </span>
                </button>

                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="mt-2 space-y-0.5 pl-1 overflow-hidden"
                  >
                    {task.subtasks.map((st, idx) => (
                      <div
                        key={st.id}
                        draggable
                        onDragStart={() => setDragIndex(idx)}
                        onDragEnd={() => setDragIndex(null)}
                        onDragOver={(e) => e.preventDefault()}
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
                  </motion.div>
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
    </motion.div>
  );
});
