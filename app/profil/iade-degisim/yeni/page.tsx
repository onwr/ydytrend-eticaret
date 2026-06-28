import { redirect } from "next/navigation"
import { HomeFooter } from "@/components/home/HomeFooter"
import { HomeHeader } from "@/components/home/HomeHeader"
import { ReturnNewClient } from "@/components/profil/ReturnNewClient"
import { getUserIdFromCookies } from "@/lib/authSession"

export const dynamic = "force-dynamic"

type Props = {
  searchParams: Promise<{ orderNo?: string }>
}

export default async function YeniIadePage({ searchParams }: Props) {
  const userId = await getUserIdFromCookies()
  if (!userId) {
    redirect("/login?callback=/profil/iade-degisim/yeni")
  }

  const { orderNo } = await searchParams
  if (!orderNo?.trim()) {
    redirect("/profil?tab=siparisler")
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfdfc]">
      <HomeHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-8">
        <ReturnNewClient orderNo={orderNo.trim()} />
      </main>
      <HomeFooter />
    </div>
  )
}
