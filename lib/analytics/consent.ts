export const CONSENT_STORAGE_KEY = "ydy_cookie_consent_v1"
export const CONSENT_VERSION = 1

export type CookieConsent = {
  version: number
  timestamp: string
  necessary: true
  analytics: boolean
  marketing: boolean
}

export function defaultConsent(): CookieConsent {
  return {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    necessary: true,
    analytics: false,
    marketing: false,
  }
}

export function parseConsent(raw: string | null): CookieConsent | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as CookieConsent
    if (parsed.version !== CONSENT_VERSION) return null
    if (typeof parsed.analytics !== "boolean" || typeof parsed.marketing !== "boolean") {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function consentAllowsAnalytics(consent: CookieConsent | null): boolean {
  return consent?.analytics === true
}

export function consentAllowsMarketing(consent: CookieConsent | null): boolean {
  return consent?.marketing === true
}
