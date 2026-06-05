'use client';

import { Sparkles, Sun, CalendarDays, Layers, ListTodo, Inbox, Tag, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type EmptyStateType = 'today' | 'next-7-days' | 'upcoming' | 'all' | 'list' | 'label' | 'search' | 'default';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  message?: string;
  onCreate?: () => void;
  onFocusQuickAdd?: () => void;
  onSuggest?: (text: string) => void;
  query?: string;
}

const suggestions: Record<string, string[]> = {
  today: ['Plan my day', 'Workout', 'Read for 30 min', 'Meditation', 'Clean up desk', 'Review goals', 'Write in journal', 'Call a friend', 'Organize workspace', 'Meal prep'],
  'next-7-days': ['Schedule meetings', 'Plan weekend trip', 'Grocery shopping', 'Pay bills', 'Finish project', 'Prepare presentation', 'Weekly review'],
  upcoming: ['Book appointments', 'Plan vacation', 'Learn new skill', 'Start side project', 'Renew subscriptions', 'Schedule checkups'],
  all: ['Create first task', 'Set up lists', 'Add labels', 'Explore keyboard shortcuts', 'Customize theme'],
  list: ['Add tasks to this list', 'Set priorities', 'Add due dates', 'Organize by label'],
};

const config: Record<EmptyStateType, { icon: typeof Sparkles; gradient: string; title: string; subtitle: string }> = {
  today: {
    icon: Sun,
    gradient: 'from-amber-500/20 via-amber-400/10 to-background',
    title: 'Nothing planned for today',
    subtitle: 'Enjoy your free day! Or start a new task to get things done.',
  },
  'next-7-days': {
    icon: CalendarDays,
    gradient: 'from-blue-500/20 via-blue-400/10 to-background',
    title: 'No tasks this week',
    subtitle: 'Plan ahead by scheduling tasks for the next few days.',
  },
  upcoming: {
    icon: Layers,
    gradient: 'from-purple-500/20 via-purple-400/10 to-background',
    title: 'No upcoming tasks',
    subtitle: 'All caught up! Create tasks with future dates to see them here.',
  },
  all: {
    icon: ListTodo,
    gradient: 'from-emerald-500/20 via-emerald-400/10 to-background',
    title: 'No tasks yet',
    subtitle: 'Your planner is empty. Start by creating your first task!',
  },
  list: {
    icon: Inbox,
    gradient: 'from-primary/20 via-primary/10 to-background',
    title: 'This list is empty',
    subtitle: 'Add tasks to this list to keep things organized.',
  },
  label: {
    icon: Tag,
    gradient: 'from-pink-500/20 via-pink-400/10 to-background',
    title: 'No tasks with this label',
    subtitle: 'Assign this label to tasks to find them quickly.',
  },
  search: {
    icon: Search,
    gradient: 'from-sky-500/20 via-sky-400/10 to-background',
    title: 'No results found',
    subtitle: 'Try a different search term or browse your tasks.',
  },
  default: {
    icon: Sparkles,
    gradient: 'from-primary/20 via-primary/10 to-background',
    title: 'Nothing here yet',
    subtitle: 'Start by creating a new task.',
  },
};

export function EmptyState({ type = 'default', title, message, onCreate, onFocusQuickAdd, onSuggest }: EmptyStateProps) {
  const cfg = config[type] || config.default;
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4 animate-fade-in">
      <div className="relative animate-scale-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div className={`
          h-28 w-28 rounded-[2rem] bg-gradient-to-br ${cfg.gradient}
          flex items-center justify-center mb-6
          ring-1 ring-primary/5 ring-inset shadow-lg shadow-primary/5
          animate-float
        `}>
          <Icon className="h-12 w-12 text-primary/40" />
        </div>
        <div
          className="absolute -top-1 -right-1 h-8 w-8 rounded-xl bg-background/80 border flex items-center justify-center shadow-sm animate-scale-check"
          style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
        >
          <Sparkles className="h-4 w-4 text-primary/60" />
        </div>
      </div>

      <p className="text-foreground/80 font-semibold text-lg animate-fade-in-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
        {title || cfg.title}
      </p>
      <p className="text-sm text-muted-foreground/50 mt-1.5 mb-6 max-w-xs leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        {message || cfg.subtitle}
      </p>

      <div className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
        {onCreate && (
          <Button size="sm" className="rounded-xl shadow-sm active:scale-95 transition-transform hover:shadow-md" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Task
          </Button>
        )}
        {onFocusQuickAdd && (
          <Button variant="outline" size="sm" className="rounded-xl shadow-sm" onClick={onFocusQuickAdd}>
            Quick Add
            <kbd className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground/60 font-mono">Q</kbd>
          </Button>
        )}
      </div>

      {onSuggest && suggestions[type] && (
        <div className="mt-12 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-3">✨ Quick ideas</p>
          <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
            {suggestions[type].map((text) => (
              <button
                key={text}
                onClick={() => onSuggest(text)}
                className="px-3 py-1.5 rounded-full border border-primary/10 bg-primary/5 text-primary/70 text-xs font-medium hover:bg-primary/10 hover:border-primary/20 transition-all active:scale-95"
              >
                + {text}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-[10px] text-muted-foreground/30 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
        <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/40 font-mono text-[9px]">N</kbd>
        <span>New task</span>
        <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/40 font-mono text-[9px]">Q</kbd>
        <span>Quick add</span>
        <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/40 font-mono text-[9px]">⌘K</kbd>
        <span>Search</span>
        <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/40 font-mono text-[9px]">1-4</kbd>
        <span>Views</span>
      </div>
    </div>
  );
}
