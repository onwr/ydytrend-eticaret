import { ReturnListSkeleton } from "@/components/ui/skeletons/ReturnListSkeleton"

export default function ReturnsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 h-7 w-44 animate-pulse rounded-lg bg-zinc-100" />
      <ReturnListSkeleton rows={4} />
    </div>
  )
}
