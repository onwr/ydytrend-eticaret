export default function ReturnDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-4 py-8">
      <div className="h-5 w-28 rounded bg-zinc-100" />
      <div className="h-6 w-56 rounded bg-zinc-100" />
      <div className="rounded-xl border border-zinc-100 bg-white p-5 space-y-3">
        <div className="h-4 w-full rounded bg-zinc-100" />
        <div className="h-4 w-2/3 rounded bg-zinc-100" />
        <div className="h-20 w-full rounded bg-zinc-100" />
      </div>
    </div>
  )
}
