export function ReturnListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl border border-zinc-100 bg-white p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-zinc-100" />
              <div className="h-3 w-24 rounded bg-zinc-100" />
            </div>
            <div className="h-6 w-20 rounded-full bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  )
}
