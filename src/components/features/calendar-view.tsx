'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, isToday, formatRelativeDate } from '@/lib/utils';
import { useToast } from '@/components/toast-provider';
import { invalidateCache } from '@/hooks/use-cache';
import type { TaskWithRelations } from '@/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const day = i - startPad + 1;
    cells.push(day >= 1 && day <= daysInMonth ? day : null);
  }
  return cells;
}

function dateString(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function CalendarView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const { toast } = useToast();

  const monthStart = useMemo(() => dateString(year, month, 1), [year, month]);
  const monthEnd = useMemo(() => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return dateString(year, month, lastDay);
  }, [year, month]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/calendar?start=${monthStart}&end=${monthEnd}`);
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      console.error('Failed to fetch calendar tasks', e);
    } finally {
      setLoading(false);
    }
  }, [monthStart, monthEnd]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, TaskWithRelations[]> = {};
    for (const task of tasks) {
      if (!task.date) continue;
      if (!map[task.date]) map[task.date] = [];
      map[task.date].push(task);
    }
    return map;
  }, [tasks]);

  const cells = useMemo(() => getMonthGrid(year, month), [year, month]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const goToday = () => {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const handleDayClick = async (day: number) => {
    const date = dateString(year, month, day);
    const name = window.prompt('New task for ' + formatRelativeDate(date));
    if (!name?.trim()) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), date }),
      });
      if (!res.ok) throw new Error('Failed');
      const saved = await res.json();
      setTasks(prev => [...prev, saved]);
      invalidateCache('task-counts');
      toast('Task created', 'success');
    } catch {
      toast('Failed to create task', 'error');
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDropOnDay = async (e: React.DragEvent, day: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    const date = dateString(year, month, day);
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, date }),
      });
      if (!res.ok) throw new Error('Failed');
      const updated = await res.json();
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t).filter(t => !t.date || (t.date >= monthStart && t.date <= monthEnd)));
      invalidateCache('task-counts');
      toast('Task moved to ' + formatRelativeDate(date), 'success');
    } catch {
      toast('Failed to move task', 'error');
    }
    setDraggedTask(null);
  };

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground/70 mt-1">View and manage tasks by date</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl" onClick={goToday}>
            Today
          </Button>
          <div className="flex items-center rounded-xl border bg-card">
            <button onClick={prevMonth} className="h-8 w-8 flex items-center justify-center rounded-l-xl hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4 text-muted-foreground/60" />
            </button>
            <span className="text-sm font-semibold px-3 min-w-[140px] text-center select-none">{monthLabel}</span>
            <button onClick={nextMonth} className="h-8 w-8 flex items-center justify-center rounded-r-xl hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={cn(
            'text-[11px] font-semibold uppercase tracking-wider text-center py-2',
            (i === 0 || i === 6) ? 'text-muted-foreground/40' : 'text-muted-foreground/60'
          )}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-t border-border rounded-xl overflow-hidden">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="border-r border-b border-border bg-muted/10 min-h-[100px] sm:min-h-[120px]" />;
          }
          const dateKey = dateString(year, month, day);
          const dayTasks = tasksByDate[dateKey] || [];
          const activeTasks = dayTasks.filter(t => !t.completed);
          const completedTasks = dayTasks.filter(t => t.completed);
          const isTodayDate = isToday(dateKey);
          const isWeekend = idx % 7 === 0 || idx % 7 === 6;

          return (
            <div
              key={dateKey}
              className={cn(
                'border-r border-b border-border p-1.5 sm:p-2 min-h-[100px] sm:min-h-[120px] transition-colors relative group',
                isTodayDate && 'bg-primary/[0.03]',
                'hover:bg-muted/30'
              )}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={(e) => handleDropOnDay(e, day)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  'text-xs font-semibold tabular-nums h-6 w-6 flex items-center justify-center rounded-full',
                  isTodayDate ? 'bg-primary text-primary-foreground shadow-sm' : isWeekend ? 'text-muted-foreground/50' : 'text-foreground/70'
                )}>
                  {day}
                </span>
                <button
                  onClick={() => handleDayClick(day)}
                  className="h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center"
                  aria-label={`Add task on ${dateKey}`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {activeTasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={() => setDraggedTask(null)}
                    className={cn(
                      'text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md truncate cursor-grab active:cursor-grabbing transition-all',
                      task.priority === 'high' ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-medium' :
                      task.priority === 'medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                      task.priority === 'low' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                      'bg-primary/5 text-primary/80',
                      draggedTask === task.id && 'opacity-50'
                    )}
                    title={task.name}
                  >
                    <span className="flex items-center gap-1">
                      {task.list && <span className="shrink-0">{task.list.icon}</span>}
                      <span className="truncate">{task.name}</span>
                    </span>
                  </div>
                ))}
                {activeTasks.length > 3 && (
                  <span className="text-[9px] text-muted-foreground/50 font-medium px-1.5">
                    +{activeTasks.length - 3} more
                  </span>
                )}
                {completedTasks.length > 0 && (
                  <span className="text-[9px] text-muted-foreground/40 line-clamp-1 px-1.5">
                    {completedTasks.length} done
                  </span>
                )}
                {dayTasks.length === 0 && (
                  <span className="text-[9px] text-muted-foreground/20 hidden group-hover:block px-1.5">
                    Click + to add
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground/50">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-primary/5" /> Unscheduled
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-red-500/20" /> High
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-amber-500/20" /> Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-blue-500/20" /> Low
        </span>
        <span className="text-muted-foreground/30">· Drag tasks to reschedule</span>
      </div>
    </div>
  );
}
