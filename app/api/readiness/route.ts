import { NextResponse } from "next/server"
import { runReadinessChecks } from "@/lib/readinessChecks"
import { REQUEST_ID_HEADER } from "@/lib/requestId"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const result = await runReadinessChecks()
  const requestId = request.headers.get(REQUEST_ID_HEADER)
  const httpStatus = result.status === "fail" ? 503 : 200

  return NextResponse.json(
    {
      status: result.status,
      checks: result.checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: httpStatus,
      headers: requestId ? { [REQUEST_ID_HEADER]: requestId } : undefined,
    }
  )
}
