import { cookies } from "next/headers"
import type { NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/jwt"
import { guestCartCookieOptions } from "@/lib/authCookies"

export const GUEST_FAVORITES_COOKIE = "guest_favorites"
const MAX_GUEST_FAVORITES = 50

export function guestFavoritesCookieOptions() {
  return guestCartCookieOptions()
}

export function parseGuestFavoriteIds(raw: string | undefined): number[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0))].slice(
      0,
      MAX_GUEST_FAVORITES
    )
  } catch {
    return []
  }
}

export async function getGuestFavoriteIdsFromCookie(): Promise<number[]> {
  const raw = (await cookies()).get(GUEST_FAVORITES_COOKIE)?.value
  return parseGuestFavoriteIds(raw)
}

export function setGuestFavoritesCookieOnResponse(res: NextResponse, productIds: number[]) {
  const unique = [...new Set(productIds.filter((id) => Number.isFinite(id) && id > 0))].slice(
    0,
    MAX_GUEST_FAVORITES
  )
  res.cookies.set(GUEST_FAVORITES_COOKIE, JSON.stringify(unique), guestFavoritesCookieOptions())
}

export function clearGuestFavoritesCookieOnResponse(res: NextResponse) {
  res.cookies.set(GUEST_FAVORITES_COOKIE, "", {
    ...guestFavoritesCookieOptions(),
    maxAge: 0,
  })
}

export async function getAuthedUserId(): Promise<number | null> {
  const token = (await cookies()).get("token")?.value
  if (!token) return null
  const payload = verifyAccessToken(token)
  return payload?.userId ?? null
}
