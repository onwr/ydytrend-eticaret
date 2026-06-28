"use client"

import { useEffect } from "react"
import { ErrorFallback } from "@/components/monitoring/ErrorFallback"
import { monitoringClient } from "@/lib/monitoring/index"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    monitoringClient.captureException(error, { digest: error.digest, surface: "global-error" })
  }, [error])

  return (
    <html lang="tr">
      <body className="min-h-screen bg-[#fdfdfd] antialiased">
        <ErrorFallback reset={reset} requestId={error.digest ?? null} />
      </body>
    </html>
  )
}
