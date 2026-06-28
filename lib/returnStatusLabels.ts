export const RETURN_STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  UNDER_REVIEW: "İnceleniyor",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
  WAITING_FOR_PRODUCT: "Ürün Bekleniyor",
  PRODUCT_RECEIVED: "Ürün Alındı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal Edildi",
}

export function returnStatusLabel(status: string): string {
  return RETURN_STATUS_LABELS[status] ?? status
}
