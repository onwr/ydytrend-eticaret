"use client"

import { useEffect } from "react"
import { ErrorFallback } from "@/components/monitoring/ErrorFallback"
import { monitoringClient } from "@/lib/monitoring/index"
import { HomeFooter } from "@/components/home/HomeFooter"
import { HomeHeader } from "@/components/home/HomeHeader"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    monitoringClient.captureException(error, { digest: error.digest, surface: "app/error" })
  }, [error])

  return (
    <div className="flex min-h-screen flex-col bg-[#fdfdfd]">
      <HomeHeader />
      <ErrorFallback reset={reset} requestId={error.digest ?? null} />
      <HomeFooter />
    </div>
  )
}
