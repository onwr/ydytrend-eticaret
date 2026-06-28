import { ProductGridSkeleton } from "@/components/ui/skeletons/ProductGridSkeleton"

export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-square rounded-2xl bg-zinc-100" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded-lg bg-zinc-100" />
          <div className="h-6 w-1/3 rounded-lg bg-zinc-100" />
          <div className="h-24 w-full rounded-xl bg-zinc-100" />
          <div className="h-12 w-full rounded-xl bg-zinc-100" />
        </div>
      </div>
      <div className="mt-12">
        <div className="mb-4 h-5 w-40 rounded bg-zinc-100" />
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  )
}
