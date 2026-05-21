'use client';

import { memo, useState } from 'react';
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
} from 'lucide-react';
import { cn, formatDate, formatEstimate, getContrastColor, isOverdue } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TaskWithRelations } from '@/types';

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
  const overdue = task.date ? isOverdue(task.date) && !task.completed : false;
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const subtaskProgress = task.subtasks.length > 0 ? completedSubtasks / task.subtasks.length : 0;
  const priority = priorityConfig[task.priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card transition-all duration-200',
        'hover:shadow-md hover:shadow-primary/5 hover:border-primary/20',
        task.completed && 'opacity-60'
      )}
    >
      {overdue && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-xl" />
      )}

      {task.completed && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/[0.04] via-transparent to-transparent pointer-events-none" />
      )}

      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => onToggle(task.id)}
            className={cn(
              'mt-0.5 shrink-0 transition-all duration-200',
              'hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring/30 rounded-full'
            )}
            aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {task.completed ? (
              <CheckCircle2 className="h-5 w-5 text-primary drop-shadow-sm" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary/70 transition-colors duration-200" />
            )}
          </button>

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

              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => onEdit(task.id)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {confirmingDelete ? (
                  <span className="flex items-center gap-0.5">
                    <Button variant="destructive" size="icon" className="h-7 w-7 rounded-lg" onClick={() => { onDelete(task.id); setConfirmingDelete(false); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setConfirmingDelete(false)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                ) : (
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground/60 hover:text-destructive" onClick={() => setConfirmingDelete(true)}>
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
                  {formatDate(task.date, { month: 'short', day: 'numeric' })}
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
                    {task.subtasks.map((st) => (
                      <div key={st.id} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-muted/40 transition-colors">
                        <div className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          st.completed ? 'bg-primary' : 'bg-muted-foreground/30'
                        )} />
                        <span className={cn(
                          'text-[13px] text-muted-foreground/80',
                          st.completed && 'line-through text-muted-foreground/40'
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
    </motion.div>
  );
});
