import { getEnv } from "@/lib/env"

function cdnHostFromEnv(): string[] {
  const hosts: string[] = []
  const env = getEnv()
  for (const url of [env.CDN_BASE_URL, env.CDN_UPLOAD_URL]) {
    if (!url) continue
    try {
      hosts.push(new URL(url).hostname)
    } catch {
      /* skip */
    }
  }
  return [...new Set(hosts)]
}

export function buildSecurityHeaders(isProduction: boolean): Record<string, string> {
  const cdnHosts = cdnHostFromEnv()
  const imgSrc = ["'self'", "data:", "blob:", "https:"]
  for (const h of cdnHosts) {
    imgSrc.push(`https://${h}`)
  }

  const connectSrc = ["'self'", "https:"]
  if (process.env.NEXT_PUBLIC_GA_ID) {
    connectSrc.push("https://www.google-analytics.com", "https://region1.google-analytics.com")
  }

  const cspParts = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc.join(" ")}`,
    `connect-src ${connectSrc.join(" ")}`,
    "font-src 'self' data: https:",
    "frame-src 'self' https://www.paytr.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ]

  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-Frame-Options": "SAMEORIGIN",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
    "Content-Security-Policy": cspParts.join("; "),
  }

  if (isProduction) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
  }

  return headers
}
