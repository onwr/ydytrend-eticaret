import { OrderStatus, PaymentMethod, PaymentStatus } from "@/generated/prisma/client"

export type PaymentRejectInput = {
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  receiptUrl: string | null
  orderStatus: OrderStatus
}

export type PaymentRejectResult =
  | { ok: true; nextPaymentStatus: PaymentStatus; nextOrderStatus: OrderStatus }
  | { ok: false; message: string; status: number }

export function validateBankTransferReject(input: PaymentRejectInput): PaymentRejectResult {
  if (input.paymentMethod !== PaymentMethod.BANK_TRANSFER) {
    return { ok: false, message: "Bu sipariş havale/EFT ödemesi değil.", status: 400 }
  }
  if (input.paymentStatus === PaymentStatus.PAID) {
    return { ok: false, message: "Ödeme zaten onaylanmış.", status: 400 }
  }
  if (input.paymentStatus === PaymentStatus.FAILED) {
    return { ok: false, message: "Ödeme zaten reddedilmiş.", status: 400 }
  }
  if (!input.receiptUrl?.trim()) {
    return { ok: false, message: "Red işlemi için dekont yüklenmiş olmalıdır.", status: 400 }
  }
  const nextOrderStatus =
    input.orderStatus === OrderStatus.PENDING || input.orderStatus === OrderStatus.PAID
      ? OrderStatus.CANCELLED
      : input.orderStatus
  return {
    ok: true,
    nextPaymentStatus: PaymentStatus.FAILED,
    nextOrderStatus,
  }
}
