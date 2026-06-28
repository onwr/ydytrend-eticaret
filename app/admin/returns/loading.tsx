import { ReturnListSkeleton } from "@/components/ui/skeletons/ReturnListSkeleton"

export default function AdminReturnsLoading() {
  return (
    <div className="space-y-5 pb-10">
      <div className="animate-pulse space-y-2">
        <div className="h-6 w-40 rounded bg-zinc-100" />
        <div className="h-4 w-56 rounded bg-zinc-100" />
      </div>
      <div className="h-14 animate-pulse rounded-xl bg-zinc-100" />
      <ReturnListSkeleton rows={6} />
    </div>
  )
}
