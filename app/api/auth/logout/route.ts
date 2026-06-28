import { NextResponse } from "next/server"
import { clearAuthTokenCookieOptions } from "@/lib/authCookies"

export async function POST() {
  const res = NextResponse.json({ message: "Cikis yapildi." })
  res.cookies.set("token", "", clearAuthTokenCookieOptions())
  return res
}
