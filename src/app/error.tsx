'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-5">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button onClick={reset} variant="outline" className="rounded-xl">
        Try again
      </Button>
    </div>
  );
}
