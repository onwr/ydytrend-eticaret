import { readdir, stat, unlink } from "node:fs/promises"
import path from "node:path"
import type { PrismaClient } from "@/generated/prisma/client"
import { logger } from "@/lib/logger"
import {
  getUploadCleanupDryRun,
  getUploadCleanupMinAgeHours,
  UPLOAD_CLEANUP_BATCH_LIMIT,
} from "@/lib/email/outboxConfig"

/** Yalnızca bu alt klasörler taranır — path traversal engellenir. */
export const UPLOAD_CLEANUP_ALLOWLIST = ["receipts", "temp", "returns"] as const

export type UploadCleanupResult = {
  scanned: number
  candidates: number
  deleted: number
  dryRun: boolean
  errors: number
}

function resolveAllowedDir(root: string, folder: string): string | null {
  if (!UPLOAD_CLEANUP_ALLOWLIST.includes(folder as (typeof UPLOAD_CLEANUP_ALLOWLIST)[number])) {
    return null
  }
  const resolved = path.resolve(root, folder)
  const rootResolved = path.resolve(root)
  if (!resolved.startsWith(rootResolved + path.sep) && resolved !== rootResolved) {
    return null
  }
  return resolved
}

function fileUrlToLocalPath(fileUrl: string, uploadRoot: string): string | null {
  try {
    const url = new URL(fileUrl)
    const pathname = decodeURIComponent(url.pathname)
    const marker = "/uploads/"
    const idx = pathname.indexOf(marker)
    if (idx === -1) return null
    const rel = pathname.slice(idx + marker.length)
    const parts = rel.split("/").filter(Boolean)
    if (parts.length < 2) return null
    const [folder, ...rest] = parts
    const dir = resolveAllowedDir(uploadRoot, folder)
    if (!dir) return null
    const filePath = path.resolve(dir, ...rest)
    if (!filePath.startsWith(dir + path.sep)) return null
    return filePath
  } catch {
    if (fileUrl.startsWith("/uploads/")) {
      const rel = fileUrl.slice("/uploads/".length)
      const parts = rel.split("/").filter(Boolean)
      if (parts.length < 2) return null
      const [folder, ...rest] = parts
      const dir = resolveAllowedDir(uploadRoot, folder)
      if (!dir) return null
      const filePath = path.resolve(dir, ...rest)
      if (!filePath.startsWith(dir + path.sep)) return null
      return filePath
    }
    return null
  }
}

async function collectReferencedPaths(prisma: PrismaClient, uploadRoot: string): Promise<Set<string>> {
  const referenced = new Set<string>()

  const [attachments, payments] = await Promise.all([
    prisma.returnAttachment.findMany({ select: { fileUrl: true } }),
    prisma.payment.findMany({
      where: { receiptUrl: { not: null } },
      select: { receiptUrl: true },
    }),
  ])

  for (const row of attachments) {
    const p = fileUrlToLocalPath(row.fileUrl, uploadRoot)
    if (p) referenced.add(p)
  }
  for (const row of payments) {
    if (row.receiptUrl) {
      const p = fileUrlToLocalPath(row.receiptUrl, uploadRoot)
      if (p) referenced.add(p)
    }
  }

  return referenced
}

async function walkFiles(dir: string, minAgeMs: number, batchLimit: number): Promise<string[]> {
  const results: string[] = []
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return results
  }

  for (const name of entries) {
    if (results.length >= batchLimit) break
    const full = path.join(dir, name)
    if (name.includes("..") || name.includes("/") || name.includes("\\")) continue
    let st
    try {
      st = await stat(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      const nested = await walkFiles(full, minAgeMs, batchLimit - results.length)
      results.push(...nested)
      continue
    }
    if (!st.isFile()) continue
    if (Date.now() - st.mtimeMs < minAgeMs) continue
    results.push(full)
  }
  return results
}

/** Orphan / süresi geçmiş upload dosyalarını temizle. */
export async function runUploadCleanup(prisma: PrismaClient): Promise<UploadCleanupResult> {
  const uploadRoot = path.join(process.cwd(), "public", "uploads")
  const dryRun = getUploadCleanupDryRun()
  const minAgeMs = getUploadCleanupMinAgeHours() * 60 * 60 * 1000
  const referenced = await collectReferencedPaths(prisma, uploadRoot)

  const result: UploadCleanupResult = {
    scanned: 0,
    candidates: 0,
    deleted: 0,
    dryRun,
    errors: 0,
  }

  for (const folder of UPLOAD_CLEANUP_ALLOWLIST) {
    const dir = resolveAllowedDir(uploadRoot, folder)
    if (!dir) continue

    const files = await walkFiles(dir, minAgeMs, UPLOAD_CLEANUP_BATCH_LIMIT - result.candidates)
    result.scanned += files.length

    for (const filePath of files) {
      if (result.candidates >= UPLOAD_CLEANUP_BATCH_LIMIT) break
      if (referenced.has(filePath)) continue
      result.candidates++

      if (dryRun) {
        logger.info("Upload cleanup dry-run candidate", { filePath: path.basename(filePath), folder })
        continue
      }

      try {
        await unlink(filePath)
        result.deleted++
        logger.info("Upload cleanup deleted", { filePath: path.basename(filePath), folder })
      } catch (e) {
        result.errors++
        logger.warn("Upload cleanup delete failed", {
          filePath: path.basename(filePath),
          message: e instanceof Error ? e.message : "unknown",
        })
      }
    }
  }

  logger.info("Upload cleanup completed", result)
  return result
}

/** Path traversal reddi — test ve güvenlik için export. */
export function isPathTraversalAttempt(folder: string, segments: string[]): boolean {
  if (!UPLOAD_CLEANUP_ALLOWLIST.includes(folder as (typeof UPLOAD_CLEANUP_ALLOWLIST)[number])) {
    return true
  }
  const uploadRoot = path.join(process.cwd(), "public", "uploads")
  const dir = resolveAllowedDir(uploadRoot, folder)
  if (!dir) return true
  for (const seg of segments) {
    if (seg === ".." || seg.includes("/") || seg.includes("\\")) return true
  }
  const filePath = path.resolve(dir, ...segments)
  return !filePath.startsWith(dir + path.sep)
}
