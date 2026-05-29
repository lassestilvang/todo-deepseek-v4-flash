'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [resetting, setResetting] = useState(false);

  const handleReset = () => {
    setResetting(true);
    // Small delay so the user sees feedback before the reset
    setTimeout(() => reset(), 300);
  };

  return (
    <div className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-in pb-24 md:pb-8">
      <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-destructive/15 via-destructive/5 to-transparent flex items-center justify-center mb-6 ring-1 ring-destructive/10 animate-scale-in">
        <AlertTriangle className="h-9 w-9 text-destructive/70" />
      </div>
      <div>
        <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground/70 mb-2 max-w-md">
          {error.message || 'An unexpected error occurred.'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/40 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={handleReset}
            disabled={resetting}
            className="rounded-xl shadow-sm active:scale-95 transition-transform"
          >
            <RefreshCw className={cn('h-4 w-4 mr-1.5', resetting && 'animate-spin')} />
            {resetting ? 'Retrying...' : 'Try again'}
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl shadow-sm" asChild>
            <Link href="/today">
              <Home className="h-4 w-4 mr-1.5" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
