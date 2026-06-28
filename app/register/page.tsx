import type { Metadata } from "next"
import RegisterForm from "@/components/auth/RegisterForm"
import { HomeFooter } from "@/components/home/HomeFooter"
import { HomeHeader } from "@/components/home/HomeHeader"
import { sanitizePostAuthPath } from "@/lib/safeCallbackUrl"
import Image from "next/image"

import { privatePageMetadata } from "@/lib/seo"

export const metadata: Metadata = privatePageMetadata({
  title: "Üye ol",
  description: "YDY Trend'e ücretsiz üye olun.",
  path: "/register",
})

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const sp = await searchParams
  const postAuthRedirect = sanitizePostAuthPath(sp.callbackUrl)

  return (
    <div className="flex flex-col min-h-screen">
      <HomeHeader />

      <main className="grid flex-1 md:grid-cols-2">

        {/* LEFT */}
        <div className="relative hidden flex-col justify-center overflow-hidden rounded-br-2xl bg-gradient-to-br from-brand-navy via-[#064A70] to-brand-teal p-12 text-white md:flex">
          <div className="absolute inset-0 z-0">
            <Image
              src="/auth-register-bg.png"
              alt="YDY Trend — üyelik"
              fill
              className="object-cover opacity-15 mix-blend-overlay"
            />
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl font-black uppercase leading-tight tracking-tight">
              Hesabını oluştur <br /> <span className="text-brand-blue">alışverişe başla</span>
            </h2>
            <p className="mt-4 max-w-xs text-sm font-medium text-white/80">
              YDY Trend ailesine katılın, size özel kampanya ve fırsatları kaçırmayın.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center justify-center bg-brand-page px-6 py-12">
          <RegisterForm postAuthRedirect={postAuthRedirect} />
        </div>

      </main>

      <HomeFooter />
    </div>
  )
}