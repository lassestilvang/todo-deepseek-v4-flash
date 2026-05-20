'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, CalendarRange, Layers, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { id: 'today', label: 'Today', icon: Calendar, href: '/today' },
  { id: 'next-7-days', label: '7 Days', icon: CalendarRange, href: '/next-7-days' },
  { id: 'upcoming', label: 'Upcoming', icon: Layers, href: '/upcoming' },
  { id: 'all', label: 'All', icon: ListTodo, href: '/all' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-xl z-50 safe-area-bottom">
      <div className="flex items-center justify-around py-1.5 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors',
                active ? 'text-primary' : 'text-muted-foreground/60 hover:text-muted-foreground'
              )}
            >
              {active && (
                <motion.div
                  layoutId="mobileIndicator"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="h-5 w-5 relative" />
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
