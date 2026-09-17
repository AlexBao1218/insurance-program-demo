import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { parseInsurerEntries } from '@/lib/insurer-text'
import { Redacted, isRedactedValue } from '@/components/Redacted'
import type { IPolicyMaster } from '@/data/programme'

interface InsurerStructureProps {
  /** Policy rows merged into one structure (e.g. all rows of a policy year) */
  rows: IPolicyMaster[]
  /** Text shown when no insurer entry parses from the given rows */
  emptyText?: string
}

interface ILayerEntry {
  name: string
  share: number | null
  /** Marked '(Lead)' / '(Lead Insurer)' in any of the source texts */
  isLead: boolean
}

/** Layer label → entries, insertion order preserved */
type ILayerGroups = Array<[string, ILayerEntry[]]>

function normalizeNameKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Group the insurer entries by layer. Layer info prefers the policy row's
 * Sub_Policy field; the 'Layer:' colon prefix inside the Insurer text is the
 * fallback. Same-name duplicates inside one layer are merged — except redacted
 * names, which are kept as separate entries so the share split stays visible.
 */
function buildLayerGroups(rows: IPolicyMaster[]): ILayerGroups {
  const map = new Map<string, ILayerEntry[]>()
  for (const row of rows) {
    for (const entry of parseInsurerEntries(row.insurer)) {
      const label = row.subPolicy.trim() || entry.lineLayer
      const group = map.get(label) ?? []
      const key = normalizeNameKey(entry.name)
      const existing = isRedactedValue(entry.name)
        ? undefined
        : group.find((e) => normalizeNameKey(e.name) === key)
      if (existing) {
        // Merge: keep first share seen; OR the lead mark across duplicates
        if (existing.share == null && entry.share != null) existing.share = entry.share
        existing.isLead = existing.isLead || entry.isLead
      } else {
        group.push({
          name: entry.name,
          share: entry.share,
          isLead: entry.isLead,
        })
      }
      map.set(label, group)
    }
  }
  return Array.from(map.entries())
}

/** Format a share total: integers without decimals, otherwise one decimal */
function formatShareTotal(total: number): string {
  return Number.isInteger(total) ? `${total}%` : `${total.toFixed(1)}%`
}

/**
 * Shared underwriting-structure renderer: layer groups with per-insurer share,
 * Lead badge and the 100% total check row. Used by the page-level InsurerPanel
 * and by the PoliciesTab row expansion.
 */
export default function InsurerStructure({ rows, emptyText }: InsurerStructureProps) {
  const groups = useMemo(() => buildLayerGroups(rows), [rows])

  const allEntries = groups.flatMap(([, entries]) => entries)

  if (allEntries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {emptyText ?? 'No insurer information'}
      </p>
    )
  }

  if (groups.length === 1 && allEntries.length === 1) {
    // Single-insurer class: one-line name only, no layer hierarchy
    const only = allEntries[0]
    return (
      <p className="text-sm font-medium text-foreground">
        {isRedactedValue(only.name) ? <Redacted /> : only.name}
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {groups.map(([label, entries]) => {
        const withShares = entries.filter((e) => e.share != null)
        const total = withShares.reduce((sum, e) => sum + (e.share ?? 0), 0)
        // Hide the heading when the only group has no layer info at all
        const showHeading = label !== '' || groups.length > 1
        return (
          <div key={label || '__direct'}>
            {showHeading && (
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label || 'Direct'}
              </div>
            )}
            <ul className="divide-y divide-border/60 rounded-md border border-border/60">
              {entries.map((entry, idx) => (
                <li
                  key={`${normalizeNameKey(entry.name)}-${idx}`}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <span className="flex min-w-0 items-center truncate text-sm text-foreground">
                    {isRedactedValue(entry.name) ? <Redacted /> : entry.name}
                    {entry.isLead && (
                      <Badge
                        variant="secondary"
                        className="ml-1.5 px-1.5 py-0 text-[10px] font-medium leading-4"
                      >
                        Lead
                      </Badge>
                    )}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {entry.share != null ? <Redacted short /> : ''}
                  </span>
                </li>
              ))}
              {withShares.length > 0 && (
                <li className="flex items-center justify-between gap-3 bg-muted/50 px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Total
                  </span>
                  <span
                    className={`shrink-0 text-xs font-semibold tabular-nums ${
                      Math.abs(total - 100) < 0.01
                        ? 'text-success'
                        : 'text-warning'
                    }`}
                  >
                    {formatShareTotal(total)}
                  </span>
                </li>
              )}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
