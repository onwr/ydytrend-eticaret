const REQUEST_ID_RE = /^[a-zA-Z0-9-]{8,64}$/

/** Gelen x-request-id doğrula veya yeni UUID üret. */
export function resolveRequestId(incoming: string | null | undefined): string {
  const trimmed = incoming?.trim()
  if (trimmed && REQUEST_ID_RE.test(trimmed)) {
    return trimmed
  }
  return crypto.randomUUID()
}

export function getRequestId(request: Request): string {
  return resolveRequestId(request.headers.get("x-request-id"))
}

export const REQUEST_ID_HEADER = "x-request-id"
