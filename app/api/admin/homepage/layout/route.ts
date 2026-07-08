import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import {
  DEFAULT_COMPONENT_ORDER,
  parseComponentOrder,
  type HomepageComponentKey,
} from "@/lib/homepageLayout"

const SETTING_KEY = "HOMEPAGE_COMPONENT_ORDER"

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } })
    const order = parseComponentOrder(setting?.value ?? null)
    return NextResponse.json({ order })
  } catch {
    return NextResponse.json({ order: DEFAULT_COMPONENT_ORDER })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 403 })
    }

    const body = await request.json() as { order?: { key: HomepageComponentKey; enabled: boolean }[] }
    if (!Array.isArray(body.order)) {
      return NextResponse.json({ message: "Geçersiz veri." }, { status: 400 })
    }

    const value = JSON.stringify(body.order)
    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: { value },
      create: { key: SETTING_KEY, value, type: "string" },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ message: "Kaydedilemedi." }, { status: 500 })
  }
}
