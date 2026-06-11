'use client';

import { WifiOff, RefreshCw, CheckCircle2, Calendar, ListTodo } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
      <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-amber-500/20 via-amber-400/10 to-background flex items-center justify-center mb-6 ring-1 ring-primary/5 ring-inset shadow-lg shadow-primary/5 animate-float">
        <WifiOff className="h-12 w-12 text-amber-500/60" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground/80 mb-2">You&apos;re Offline</h1>
      <p className="text-sm text-muted-foreground/50 max-w-md leading-relaxed mb-2">
        Your data is saved locally. Changes will sync when you reconnect.
      </p>
      <p className="text-xs text-muted-foreground/40 max-w-md mb-8">
        Previously loaded pages are still available below.
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/today"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border text-sm font-medium hover:bg-muted transition-colors active:scale-95"
        >
          <Calendar className="h-4 w-4 text-primary/60" />
          Today
        </Link>
        <Link
          href="/all"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border text-sm font-medium hover:bg-muted transition-colors active:scale-95"
        >
          <ListTodo className="h-4 w-4 text-primary/60" />
          All Tasks
        </Link>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-lg shadow-primary/20 active:scale-95 transition-all hover:shadow-xl"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>

      <div className="mt-8 flex items-center gap-2 text-[10px] text-muted-foreground/30">
        <CheckCircle2 className="h-3 w-3" />
        Your tasks are safe
      </div>
    </div>
  );
}
