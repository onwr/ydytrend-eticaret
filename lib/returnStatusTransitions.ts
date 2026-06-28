import { ReturnRequestStatus } from "@/generated/prisma/client"
import { RETURN_STATUS_LABELS } from "@/lib/returnStatusLabels"

export { RETURN_STATUS_LABELS, returnStatusLabel } from "@/lib/returnStatusLabels"

export type ReturnAdminAction =
  | "review"
  | "approve"
  | "reject"
  | "product_received"
  | "complete"

const TERMINAL = new Set<ReturnRequestStatus>(["REJECTED", "COMPLETED", "CANCELLED"])

const ALLOWED_TRANSITIONS: Record<ReturnRequestStatus, ReadonlySet<ReturnRequestStatus>> = {
  PENDING: new Set(["UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"]),
  UNDER_REVIEW: new Set(["APPROVED", "REJECTED", "CANCELLED"]),
  APPROVED: new Set(["WAITING_FOR_PRODUCT"]),
  WAITING_FOR_PRODUCT: new Set(["PRODUCT_RECEIVED"]),
  PRODUCT_RECEIVED: new Set(["COMPLETED"]),
  REJECTED: new Set(),
  COMPLETED: new Set(),
  CANCELLED: new Set(),
}

const ACTION_RULES: Record<
  ReturnAdminAction,
  { from: ReadonlySet<ReturnRequestStatus>; to: ReturnRequestStatus }
> = {
  review: {
    from: new Set<ReturnRequestStatus>(["PENDING"]),
    to: "UNDER_REVIEW",
  },
  approve: {
    from: new Set<ReturnRequestStatus>(["PENDING", "UNDER_REVIEW", "APPROVED"]),
    to: "WAITING_FOR_PRODUCT",
  },
  reject: {
    from: new Set<ReturnRequestStatus>([
      "PENDING",
      "UNDER_REVIEW",
      "APPROVED",
      "WAITING_FOR_PRODUCT",
    ]),
    to: "REJECTED",
  },
  product_received: {
    from: new Set<ReturnRequestStatus>(["APPROVED", "WAITING_FOR_PRODUCT"]),
    to: "PRODUCT_RECEIVED",
  },
  complete: {
    from: new Set<ReturnRequestStatus>(["PRODUCT_RECEIVED"]),
    to: "COMPLETED",
  },
}

export function isTerminalReturnStatus(status: ReturnRequestStatus): boolean {
  return TERMINAL.has(status)
}

export function canTransitionReturnStatus(
  from: ReturnRequestStatus,
  to: ReturnRequestStatus
): boolean {
  if (isTerminalReturnStatus(from)) return false
  return ALLOWED_TRANSITIONS[from]?.has(to) ?? false
}

export function canCustomerCancelReturn(status: ReturnRequestStatus): boolean {
  return status === "PENDING" || status === "UNDER_REVIEW"
}

export function validateReturnAdminAction(
  current: ReturnRequestStatus,
  action: ReturnAdminAction
): { ok: true; nextStatus: ReturnRequestStatus } | { ok: false; message: string } {
  if (isTerminalReturnStatus(current)) {
    return {
      ok: false,
      message: `${RETURN_STATUS_LABELS[current]} durumunda işlem yapılamaz.`,
    }
  }
  const rule = ACTION_RULES[action]
  if (!rule.from.has(current)) {
    return {
      ok: false,
      message: `${RETURN_STATUS_LABELS[current]} durumunda "${action}" işlemi yapılamaz.`,
    }
  }
  if (!canTransitionReturnStatus(current, rule.to)) {
    return {
      ok: false,
      message: `${RETURN_STATUS_LABELS[current]} → ${RETURN_STATUS_LABELS[rule.to]} geçişi izinli değil.`,
    }
  }
  return { ok: true, nextStatus: rule.to }
}
