export function OrderListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-4">
          <div className="space-y-2">
            <div className="h-3 w-28 rounded bg-zinc-100" />
            <div className="h-3 w-20 rounded bg-zinc-100" />
          </div>
          <div className="h-8 w-24 rounded-lg bg-zinc-100" />
        </div>
      ))}
    </div>
  )
}
