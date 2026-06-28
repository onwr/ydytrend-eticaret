import { getEnv } from "@/lib/env"

const TOKEN_MAX_AGE = 60 * 60 * 24 * 7

export function authTokenCookieOptions() {
  const env = getEnv()
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: TOKEN_MAX_AGE,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  }
}

export function clearAuthTokenCookieOptions() {
  return { ...authTokenCookieOptions(), maxAge: 0 }
}

export function guestCartCookieOptions() {
  const env = getEnv()
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  }
}
