import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionFromCookies } from "@/lib/authSession"
import { resolveImageUrl } from "@/lib/storage"
import { AdminActivityAction, logAdminActivity } from "@/lib/adminActivityLog"

async function resolveOptionalImageUrl(
  imageUrl: string | undefined | null,
  folder: string
): Promise<{ ok: true; url: string | null } | { ok: false; message: string }> {
  const trimmed = imageUrl?.trim()
  if (!trimmed) return { ok: true, url: null }
  return resolveImageUrl(trimmed, folder)
}

function buildSliderData(
  body: Record<string, unknown>,
  imageUrl: string,
  mobileImageUrl: string | null
) {
  const heroStyle = body.heroStyle === "full_image" ? "full_image" : "split"
  return {
    imageUrl,
    mobileImageUrl,
    imageObjectPosition:
      body.imageObjectPosition != null
        ? String(body.imageObjectPosition).trim() || "center"
        : "center",
    heroStyle,
    badgeText: body.badgeText != null ? String(body.badgeText).trim() || null : null,
    title: body.title != null ? String(body.title).trim() || null : null,
    subtitle: body.subtitle != null ? String(body.subtitle).trim() || null : null,
    buttonText: body.buttonText != null ? String(body.buttonText).trim() || null : null,
    buttonLink: body.buttonLink != null ? String(body.buttonLink).trim() || null : null,
    button2Text: body.button2Text != null ? String(body.button2Text).trim() || null : null,
    button2Link: body.button2Link != null ? String(body.button2Link).trim() || null : null,
    featuresJson: body.featuresJson != null ? String(body.featuresJson).trim() || null : null,
    linkUrl: body.linkUrl != null ? String(body.linkUrl).trim() || null : null,
    imageOnlyLink: body.imageOnlyLink != null ? String(body.imageOnlyLink).trim() || null : null,
    imageOnlyOpenInNewTab: body.imageOnlyOpenInNewTab === true,
    sortOrder: parseInt(String(body.sortOrder ?? "0"), 10) || 0,
    isActive: body.isActive !== false,
  }
}

export async function GET() {
  try {
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz." }, { status: 403 })
    }

    const sliders = await prisma.slider.findMany({
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json(sliders)
  } catch {
    return NextResponse.json({ message: "Hata" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz." }, { status: 403 })
    }

    const body = (await request.json()) as Record<string, unknown>

    const resolved = await resolveImageUrl(
      typeof body.imageUrl === "string" ? body.imageUrl : undefined,
      "homepage"
    )
    if (!resolved.ok) {
      return NextResponse.json(
        { message: resolved.message },
        { status: resolved.message.includes("zorunlu") ? 400 : 500 }
      )
    }

    const mobileResolved = await resolveOptionalImageUrl(
      typeof body.mobileImageUrl === "string" ? body.mobileImageUrl : undefined,
      "homepage"
    )
    if (!mobileResolved.ok) {
      return NextResponse.json({ message: mobileResolved.message }, { status: 500 })
    }

    const data = buildSliderData(body, resolved.url, mobileResolved.url)
    const slider = await prisma.slider.create({ data })

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.HOMEPAGE_SLIDER_CREATE,
      resourceType: "Slider",
      resourceId: String(slider.id),
      request,
    })
    return NextResponse.json(slider)
  } catch {
    return NextResponse.json({ message: "Hata" }, { status: 500 })
  }
}
