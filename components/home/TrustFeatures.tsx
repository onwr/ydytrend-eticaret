import { FaTruck, FaShieldAlt, FaUndo, FaHeadset } from "react-icons/fa"

const ITEMS = [
  {
    icon: FaTruck,
    title: "Hızlı Kargo",
    description: "Stoktaki ürünlerde aynı gün kargo",
  },
  {
    icon: FaShieldAlt,
    title: "Güvenli Ödeme",
    description: "256-bit SSL ile korunan ödeme",
  },
  {
    icon: FaUndo,
    title: "Kolay İade",
    description: "14 gün içinde ücretsiz iade",
  },
  {
    icon: FaHeadset,
    title: "Müşteri Desteği",
    description: "Sorularınız için her zaman yanınızdayız",
  },
] as const

export function TrustFeatures() {
  return (
    <section className="py-8 md:py-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex items-start gap-4 rounded-2xl border border-brand-border bg-brand-card p-5 shadow-[0_2px_12px_rgba(35,32,32,0.04)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blush-soft text-brand-gold">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand-text">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-brand-muted">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
