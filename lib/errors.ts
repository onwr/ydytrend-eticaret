export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Bilinmeyen hata"
}

export function isPrismaUniqueViolation(error: unknown): boolean {
  return isPrismaErrorCode(error, "P2002")
}

export function isPrismaForeignKeyViolation(error: unknown): boolean {
  return isPrismaErrorCode(error, "P2003")
}

export function isPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === code
  )
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}
