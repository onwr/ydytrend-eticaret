import { NextResponse } from "next/server"
import { getEnv } from "@/lib/env"
import { getUptimeSeconds } from "@/lib/appLifecycle"
import { REQUEST_ID_HEADER } from "@/lib/requestId"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const env = getEnv()
  const requestId = request.headers.get(REQUEST_ID_HEADER)

  return NextResponse.json(
    {
      status: "ok",
      version: process.env.npm_package_version ?? "0.1.0",
      environment: env.NODE_ENV,
      uptimeSeconds: getUptimeSeconds(),
      timestamp: new Date().toISOString(),
    },
    {
      headers: requestId ? { [REQUEST_ID_HEADER]: requestId } : undefined,
    }
  )
}
