'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, CalendarRange, Layers, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskCounts } from '@/hooks/use-cache';

const items = [
  { id: 'today', label: 'Today', icon: Calendar, href: '/today' },
  { id: 'next-7-days', label: '7 Days', icon: CalendarRange, href: '/next-7-days' },
  { id: 'upcoming', label: 'Upcoming', icon: Layers, href: '/upcoming' },
  { id: 'all', label: 'All', icon: ListTodo, href: '/all' },
];

const springTransition = { type: 'spring' as const, stiffness: 500, damping: 35, mass: 0.5 };

export function MobileNav() {
  const pathname = usePathname();
  const { counts } = useTaskCounts();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-xl z-50 safe-area-bottom">
      <div className="flex items-center justify-around py-1 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const count = item.id === 'today' ? counts.today
            : item.id === 'next-7-days' ? counts.next7Days
            : item.id === 'upcoming' ? counts.upcoming
            : counts.total;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[64px] active:scale-90',
                active ? 'text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.div
                  layoutId="mobileIndicator"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={springTransition}
                />
              )}
              <div className="relative">
                <Icon className="h-5 w-5 relative" />
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      'absolute -top-1 -right-1.5 w-2 h-2 rounded-full',
                      active ? 'bg-primary' : 'bg-primary/60'
                    )}
                  />
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium relative',
                active ? 'font-semibold' : ''
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
