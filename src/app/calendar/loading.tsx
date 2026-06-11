export default function CalendarLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-5xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 bg-muted rounded-xl w-32" />
          <div className="h-4 bg-muted rounded-xl w-48 mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 bg-muted rounded-xl w-16" />
          <div className="h-8 bg-muted rounded-xl w-44" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-28 sm:h-32 bg-muted/50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
