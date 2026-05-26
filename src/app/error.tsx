'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-in">
      <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-destructive/15 via-destructive/5 to-transparent flex items-center justify-center mb-6 ring-1 ring-destructive/10"
        style={{ animation: 'scaleIn 0.3s ease-out' }}>
        <AlertTriangle className="h-9 w-9 text-destructive/70" />
      </div>
      <div>
        <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground/70 mb-6 max-w-md">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <Button onClick={reset} className="rounded-xl shadow-sm">
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Try again
        </Button>
      </div>
    </div>
  );
}
