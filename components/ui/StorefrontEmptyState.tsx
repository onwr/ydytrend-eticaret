import Link from "next/link"
import type { ReactNode } from "react"

type Props = {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export function StorefrontEmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-border bg-brand-card px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-blush-soft text-brand-gold">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-brand-navy">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-brand-muted">{description}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-gold px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-gold px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
