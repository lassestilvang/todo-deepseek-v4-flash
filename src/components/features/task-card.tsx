'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { cn, formatDate, isOverdue } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TaskWithRelations } from '@/types';

const priorityColors: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-blue-500',
  none: 'text-muted-foreground',
};

interface TaskCardProps {
  task: TaskWithRelations;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const overdue = task.date ? isOverdue(task.date) && !task.completed : false;
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'group rounded-xl border bg-card transition-all hover:shadow-md',
        task.completed && 'opacity-60',
        overdue && 'border-l-red-500 border-l-2'
      )}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={onToggle}
            className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
          >
            {task.completed ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3
                  className={cn(
                    'font-medium text-sm leading-tight cursor-pointer hover:text-primary transition-colors',
                    task.completed && 'line-through text-muted-foreground'
                  )}
                  onClick={onEdit}
                >
                  {task.name}
                </h3>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Priority */}
              <Flag className={cn('h-3 w-3', priorityColors[task.priority])} />

              {/* Date */}
              {task.date && (
                <span className={cn('text-xs flex items-center gap-1', overdue ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.date, { month: 'short', day: 'numeric' })}
                  {overdue && ' (Overdue)'}
                </span>
              )}

              {/* Estimate */}
              {task.estimate && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {(() => {
                    const parts = task.estimate!.split(':');
                    const h = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10);
                    if (h > 0 && m > 0) return `${h}h ${m}m`;
                    if (h > 0) return `${h}h`;
                    return `${m}m`;
                  })()}
                </span>
              )}

              {/* List */}
              {task.list && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                  {task.list.icon} {task.list.name}
                </Badge>
              )}

              {/* Subtasks count */}
              {task.subtasks.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {completedSubtasks}/{task.subtasks.length}
                </span>
              )}

              {/* Labels */}
              {task.labels.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {task.labels.length} label{task.labels.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Expand subtasks */}
            {task.subtasks.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-foreground transition-colors"
              >
                <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
                {task.subtasks.length} subtasks
              </button>
            )}

            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 space-y-1 pl-2 border-l-2 border-muted"
              >
                {task.subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2 text-sm">
                    <div className={cn('w-1.5 h-1.5 rounded-full', st.completed ? 'bg-primary' : 'bg-muted-foreground')} />
                    <span className={cn(st.completed && 'line-through text-muted-foreground')}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}