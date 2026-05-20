export function TaskListViewSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-muted/60 rounded-lg mt-2 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 bg-muted rounded-xl animate-pulse" />
          <div className="h-8 w-24 bg-primary/30 rounded-xl animate-pulse" />
        </div>
      </div>

      <div className="h-4 w-20 bg-muted/60 rounded mb-4 animate-pulse" />

      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-muted shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted/60 rounded w-1/2" />
                <div className="flex gap-2 mt-2">
                  <div className="h-5 w-16 bg-muted/60 rounded-md" />
                  <div className="h-5 w-20 bg-muted/60 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
