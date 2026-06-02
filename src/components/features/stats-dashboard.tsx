'use client';

import { memo } from 'react';
import {
  TrendingUp,
  Flame,
  CheckCircle2,
  Calendar,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskCounts } from '@/hooks/use-cache';

interface StatsDashboardProps {
  counts: TaskCounts;
}

const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  gradient,
  iconColor,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string | number;
  sublabel?: string;
  gradient: string;
  iconColor: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card p-4 transition-all duration-300',
        'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
        'active:translate-y-0'
      )}
    >
      {/* Gradient background decoration */}
      <div className={cn('absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-10', gradient)} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', gradient)}>
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground/70 mt-0.5">{label}</div>
        {sublabel && (
          <div className="text-[10px] text-muted-foreground/40 mt-0.5">{sublabel}</div>
        )}
      </div>
    </div>
  );
});

const WeeklyChart = memo(function WeeklyChart({
  data,
}: {
  data: { day: string; count: number }[];
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="rounded-xl border bg-card p-4 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold">Weekly Activity</div>
          <div className="text-[10px] text-muted-foreground/50">Tasks completed per day</div>
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-24">
        {data.map((d) => {
          const height = Math.max((d.count / maxCount) * 100, d.count > 0 ? 12 : 4);
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[9px] font-medium tabular-nums text-muted-foreground/60">
                {d.count}
              </span>
              <div
                className={cn(
                  'w-full rounded-md transition-all duration-500 ease-out',
                  d.count > 0
                    ? 'bg-gradient-to-t from-primary/60 to-primary/30 hover:from-primary hover:to-primary/60'
                    : 'bg-muted/40'
                )}
                style={{ height: `${height}%`, minHeight: d.count > 0 ? '4px' : '2px' }}
                title={`${d.day}: ${d.count} completions`}
              />
              <span className="text-[9px] text-muted-foreground/40 font-medium">{d.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export const StatsDashboard = memo(function StatsDashboard({ counts }: StatsDashboardProps) {
  const completionRate =
    counts.completedThisWeek > 0 || counts.today > 0
      ? Math.round(
          (counts.completedThisWeek / (counts.completedThisWeek + counts.today + counts.upcoming)) *
            100
        )
      : 0;

  return (
    <div className="animate-fade-in mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary/60" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
          This Week Overview
        </span>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <StatCard
          icon={CheckCircle2}
          label="Completed today"
          value={counts.completedToday}
          gradient="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5"
          iconColor="text-emerald-500"
          sublabel={
            counts.completedToday > 0
              ? 'Keep up the momentum!'
              : 'Start checking things off'
          }
        />
        <StatCard
          icon={TrendingUp}
          label="Completed this week"
          value={counts.completedThisWeek}
          gradient="bg-gradient-to-br from-blue-500/20 to-blue-500/5"
          iconColor="text-blue-500"
          sublabel={
            counts.completedThisWeek > 0
              ? `${completionRate}% completion rate`
              : 'No completions yet this week'
          }
        />
        <StatCard
          icon={Flame}
          label="Day streak"
          value={counts.streak > 0 ? `${counts.streak}` : '—'}
          gradient="bg-gradient-to-br from-orange-500/20 to-orange-500/5"
          iconColor="text-orange-500"
          sublabel={
            counts.streak > 1
              ? `${counts.streak} days in a row!`
              : counts.streak === 1
                ? '1 day — keep going!'
                : 'Complete a task to start'
          }
        />
        <StatCard
          icon={Calendar}
          label="Active tasks"
          value={counts.total}
          gradient="bg-gradient-to-br from-primary/20 to-primary/10"
          iconColor="text-primary"
          sublabel={`${counts.today} due today · ${counts.next7Days} this week`}
        />
      </div>

      <WeeklyChart data={counts.weeklyCompletions} />
    </div>
  );
});
