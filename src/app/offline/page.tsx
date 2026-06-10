import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
      <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-amber-500/20 via-amber-400/10 to-background flex items-center justify-center mb-6 ring-1 ring-primary/5 ring-inset shadow-lg shadow-primary/5">
        <WifiOff className="h-12 w-12 text-amber-500/60" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground/80 mb-2">You&apos;re Offline</h1>
      <p className="text-sm text-muted-foreground/50 max-w-md leading-relaxed mb-8">
        Your daily planner is taking a break too. Connect to the internet to sync your tasks, or check back later.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}
