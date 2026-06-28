export default function OrderDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-4 py-8">
      <div className="h-5 w-32 rounded bg-zinc-100" />
      <div className="rounded-xl border border-zinc-100 bg-white p-5">
        <div className="h-6 w-48 rounded bg-zinc-100" />
        <div className="mt-4 h-4 w-full rounded bg-zinc-100" />
        <div className="mt-2 h-4 w-2/3 rounded bg-zinc-100" />
      </div>
      <div className="rounded-xl border border-zinc-100 bg-white p-5">
        <div className="flex gap-4">
          <div className="h-16 w-16 rounded-lg bg-zinc-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-zinc-100" />
            <div className="h-3 w-1/2 rounded bg-zinc-100" />
          </div>
        </div>
      </div>
    </div>
  )
}
