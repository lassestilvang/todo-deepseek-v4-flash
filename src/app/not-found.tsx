import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-muted-foreground/10 via-muted/50 to-transparent flex items-center justify-center mb-6 ring-1 ring-muted-foreground/10">
        <Compass className="h-9 w-9 text-muted-foreground/40" />
      </div>
      <h1 className="text-xl font-bold mb-2">Page not found</h1>
      <p className="text-sm text-muted-foreground/70 mb-6 max-w-xs">
        This page doesn&rsquo;t exist — it may have been moved or deleted.
      </p>
      <Button asChild className="rounded-xl shadow-sm">
        <Link href="/today">
          <Home className="h-4 w-4 mr-1.5" />
          Go home
        </Link>
      </Button>
    </div>
  );
}
