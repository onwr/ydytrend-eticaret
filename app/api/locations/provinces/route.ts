import { NextResponse } from "next/server"
import { getTurkeyProvinces } from "@/lib/turkiyeLocations"

export async function GET() {
  try {
    const items = await getTurkeyProvinces()
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ message: "İller yüklenemedi." }, { status: 502 })
  }
}
