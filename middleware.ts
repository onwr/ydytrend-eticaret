import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { requiresCsrfCheck, validateApiOrigin } from "@/lib/csrf"
import { buildSecurityHeaders } from "@/lib/securityHeaders"
import { resolveRequestId, REQUEST_ID_HEADER } from "@/lib/requestId"

const ADMIN_PATHS = ["/admin"]

async function verifyAdminJwt(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return false
    const [header, payload, sig] = parts as [string, string, string]

    const enc = new TextEncoder()
    const keyData = enc.encode(secret)
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    )

    function b64urlToBuffer(b64: string): Uint8Array {
      const padded = b64.replace(/-/g, "+").replace(/_/g, "/")
      const binary = atob(padded)
      const buf = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i)
      return buf
    }

    const sigBuf = b64urlToBuffer(sig).buffer as ArrayBuffer
    const msgBuf = enc.encode(`${header}.${payload}`)

    const valid = await crypto.subtle.verify("HMAC", key, sigBuf, msgBuf)
    if (!valid) return false

    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as Record<
      string,
      unknown
    >

    if (typeof claims.exp === "number" && claims.exp < Math.floor(Date.now() / 1000)) return false

    return claims.role === "ADMIN"
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isProduction = process.env.NODE_ENV === "production"
  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER))
  const forwardHeaders = new Headers(request.headers)
  forwardHeaders.set(REQUEST_ID_HEADER, requestId)

  if (requiresCsrfCheck(request.method, pathname)) {
    const csrf = validateApiOrigin(request)
    if (!csrf.ok) {
      return NextResponse.json(
        {
          message: "İstek kaynağı doğrulanamadı.",
          requestId,
          error: { code: "CSRF_REJECTED", message: "İstek kaynağı doğrulanamadı." },
        },
        {
          status: 403,
          headers: { [REQUEST_ID_HEADER]: requestId },
        }
      )
    }
  }

  const isAdmin = ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))

  if (isAdmin) {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.redirect(
        new URL("/login?callbackUrl=" + encodeURIComponent(pathname), request.url)
      )
    }

    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.redirect(
        new URL("/login?callbackUrl=" + encodeURIComponent(pathname), request.url)
      )
    }

    const ok = await verifyAdminJwt(token, jwtSecret)
    if (!ok) {
      const res = NextResponse.redirect(
        new URL("/login?next=" + encodeURIComponent(pathname), request.url)
      )
      res.cookies.delete("token")
      return res
    }
  }

  const res = NextResponse.next({ request: { headers: forwardHeaders } })
  const headers = buildSecurityHeaders(isProduction)
  for (const [key, value] of Object.entries(headers)) {
    res.headers.set(key, value)
  }
  res.headers.set(REQUEST_ID_HEADER, requestId)
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
