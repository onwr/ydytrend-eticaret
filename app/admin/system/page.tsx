import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import { redirect } from "next/navigation"
import { runReadinessChecks } from "@/lib/readinessChecks"
import { getEnv } from "@/lib/env"
import { APP_VERSION, BUILD_TIME } from "@/lib/buildInfo"
import { CRON_LAST_ERROR_KEY, CRON_LAST_RUN_KEY, EMAIL_LAST_ERROR_KEY } from "@/lib/buildInfo"
import { getUptimeSeconds } from "@/lib/appLifecycle"

export const dynamic = "force-dynamic"

async function readSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key }, select: { value: true } })
  return row?.value ?? null
}

export default async function AdminSystemPage() {
  const session = await getSessionFromCookies()
  if (!session || session.role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin/system")
  }

  const [readiness, cronLastRun, cronLastError, emailLastError] = await Promise.all([
    runReadinessChecks(),
    readSetting(CRON_LAST_RUN_KEY),
    readSetting(CRON_LAST_ERROR_KEY),
    readSetting(EMAIL_LAST_ERROR_KEY),
  ])

  let envLabel = "unknown"
  try {
    envLabel = getEnv().NODE_ENV
  } catch {
    /* env parse hatası */
  }

  const rows = [
    { label: "Uygulama sürümü", value: APP_VERSION },
    { label: "Ortam", value: envLabel },
    { label: "Build zamanı", value: BUILD_TIME ?? "—" },
    { label: "Uptime (sn)", value: String(getUptimeSeconds()) },
    { label: "Health", value: "GET /api/health" },
    { label: "Readiness", value: readiness.status },
    { label: "Veritabanı", value: readiness.checks.database },
    { label: "Upload / CDN", value: readiness.checks.uploads },
    { label: "E-posta yapılandırması", value: readiness.checks.mail },
    { label: "Monitoring", value: readiness.checks.monitoring },
    { label: "Son cron", value: cronLastRun ?? "—" },
    { label: "Son cron hatası", value: cronLastError?.trim() ? cronLastError.slice(0, 120) : "—" },
    { label: "Son e-posta hatası", value: emailLastError?.trim() ? emailLastError.slice(0, 120) : "—" },
  ]

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-[17px] font-medium text-zinc-800">Sistem Durumu</h1>
        <p className="text-[12px] text-zinc-400">
          Operasyonel özet — secret ve bağlantı dizeleri gösterilmez.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-100 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <tbody className="divide-y divide-zinc-50">
            {rows.map((row) => (
              <tr key={row.label} className="hover:bg-zinc-50/70">
                <td className="w-1/3 px-5 py-3 font-medium text-zinc-600">{row.label}</td>
                <td className="px-5 py-3 font-mono text-[11.5px] text-zinc-800">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-zinc-400">
        Detaylı kontrol:{" "}
        <a href="/api/readiness" className="underline" target="_blank" rel="noreferrer">
          /api/readiness
        </a>
      </p>
    </div>
  )
}
