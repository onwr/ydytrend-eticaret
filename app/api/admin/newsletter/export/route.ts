import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import { AdminActivityAction, logAdminActivity } from "@/lib/adminActivityLog"
import { jsonInternalError } from "@/lib/apiError"
import { logger } from "@/lib/logger"

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 403 })
    }

    const rows = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        email: true,
        status: true,
        source: true,
        consentAt: true,
        createdAt: true,
      },
    })

    const header = "email,status,source,consentAt,createdAt"
    const lines = rows.map((r) =>
      [
        csvEscape(r.email),
        r.status,
        csvEscape(r.source ?? ""),
        r.consentAt ? r.consentAt.toISOString() : "",
        r.createdAt.toISOString(),
      ].join(",")
    )
    const csv = [header, ...lines].join("\n")

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.NEWSLETTER_EXPORT,
      resourceType: "NewsletterSubscriber",
      metadata: { count: rows.length, format: "csv" },
      request,
    })

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="newsletter-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch {
    logger.error("Newsletter export failed")
    return jsonInternalError("Dışa aktarma başarısız.", request)
  }
}
