"use client"

import { useEffect } from "react"
import { ErrorFallback } from "@/components/monitoring/ErrorFallback"
import { monitoringClient } from "@/lib/monitoring/index"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    monitoringClient.captureException(error, { digest: error.digest, surface: "admin/error" })
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <ErrorFallback
        title="Admin panel hatası"
        reset={reset}
        requestId={error.digest ?? null}
      />
    </div>
  )
}
