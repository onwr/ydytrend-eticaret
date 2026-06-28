import { redirect } from "next/navigation"
import { HomeFooter } from "@/components/home/HomeFooter"
import { HomeHeader } from "@/components/home/HomeHeader"
import { ReturnDetailClient } from "@/components/profil/ReturnDetailClient"
import { getUserIdFromCookies } from "@/lib/authSession"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ requestNumber: string }>
}

export default async function IadeDetayPage({ params }: Props) {
  const userId = await getUserIdFromCookies()
  if (!userId) {
    const { requestNumber } = await params
    redirect(
      `/login?callback=/profil/iade-degisim/${encodeURIComponent(requestNumber)}`
    )
  }

  const { requestNumber } = await params

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfdfc]">
      <HomeHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-8">
        <ReturnDetailClient requestNumber={decodeURIComponent(requestNumber)} />
      </main>
      <HomeFooter />
    </div>
  )
}
