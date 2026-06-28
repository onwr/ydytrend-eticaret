import type { Metadata } from "next"
import { Suspense } from "react"
import { LoginForm } from "@/components/auth/LoginForm"
import { HomeFooter } from "@/components/home/HomeFooter"
import { HomeHeader } from "@/components/home/HomeHeader"
import Image from "next/image"

import { privatePageMetadata } from "@/lib/seo"

export const metadata: Metadata = privatePageMetadata({
  title: "Üye girişi",
  description: "YDY Trend hesabınıza giriş yapın.",
  path: "/login",
})

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HomeHeader />
      <main className="grid flex-1 md:grid-cols-2">
        
        {/* LEFT */}
        <div className="relative hidden flex-col justify-center overflow-hidden rounded-br-2xl bg-gradient-to-br from-brand-navy via-[#064A70] to-brand-teal p-12 text-white md:flex">
          <div className="absolute inset-0 z-0">
            <Image
              src="/auth-login-bg.png"
              alt="YDY Trend — moda aksesuar"
              fill
              className="object-cover opacity-15 mix-blend-overlay"
            />
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl font-black uppercase leading-tight tracking-tight">
              Tekrar Hoş Geldin <br /> <span className="text-brand-blue">seni özledik</span>
            </h2>
            <p className="mt-4 max-w-xs text-sm font-medium text-white/80">
              Hesabına giriş yaparak siparişlerini takip edebilir ve avantajlardan yararlanabilirsin.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center justify-center bg-brand-page px-6 py-12">
          <Suspense fallback={
            <div className="flex justify-center py-12">
               <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-border border-t-brand-teal" />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </main>
      <HomeFooter />
    </div>
  )
}
