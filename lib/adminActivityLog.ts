import type { Prisma, PrismaClient } from "@/generated/prisma/client"
import { getClientIp } from "@/lib/checkoutRateLimit"
import { maskEmail } from "@/lib/logRedaction"
import { logger } from "@/lib/logger"
import { getRequestId } from "@/lib/requestId"

/** İşlem kodları (filtre / rapor için sabit string). */
export const AdminActivityAction = {
  ADMIN_LOGIN: "ADMIN_LOGIN",
  ADMIN_LOGIN_FAILED: "ADMIN_LOGIN_FAILED",
  SMTP_SAVE: "SMTP_SAVE",
  SMTP_TEST: "SMTP_TEST",
  ORDER_STATUS_UPDATE: "ORDER_STATUS_UPDATE",
  ORDER_BULK_UPDATE: "ORDER_BULK_UPDATE",
  ORDER_DELETE: "ORDER_DELETE",
  PRODUCT_CREATE: "PRODUCT_CREATE",
  PRODUCT_UPDATE: "PRODUCT_UPDATE",
  PRODUCT_DELETE: "PRODUCT_DELETE",
  PRODUCT_BULK: "PRODUCT_BULK",
  ATTRIBUTE_CREATE: "ATTRIBUTE_CREATE",
  ATTRIBUTE_UPDATE: "ATTRIBUTE_UPDATE",
  ATTRIBUTE_DELETE: "ATTRIBUTE_DELETE",
  ATTRIBUTE_VALUE_CREATE: "ATTRIBUTE_VALUE_CREATE",
  ATTRIBUTE_VALUE_UPDATE: "ATTRIBUTE_VALUE_UPDATE",
  ATTRIBUTE_VALUE_DELETE: "ATTRIBUTE_VALUE_DELETE",
  CATEGORY_UPDATE: "CATEGORY_UPDATE",
  CATEGORY_DELETE: "CATEGORY_DELETE",
  CUSTOMER_UPDATE: "CUSTOMER_UPDATE",
  CUSTOMER_DELETE: "CUSTOMER_DELETE",
  USER_ROLE_UPDATE: "USER_ROLE_UPDATE",
  COUPON_CREATE: "COUPON_CREATE",
  COUPON_UPDATE: "COUPON_UPDATE",
  COUPON_DELETE: "COUPON_DELETE",
  REVIEW_UPDATE: "REVIEW_UPDATE",
  REVIEW_DELETE: "REVIEW_DELETE",
  FAQ_CREATE: "FAQ_CREATE",
  FAQ_UPDATE: "FAQ_UPDATE",
  FAQ_DELETE: "FAQ_DELETE",
  SHIPPING_SAVE: "SHIPPING_SAVE",
  BANK_TRANSFER_SAVE: "BANK_TRANSFER_SAVE",
  PAYMENT_APPROVE: "PAYMENT_APPROVE",
  PAYMENT_REJECT: "PAYMENT_REJECT",
  ORDER_CANCEL: "ORDER_CANCEL",
  ORDER_SHIPMENT_UPDATE: "ORDER_SHIPMENT_UPDATE",
  RETURN_REQUEST_CREATE: "RETURN_REQUEST_CREATE",
  RETURN_REQUEST_UPDATE: "RETURN_REQUEST_UPDATE",
  REFUND_UPDATE: "REFUND_UPDATE",
  RETURN_POLICY_SAVE: "RETURN_POLICY_SAVE",
  FOOTER_SOCIAL_SAVE: "FOOTER_SOCIAL_SAVE",
  STOCK_INCREASE: "STOCK_INCREASE",
  NAV_SYNC_CATEGORIES: "NAV_SYNC_CATEGORIES",
  NAV_ITEM_CREATE: "NAV_ITEM_CREATE",
  NAV_ITEM_UPDATE: "NAV_ITEM_UPDATE",
  NAV_ITEM_DELETE: "NAV_ITEM_DELETE",
  NAV_ANNOUNCEMENTS_SAVE: "NAV_ANNOUNCEMENTS_SAVE",
  HOMEPAGE_SECTION_CREATE: "HOMEPAGE_SECTION_CREATE",
  HOMEPAGE_SECTION_UPDATE: "HOMEPAGE_SECTION_UPDATE",
  HOMEPAGE_SECTION_DELETE: "HOMEPAGE_SECTION_DELETE",
  HOMEPAGE_SLIDER_CREATE: "HOMEPAGE_SLIDER_CREATE",
  HOMEPAGE_SLIDER_UPDATE: "HOMEPAGE_SLIDER_UPDATE",
  HOMEPAGE_SLIDER_DELETE: "HOMEPAGE_SLIDER_DELETE",
  HOMEPAGE_BANNER_CREATE: "HOMEPAGE_BANNER_CREATE",
  HOMEPAGE_BANNER_UPDATE: "HOMEPAGE_BANNER_UPDATE",
  HOMEPAGE_BANNER_DELETE: "HOMEPAGE_BANNER_DELETE",
  HOMEPAGE_CATEGORIES_SAVE: "HOMEPAGE_CATEGORIES_SAVE",
  UPLOAD_FILE: "UPLOAD_FILE",
  NEWSLETTER_EXPORT: "NEWSLETTER_EXPORT",
  STORE_SALE_CREATE: "STORE_SALE_CREATE",
  STORE_SALE_VOID: "STORE_SALE_VOID",
  STORE_INVENTORY_COUNT: "STORE_INVENTORY_COUNT",
} as const

export type AdminSession = { userId: number; email: string; role: string }

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max - 1) + "…"
}

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "smtp_password",
  "token",
  "secret",
  "authorization",
  "unsubscribetoken",
  "resettoken",
])

type SanitizeMetadataOpts = {
  /** Sipariş silme gibi denetim kayıtlarında daha geniş JSON/string limiti. */
  generous?: boolean
}

/** Küçük, güvenli metadata; şifre anahtarlarını atlar. */
export function sanitizeAdminActivityMetadata(
  raw: Record<string, unknown> | null | undefined,
  opts?: SanitizeMetadataOpts
): Prisma.InputJsonValue | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const maxStr = opts?.generous ? 15_000 : 500
  const maxNested = opts?.generous ? 400_000 : 800
  const maxArrayJson = opts?.generous ? 400_000 : 8_000
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) continue
    if (v === null || typeof v === "boolean" || typeof v === "number") {
      out[k] = v
      continue
    }
    if (typeof v === "string") {
      out[k] = v.length > maxStr ? truncate(v, maxStr) : v
      continue
    }
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      try {
        const s = JSON.stringify(v)
        if (s.length > maxNested) {
          out[k] = { _truncated: true, jsonPreview: truncate(s, maxNested) }
        } else {
          out[k] = JSON.parse(s) as unknown
        }
      } catch {
        out[k] = "[object]"
      }
      continue
    }
    if (Array.isArray(v)) {
      try {
        const s = JSON.stringify(v)
        if (s.length > maxArrayJson) {
          out[k] = {
            _arrayTruncated: true,
            length: v.length,
            preview: v.slice(0, Math.min(80, v.length)),
          }
        } else {
          out[k] = JSON.parse(s) as unknown
        }
      } catch {
        out[k] = String(v).slice(0, 200)
      }
      continue
    }
    try {
      out[k] = JSON.parse(JSON.stringify(v)) as unknown
    } catch {
      out[k] = String(v).slice(0, 200)
    }
  }
  return Object.keys(out).length ? (out as Prisma.InputJsonValue) : undefined
}

export type LogAdminActivityInput = {
  action: string
  resourceType?: string | null
  resourceId?: string | null
  metadata?: Record<string, unknown> | null
  /** İstemci IP’si için isteği geçirin. */
  request?: Request | null
  /** `sanitizeAdminActivityMetadata` için geniş limit (ör. sipariş silme anlık görüntüsü). */
  generousMetadata?: boolean
}

function mergeRequestIdMetadata(
  metadata: Record<string, unknown> | null | undefined,
  request?: Request | null
): Record<string, unknown> | undefined {
  const base = metadata ? { ...metadata } : {}
  if (request) {
    base.requestId = getRequestId(request)
  }
  return Object.keys(base).length ? base : undefined
}

async function persistActivity(
  prisma: PrismaClient,
  data: {
    actorUserId: number | null
    actorEmail: string
    action: string
    resourceType?: string | null
    resourceId?: string | null
    metadata?: Record<string, unknown> | null
    request?: Request | null
    generousMetadata?: boolean
  }
): Promise<void> {
  const ipRaw = data.request ? getClientIp(data.request) : null
  const ip =
    ipRaw && ipRaw !== "unknown" && ipRaw.length > 0 ? truncate(ipRaw, 45) : null

  await prisma.adminActivity.create({
    data: {
      actorUserId: data.actorUserId,
      actorEmail: truncate(data.actorEmail.trim() || "unknown", 255),
      action: truncate(data.action, 80),
      resourceType: data.resourceType ? truncate(data.resourceType, 80) : null,
      resourceId: data.resourceId ? truncate(String(data.resourceId), 255) : null,
      metadata: sanitizeAdminActivityMetadata(
        mergeRequestIdMetadata(data.metadata, data.request),
        { generous: data.generousMetadata === true }
      ),
      ip,
    },
  })
}

/**
 * Başarılı admin mutasyonundan sonra çağrın. Hata loglanır, ana işlemi bozmaz.
 */
export async function logAdminActivity(
  prisma: PrismaClient,
  session: AdminSession | null,
  input: LogAdminActivityInput
): Promise<void> {
  if (!session) return

  try {
    await persistActivity(prisma, {
      actorUserId: session.userId,
      actorEmail: session.email,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata,
      request: input.request,
      generousMetadata: input.generousMetadata,
    })
  } catch {
    logger.error("logAdminActivity failed", {
      action: input.action,
      requestId: input.request ? getRequestId(input.request) : undefined,
    })
  }
}

/** Oturumsuz güvenlik olayları (başarısız admin girişi vb.). */
export async function logSecurityEvent(
  prisma: PrismaClient,
  input: LogAdminActivityInput & {
    actorEmail?: string
    actorUserId?: number | null
  }
): Promise<void> {
  try {
    const email = input.actorEmail?.trim()
    await persistActivity(prisma, {
      actorUserId: input.actorUserId ?? null,
      actorEmail: email ? maskEmail(email) : "unknown",
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata,
      request: input.request,
      generousMetadata: input.generousMetadata,
    })
  } catch {
    logger.error("logSecurityEvent failed", {
      action: input.action,
      requestId: input.request ? getRequestId(input.request) : undefined,
    })
  }
}
