'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50 safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}