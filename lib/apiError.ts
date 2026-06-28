import { NextResponse } from "next/server"
import { getRequestId, REQUEST_ID_HEADER } from "@/lib/requestId"

export type ApiErrorBody = {
  message: string
  requestId?: string
  error: {
    code: string
    message: string
    fieldErrors?: Record<string, string[]>
  }
}

export function jsonApiError(
  code: string,
  message: string,
  status: number,
  opts?: {
    fieldErrors?: Record<string, string[]>
    headers?: Record<string, string>
    requestId?: string
  }
): NextResponse<ApiErrorBody> {
  const requestId = opts?.requestId
  const body: ApiErrorBody = {
    message,
    ...(requestId ? { requestId } : {}),
    error: {
      code,
      message,
      ...(opts?.fieldErrors ? { fieldErrors: opts.fieldErrors } : {}),
    },
  }
  const headers: Record<string, string> = { ...(opts?.headers ?? {}) }
  if (requestId) {
    headers[REQUEST_ID_HEADER] = requestId
  }
  return NextResponse.json(body, { status, headers })
}

export function jsonApiErrorFromRequest(
  request: Request,
  code: string,
  message: string,
  status: number,
  opts?: { fieldErrors?: Record<string, string[]> }
): NextResponse<ApiErrorBody> {
  const requestId = getRequestId(request)
  return jsonApiError(code, message, status, {
    ...opts,
    requestId,
  })
}

export function jsonRateLimited(
  retryAfterSeconds: number,
  request?: Request
): NextResponse<ApiErrorBody> {
  const requestId = request ? getRequestId(request) : undefined
  return jsonApiError(
    "RATE_LIMITED",
    "Çok fazla istek. Lütfen kısa süre sonra tekrar deneyin.",
    429,
    {
      requestId,
      headers: { "Retry-After": String(Math.max(1, retryAfterSeconds)) },
    }
  )
}

export function jsonUnauthorized(
  message = "Giriş gerekli.",
  request?: Request
): NextResponse<ApiErrorBody> {
  if (request) return jsonApiErrorFromRequest(request, "UNAUTHORIZED", message, 401)
  return jsonApiError("UNAUTHORIZED", message, 401)
}

export function jsonForbidden(
  message = "Yetkisiz erişim.",
  request?: Request
): NextResponse<ApiErrorBody> {
  if (request) return jsonApiErrorFromRequest(request, "FORBIDDEN", message, 403)
  return jsonApiError("FORBIDDEN", message, 403)
}

export function jsonBadRequest(
  message: string,
  fieldErrors?: Record<string, string[]>,
  request?: Request
): NextResponse<ApiErrorBody> {
  if (request) {
    return jsonApiErrorFromRequest(request, "BAD_REQUEST", message, 400, { fieldErrors })
  }
  return jsonApiError("BAD_REQUEST", message, 400, { fieldErrors })
}

export function jsonCsrfRejected(request?: Request): NextResponse<ApiErrorBody> {
  if (request) {
    return jsonApiErrorFromRequest(request, "CSRF_REJECTED", "İstek kaynağı doğrulanamadı.", 403)
  }
  return jsonApiError("CSRF_REJECTED", "İstek kaynağı doğrulanamadı.", 403)
}

export function jsonInternalError(
  message = "Sunucu hatası.",
  request?: Request
): NextResponse<ApiErrorBody> {
  if (request) return jsonApiErrorFromRequest(request, "INTERNAL_ERROR", message, 500)
  return jsonApiError("INTERNAL_ERROR", message, 500)
}

export function withRequestIdHeader<T>(request: Request, response: NextResponse<T>): NextResponse<T> {
  response.headers.set(REQUEST_ID_HEADER, getRequestId(request))
  return response
}
