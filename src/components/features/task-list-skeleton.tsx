import { cn } from '@/lib/utils';

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-muted/70', className)}>
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%]" />
    </div>
  );
}

export function TaskListViewSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <SkeletonBar className="h-7 w-32" />
          <SkeletonBar className="h-4 w-48 mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBar className="h-8 w-28 rounded-xl" />
          <SkeletonBar className="h-8 w-24 rounded-xl" />
        </div>
      </div>

      <SkeletonBar className="h-4 w-20 mb-4" />

      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3">
              <SkeletonBar className="h-5 w-5 rounded-full shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1.5">
                    <SkeletonBar className="h-4 w-3/5" />
                    <SkeletonBar className="h-3 w-2/5" />
                  </div>
                  <div className="flex gap-1">
                    <SkeletonBar className="h-7 w-7 rounded-lg" />
                    <SkeletonBar className="h-7 w-7 rounded-lg" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SkeletonBar className="h-5 w-12 rounded-md" />
                  <SkeletonBar className="h-5 w-20 rounded-md" />
                  <SkeletonBar className="h-5 w-14 rounded-md" />
                </div>
                <SkeletonBar className="h-1 w-full rounded-full mt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
