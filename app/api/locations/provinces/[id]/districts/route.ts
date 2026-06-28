import { NextResponse } from "next/server"
import { getTurkeyDistricts } from "@/lib/turkiyeLocations"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const provinceId = Number(id)
  if (!Number.isFinite(provinceId) || provinceId <= 0) {
    return NextResponse.json({ message: "Geçersiz il." }, { status: 400 })
  }

  try {
    const items = await getTurkeyDistricts(provinceId)
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ message: "İlçeler yüklenemedi." }, { status: 502 })
  }
}
