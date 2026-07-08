import { getEnv } from "@/lib/env"
import { prisma } from "@/lib/prisma"
import { getSmtpConfigForAdmin } from "@/lib/smtpSettings"
import { constants } from "node:fs"
import { access } from "node:fs/promises"
import path from "node:path"

export type ReadinessCheck = "ok" | "degraded" | "fail" | "skipped" | "configured" | "missing"

export type ReadinessResult = {
  status: "ok" | "degraded" | "fail"
  checks: Record<string, ReadinessCheck>
}

async function checkDatabase(): Promise<ReadinessCheck> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return "ok"
  } catch {
    return "fail"
  }
}

async function checkUploads(): Promise<ReadinessCheck> {
  const env = getEnv()
  if (env.CDN_UPLOAD_URL && env.CDN_UPLOAD_TOKEN && env.CDN_BASE_URL) return "ok"
  if (env.CDN_UPLOAD_URL && env.CDN_BASE_URL) return "degraded"
  try {
    await access(path.join(process.cwd(), "public"), constants.R_OK)
    return "ok"
  } catch {
    return "missing"
  }
}

async function checkMail(): Promise<ReadinessCheck> {
  try {
    const cfg = await getSmtpConfigForAdmin(prisma)
    if (cfg.mailEnabled && cfg.host) return "configured"
    if (cfg.host) return "degraded"
    return "missing"
  } catch {
    return "degraded"
  }
}

function checkEnv(): ReadinessCheck {
  try {
    getEnv()
    return "ok"
  } catch {
    return "fail"
  }
}

function checkMonitoring(): ReadinessCheck {
  return process.env.SENTRY_DSN?.trim() ? "configured" : "skipped"
}

export async function runReadinessChecks(): Promise<ReadinessResult> {
  const [database, uploads, mail] = await Promise.all([
    checkDatabase(),
    checkUploads(),
    checkMail(),
  ])
  const env = checkEnv()
  const monitoring = checkMonitoring()

  const checks: Record<string, ReadinessCheck> = {
    database,
    uploads,
    mail,
    env,
    monitoring,
  }

  const values = Object.values(checks)
  let status: ReadinessResult["status"] = "ok"
  if (values.includes("fail")) status = "fail"
  else if (values.includes("degraded") || values.includes("missing")) status = "degraded"

  return { status, checks }
}
