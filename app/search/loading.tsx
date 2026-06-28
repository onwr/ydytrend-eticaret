import { ProductGridSkeleton } from "@/components/ui/skeletons/ProductGridSkeleton"

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 h-10 w-full max-w-md animate-pulse rounded-xl bg-zinc-100" />
      <ProductGridSkeleton count={8} />
    </div>
  )
}
