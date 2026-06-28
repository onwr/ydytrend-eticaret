import { OrderListSkeleton } from "@/components/ui/skeletons/OrderListSkeleton"

export default function OrdersLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 h-7 w-40 animate-pulse rounded-lg bg-zinc-100" />
      <OrderListSkeleton rows={5} />
    </div>
  )
}
