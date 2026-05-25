'use client';

import { motion } from 'framer-motion';
import { Sparkles, Sun, CalendarDays, Layers, ListTodo, Inbox, Tag, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type EmptyStateType = 'today' | 'next-7-days' | 'upcoming' | 'all' | 'list' | 'label' | 'search' | 'default';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  message?: string;
  onCreate?: () => void;
  onFocusQuickAdd?: () => void;
  query?: string;
}

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

export function EmptyState({ type = 'default', title, message, onCreate, onFocusQuickAdd, query }: EmptyStateProps) {
  const cfg = config[type] || config.default;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-20 text-center px-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative"
      >
        <div className={`
          h-28 w-28 rounded-[2rem] bg-gradient-to-br ${cfg.gradient}
          flex items-center justify-center mb-6
          ring-1 ring-primary/5 ring-inset shadow-lg shadow-primary/5
        `}>
          <Icon className="h-12 w-12 text-primary/40" />
        </div>
        <motion.div
          className="absolute -top-1 -right-1 h-8 w-8 rounded-xl bg-background/80 backdrop-blur-sm border flex items-center justify-center shadow-sm"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 }}
        >
          <Sparkles className="h-4 w-4 text-primary/60" />
        </motion.div>
      </motion.div>

      <motion.p
        className="text-foreground/80 font-semibold text-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {title || cfg.title}
      </motion.p>
      <motion.p
        className="text-sm text-muted-foreground/50 mt-1.5 mb-6 max-w-xs leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {message || cfg.subtitle}
      </motion.p>

      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        {onCreate && (
          <Button size="sm" className="rounded-xl shadow-sm active:scale-95 transition-transform" onClick={onCreate}>
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
      </motion.div>
    </motion.div>
  );
}
