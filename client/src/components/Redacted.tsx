import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { REDACTED, REDACTED_LABEL, isRedacted } from '@/lib/brand'

// EXPORTS: isRedactedValue, Redacted, Sensitive

/**
 * True for the REDACTED sentinel and for ids that keep an internal suffix on top of it
 * (e.g. the `[redacted]_01` / `[redacted]_02` duplicate-claim quirk).
 */
export function isRedactedValue(value: unknown): boolean {
  return isRedacted(value) || (typeof value === 'string' && value.startsWith(REDACTED))
}

interface RedactedProps {
  /** Show just "Redacted" — for tight table cells */
  short?: boolean
  className?: string
}

/** Inline grey bar standing in for a record-level value withheld from the public demo */
export function Redacted({ short = false, className }: RedactedProps) {
  return (
    <span
      title={REDACTED_LABEL}
      aria-label={REDACTED_LABEL}
      className={cn(
        'inline-flex max-w-full items-center rounded bg-muted px-1.5 text-[11px] font-normal leading-5 text-muted-foreground select-none whitespace-nowrap',
        className
      )}
    >
      {short ? 'Redacted' : REDACTED_LABEL}
    </span>
  )
}

interface SensitiveProps {
  value: string
  /** Rendered when the value is empty (not redacted, just absent) */
  fallback?: ReactNode
  /** Use the short "Redacted" bar */
  short?: boolean
  className?: string
}

/** Renders `value` as-is unless it is redacted, in which case the grey bar is shown */
export function Sensitive({ value, fallback = '-', short = false, className }: SensitiveProps) {
  if (isRedactedValue(value)) return <Redacted short={short} className={className} />
  if (!value) return <>{fallback}</>
  return <>{value}</>
}
