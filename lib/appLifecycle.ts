/** Uygulama başlangıç zamanı — uptime için. */
export const APP_STARTED_AT = Date.now()

export function getUptimeSeconds(): number {
  return Math.floor((Date.now() - APP_STARTED_AT) / 1000)
}
