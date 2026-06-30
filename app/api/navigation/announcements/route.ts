import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  DEFAULT_HEADER_ANNOUNCEMENTS,
  HEADER_ANNOUNCEMENTS_KEY,
  normalizeAnnouncements,
} from "@/lib/headerAnnouncements"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const row = await prisma.setting.findUnique({
      where: { key: HEADER_ANNOUNCEMENTS_KEY },
      select: { value: true },
    })

    if (!row?.value) {
      return NextResponse.json({ items: DEFAULT_HEADER_ANNOUNCEMENTS })
    }

    const parsed = normalizeAnnouncements(JSON.parse(row.value))
    return NextResponse.json({
      items: parsed.length > 0 ? parsed : DEFAULT_HEADER_ANNOUNCEMENTS,
    })
  } catch {
    return NextResponse.json({ items: DEFAULT_HEADER_ANNOUNCEMENTS })
  }
}
