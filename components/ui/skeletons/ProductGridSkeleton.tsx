export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-3 rounded-2xl border border-zinc-100 p-3">
          <div className="aspect-square rounded-xl bg-zinc-100" />
          <div className="h-3 w-3/4 rounded bg-zinc-100" />
          <div className="h-3 w-1/2 rounded bg-zinc-100" />
        </div>
      ))}
    </div>
  )
}
