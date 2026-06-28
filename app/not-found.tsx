"use client"

import Link from "next/link"
import { HomeHeader } from "@/components/home/HomeHeader"
import { HomeFooter } from "@/components/home/HomeFooter"

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fdfdfd]">
      <HomeHeader />

      <main className="flex-grow flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center space-y-8">


          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-brand-gold">404</h1>
            <h2 className="text-2xl font-medium text-zinc-800">Ups! Yolumuzu Kaybettik</h2>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mx-auto">
              Aradığınız sayfa kaldırılmış veya adresi değişmiş olabilir.
              Koleksiyon sayfamıza göz atmak ister misiniz?
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/"
              className="w-full sm:w-auto px-8 py-3 bg-brand-gold text-white rounded-full font-medium transition-all hover:bg-[#0284C7] hover:shadow-lg active:scale-95"
            >
              Anasayfaya Dön
            </Link>
            <Link
              href="/categories/kampanyalar"
              className="w-full sm:w-auto px-8 py-3 border border-brand-gold text-brand-gold rounded-full font-medium transition-all hover:bg-brand-page active:scale-95"
            >
              Kampanyalar
            </Link>
          </div>

          <div className="pt-8">
            <p className="text-xs text-zinc-400">
              Yardıma mı ihtiyacınız var? <Link href="/sikca-sorulan-sorular" className="underline hover:text-brand-gold">Destek Merkezine</Link> göz atın.
            </p>
          </div>
        </div>
      </main>

      <HomeFooter />

      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
