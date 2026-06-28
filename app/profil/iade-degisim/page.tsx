import { redirect } from "next/navigation"
import { HomeFooter } from "@/components/home/HomeFooter"
import { HomeHeader } from "@/components/home/HomeHeader"
import { ReturnsListClient } from "@/components/profil/ReturnsListClient"
import { getUserIdFromCookies } from "@/lib/authSession"

export const dynamic = "force-dynamic"

export default async function IadeDegisimPage() {
  const userId = await getUserIdFromCookies()
  if (!userId) {
    redirect("/login?callback=/profil/iade-degisim")
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfdfc]">
      <HomeHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 md:px-8">
        <ReturnsListClient />
      </main>
      <HomeFooter />
    </div>
  )
}
