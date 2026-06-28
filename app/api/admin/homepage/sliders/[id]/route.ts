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

function buildSliderUpdate(
  body: Record<string, unknown>,
  imageUrl: string,
  mobileImageUrl: string | null | undefined
) {
  const updateData: Record<string, unknown> = {
    imageUrl,
    linkUrl: body.linkUrl != null ? String(body.linkUrl).trim() || null : null,
    imageOnlyLink: body.imageOnlyLink != null ? String(body.imageOnlyLink).trim() || null : null,
    imageOnlyOpenInNewTab: body.imageOnlyOpenInNewTab === true,
    sortOrder: parseInt(String(body.sortOrder ?? "0"), 10) || 0,
    isActive: body.isActive !== false,
  }

  if (mobileImageUrl !== undefined) {
    updateData.mobileImageUrl = mobileImageUrl
  }
  if (body.imageObjectPosition !== undefined) {
    updateData.imageObjectPosition = String(body.imageObjectPosition).trim() || "center"
  }

  if (body.heroStyle !== undefined) {
    updateData.heroStyle = body.heroStyle === "full_image" ? "full_image" : "split"
  }

  if (body.badgeText !== undefined) updateData.badgeText = String(body.badgeText).trim() || null
  if (body.title !== undefined) updateData.title = String(body.title).trim() || null
  if (body.subtitle !== undefined) updateData.subtitle = String(body.subtitle).trim() || null
  if (body.buttonText !== undefined) updateData.buttonText = String(body.buttonText).trim() || null
  if (body.buttonLink !== undefined) updateData.buttonLink = String(body.buttonLink).trim() || null
  if (body.button2Text !== undefined) updateData.button2Text = String(body.button2Text).trim() || null
  if (body.button2Link !== undefined) updateData.button2Link = String(body.button2Link).trim() || null
  if (body.featuresJson !== undefined) {
    updateData.featuresJson = String(body.featuresJson).trim() || null
  }

  return updateData
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    let mobileImageUrl: string | null | undefined = undefined
    if (body.mobileImageUrl !== undefined) {
      const mobileResolved = await resolveOptionalImageUrl(
        typeof body.mobileImageUrl === "string" ? body.mobileImageUrl : "",
        "homepage"
      )
      if (!mobileResolved.ok) {
        return NextResponse.json({ message: mobileResolved.message }, { status: 500 })
      }
      mobileImageUrl = mobileResolved.url
    }

    const slider = await prisma.slider.update({
      where: { id: Number(id) },
      data: buildSliderUpdate(body, resolved.url, mobileImageUrl),
    })

    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.HOMEPAGE_SLIDER_UPDATE,
      resourceType: "Slider",
      resourceId: String(id),
      request,
    })
    return NextResponse.json(slider)
  } catch {
    return NextResponse.json({ message: "Hata" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSessionFromCookies()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Yetkisiz." }, { status: 403 })
    }

    await prisma.slider.delete({ where: { id: Number(id) } })
    await logAdminActivity(prisma, session, {
      action: AdminActivityAction.HOMEPAGE_SLIDER_DELETE,
      resourceType: "Slider",
      resourceId: String(id),
      request,
    })
    return NextResponse.json({ message: "Silindi" })
  } catch {
    return NextResponse.json({ message: "Hata" }, { status: 500 })
  }
}
