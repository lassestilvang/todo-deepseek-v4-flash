import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Compass, Calendar, ListTodo } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[50vh] text-center pb-24 md:pb-8">
      <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-muted-foreground/10 via-muted/50 to-transparent flex items-center justify-center mb-6 ring-1 ring-muted-foreground/10 animate-scale-in">
        <Compass className="h-9 w-9 text-muted-foreground/40" />
      </div>
      <h1 className="text-xl font-bold mb-2 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        Page not found
      </h1>
      <p className="text-sm text-muted-foreground/70 mb-6 max-w-xs animate-fade-in-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
        This page doesn&rsquo;t exist — it may have been moved or deleted.
      </p>
      <div className="flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <Button asChild className="rounded-xl shadow-sm active:scale-95 transition-transform">
          <Link href="/today">
            <Calendar className="h-4 w-4 mr-1.5" />
            Go to Today
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl shadow-sm" asChild>
          <Link href="/all">
            <ListTodo className="h-4 w-4 mr-1.5" />
            All Tasks
          </Link>
        </Button>
      </div>
    </div>
  );
}
