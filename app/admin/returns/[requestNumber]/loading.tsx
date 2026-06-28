export default function AdminReturnDetailLoading() {
  return (
    <div className="animate-pulse space-y-6 pb-10">
      <div className="h-5 w-24 rounded bg-zinc-100" />
      <div className="h-7 w-64 rounded bg-zinc-100" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-24 rounded-xl bg-zinc-100" />
        <div className="h-24 rounded-xl bg-zinc-100" />
      </div>
      <div className="h-40 rounded-xl bg-zinc-100" />
      <div className="h-32 rounded-xl bg-zinc-100" />
    </div>
  )
}
