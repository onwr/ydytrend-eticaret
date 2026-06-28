import { ProductGridSkeleton } from "@/components/ui/skeletons/ProductGridSkeleton"

export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 animate-pulse space-y-3">
        <div className="h-7 w-48 rounded-lg bg-zinc-100" />
        <div className="h-4 w-72 rounded bg-zinc-100" />
      </div>
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-zinc-100" />
        ))}
      </div>
      <ProductGridSkeleton count={12} />
    </div>
  )
}
