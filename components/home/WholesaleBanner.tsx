import Link from "next/link"
import { FaInstagram, FaTiktok } from "react-icons/fa6"
import { FaHeart } from "react-icons/fa"

export function WholesaleBanner() {
  return (
    <section className="py-8 md:py-10">
      <div
        className="relative overflow-hidden rounded-2xl md:rounded-3xl"
        style={{ background: "var(--brand-navy-dark)" }}
      >
        <div className="mx-auto grid max-w-[1440px] gap-6 px-6 py-8 md:grid-cols-[1fr_auto] md:items-center md:gap-10 md:px-10 md:py-10">
          <div className="relative z-10">
            <span className="inline-block rounded-full bg-brand-gold/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-gold-soft">
              YDY Trend
            </span>
            <h2 className="mt-3 text-xl font-bold text-white md:text-2xl">
              Stilini Sosyal Medyada Paylaş
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75 md:text-[15px]">
              YDY Trend ile tarzını yansıt. Ürünlerimizi etiketleyerek topluluğumuza katıl, seçilen paylaşımlar sayfamızda yer alsın.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/sikca-sorulan-sorular"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gold px-5 py-3 text-[13px] font-semibold text-white transition-all duration-200 hover:bg-brand-gold-soft hover:text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
              >
                <FaHeart className="h-3.5 w-3.5" />
                Daha Fazla Bilgi Al
              </Link>
            </div>
          </div>

          <div className="relative z-10 hidden items-center gap-4 md:flex" aria-hidden>
            {[FaInstagram, FaTiktok, FaHeart].map((Icon, i) => (
              <div
                key={i}
                className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-gold/30 bg-brand-gold/10 text-brand-gold"
              >
                <Icon className="h-7 w-7" />
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-gold/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 right-20 h-32 w-32 rounded-full bg-brand-blush/10 blur-2xl" />
      </div>
    </section>
  )
}
