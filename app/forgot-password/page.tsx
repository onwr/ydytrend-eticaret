import type { Metadata } from "next"
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"
import { HomeFooter } from "@/components/home/HomeFooter"
import { HomeHeader } from "@/components/home/HomeHeader"
import Image from "next/image"

import { DEFAULT_SITE_URL } from "@/lib/siteUrl"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL

export const metadata: Metadata = {
  title: "Şifremi unuttum",
  description: "YDY Trend hesabınız için şifre sıfırlama.",
  alternates: { canonical: `${siteUrl}/forgot-password` },
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <HomeHeader />
      <main className="grid flex-1 md:grid-cols-2">
        <div className="relative hidden flex-col justify-center overflow-hidden rounded-br-2xl bg-brand-gold p-12 text-white md:flex">
          <div className="absolute inset-0 z-0">
            <Image
              src="/slide2.png"
              alt=""
              fill
              className="object-cover opacity-20 mix-blend-overlay"
            />
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-black uppercase leading-tight tracking-tight">
              Şifreni mi <br /> <span className="text-[#E2E8F0]">unuttun?</span>
            </h2>
            <p className="mt-4 max-w-xs text-sm font-medium opacity-80">
              E-posta adresine tek kullanımlık bir bağlantı gönderiyoruz.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center bg-white px-6 py-12">
          <ForgotPasswordForm />
        </div>
      </main>
      <HomeFooter />
    </div>
  )
}
