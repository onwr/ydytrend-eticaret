import { prisma } from "@/lib/prisma"
import { NewsletterStatus } from "@/generated/prisma/client"

export const dynamic = "force-dynamic"

export default async function AdminNewsletterPage() {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      status: true,
      source: true,
      consentAt: true,
      confirmedAt: true,
      createdAt: true,
    },
  })

  const activeCount = subscribers.filter((s) => s.status === NewsletterStatus.ACTIVE).length

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[17px] font-medium text-zinc-800">Bülten Aboneleri</h1>
          <p className="text-[12px] text-zinc-400">
            {activeCount} aktif · son {subscribers.length} kayıt
          </p>
        </div>
        <a
          href="/api/admin/newsletter/export"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50"
        >
          CSV dışa aktar
        </a>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-zinc-100 bg-zinc-50/60 text-[10.5px] text-zinc-400">
              <tr>
                <th className="px-5 py-3">E-posta</th>
                <th className="px-5 py-3">Durum</th>
                <th className="px-5 py-3">Kaynak</th>
                <th className="px-5 py-3">Onay</th>
                <th className="px-5 py-3">Kayıt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-zinc-400">
                    Henüz abone yok
                  </td>
                </tr>
              ) : (
                subscribers.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50/70">
                    <td className="px-5 py-3 font-medium text-zinc-800">{row.email}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          row.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : row.status === "UNSUBSCRIBED"
                              ? "bg-zinc-100 text-zinc-500"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{row.source}</td>
                    <td className="px-5 py-3 text-zinc-500">
                      {row.consentAt
                        ? new Date(row.consentAt).toLocaleDateString("tr-TR")
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-zinc-500">
                      {new Date(row.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
