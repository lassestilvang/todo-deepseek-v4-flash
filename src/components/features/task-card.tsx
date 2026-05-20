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
} from 'lucide-react';
import { cn, formatDate, formatEstimate, getContrastColor, isOverdue } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TaskWithRelations } from '@/types';

const priorityConfig: Record<string, { color: string; label: string }> = {
  high: { color: 'text-red-500', label: 'High' },
  medium: { color: 'text-amber-500', label: 'Medium' },
  low: { color: 'text-blue-500', label: 'Low' },
  none: { color: 'text-muted-foreground', label: '' },
};

interface TaskCardProps {
  task: TaskWithRelations;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const TaskCard = memo(function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const overdue = task.date ? isOverdue(task.date) && !task.completed : false;
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const priority = priorityConfig[task.priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className={cn(
        'group relative rounded-xl border bg-card transition-all',
        'hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20',
        'active:scale-[0.99]',
        task.completed && 'opacity-55',
        overdue && 'border-l-red-500 border-l-[3px]'
      )}
    >
      {task.completed && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
      )}
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={onToggle}
            className={cn(
              'mt-0.5 shrink-0 transition-all duration-200',
              'hover:scale-110 active:scale-95'
            )}
            aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {task.completed ? (
              <CheckCircle2 className="h-5 w-5 text-primary drop-shadow-sm" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary/80 transition-colors" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3
                  className={cn(
                    'font-semibold text-sm leading-tight cursor-pointer transition-colors',
                    'hover:text-primary',
                    task.completed && 'line-through text-muted-foreground/70'
                  )}
                  onClick={onEdit}
                >
                  {task.name}
                </h3>
                {task.description && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1 group-hover:text-muted-foreground transition-colors">
                    {task.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={onEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {confirmingDelete ? (
                  <span className="flex items-center gap-0.5">
                    <Button variant="destructive" size="icon" className="h-7 w-7 rounded-lg" onClick={() => { onDelete(); setConfirmingDelete(false); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setConfirmingDelete(false)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                ) : (
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive" onClick={() => setConfirmingDelete(true)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {task.priority !== 'none' && (
                <span className={cn('flex items-center gap-1 text-xs font-medium', priority.color)}>
                  <Flag className="h-3 w-3" />
                  {priority.label}
                </span>
              )}

              {task.date && (
                <span className={cn(
                  'text-xs flex items-center gap-1 px-1.5 py-0.5 rounded-md',
                  overdue
                    ? 'bg-red-500/10 text-red-500 font-medium'
                    : 'text-muted-foreground'
                )}>
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.date, { month: 'short', day: 'numeric' })}
                  {overdue && ' Overdue'}
                </span>
              )}

              {task.estimate && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatEstimate(task.estimate)}
                </span>
              )}

              {task.deadline && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50">
                  <span className="font-medium">Due</span>
                  {formatDate(task.deadline, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}

              {task.list && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 rounded-md font-normal">
                  {task.list.icon} {task.list.name}
                </Badge>
              )}

              {task.subtasks.length > 0 && (
                <span className="text-xs text-muted-foreground/70 tabular-nums">
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
                <span className="text-[10px] text-muted-foreground font-medium">
                  +{task.labelObjects.length - 2}
                </span>
              )}
            </div>

            {task.subtasks.length > 0 && (
              <>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs text-muted-foreground/70 mt-2 hover:text-foreground transition-colors"
                >
                  <ChevronRight className={cn('h-3 w-3 transition-transform duration-200', expanded && 'rotate-90')} />
                  {task.subtasks.length} subtask{task.subtasks.length > 1 ? 's' : ''}
                  {completedSubtasks > 0 && completedSubtasks === task.subtasks.length && (
                    <span className="text-primary ml-1">✓ Complete</span>
                  )}
                </button>

                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-1 pl-2 border-l-2 border-muted overflow-hidden"
                  >
                    {task.subtasks.map((st) => (
                      <div key={st.id} className="flex items-center gap-2 text-sm py-0.5">
                        <div className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          st.completed ? 'bg-primary' : 'bg-muted-foreground/40'
                        )} />
                        <span className={cn(
                          'text-muted-foreground',
                          st.completed && 'line-through text-muted-foreground/50'
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
