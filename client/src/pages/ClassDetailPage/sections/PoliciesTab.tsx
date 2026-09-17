import { Fragment, useMemo, useState, type MouseEvent } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Redacted } from '@/components/Redacted'
import { normalizeYear } from '@/lib/analytics'
import { useIsMobile } from '@/hooks/use-mobile'
import InsurerStructure from './InsurerStructure'
import type { IPolicyMaster } from '@/data/programme'

interface PoliciesTabProps {
  policies: IPolicyMaster[]
  /** Summary-only classes keep premium at class level and have no policy rows by design */
  summaryOnly?: boolean
}

/**
 * Public demo: every record-level policy field (policy number, period dates, insurer
 * names, premium, attachments) is withheld. Each withheld cell shows the Redacted bar —
 * including rows whose underlying value is empty — so no cell hints at the real data.
 * Only the policy year and the sub-policy label are shown; the row expansion reveals
 * the (redacted-name) layer / share structure of the year.
 */
export default function PoliciesTab({ policies, summaryOnly = false }: PoliciesTabProps) {
  const isMobile = useIsMobile()
  /** Row whose same-year underwriting structure is expanded; null = all collapsed */
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const emptyText = summaryOnly
    ? 'Summary-only class — premium recorded at class level, no individual policy records'
    : 'No policy data available'

  // Year DESC, one row per policy year
  const sorted = useMemo(
    () =>
      [...policies].sort((a, b) => {
        const byYear = b.policyYear.localeCompare(a.policyYear)
        return byYear !== 0 ? byYear : a.id.localeCompare(b.id)
      }),
    [policies]
  )

  /** Sub Policy column only when the class actually uses sub-policies (Motor / PPL) */
  const showSubPolicy = sorted.some((p) => p.subPolicy.trim() !== '')
  const columnCount = showSubPolicy ? 7 : 6

  /** All rows sharing the normalized policy-year label (the year's full structure) */
  function sameYearRows(target: IPolicyMaster): IPolicyMaster[] {
    if (!target.policyYear.trim()) return [target]
    const key = normalizeYear(target.policyYear)
    return policies.filter((p) => normalizeYear(p.policyYear) === key)
  }

  /** Toggle on row/card click; clicks on links/buttons never toggle */
  function handleRowClick(policy: IPolicyMaster) {
    return (event: MouseEvent<HTMLTableRowElement | HTMLDivElement>) => {
      if ((event.target as Element).closest('a, button')) return
      setExpandedId((prev) => (prev === policy.id ? null : policy.id))
    }
  }

  // Narrow screens: card view (year + premium as the main line; tap to expand the
  // underwriting structure, same interaction as the desktop table)
  if (isMobile) {
    return (
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-md border border-border text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          sorted.map((policy) => {
            const isExpanded = expandedId === policy.id
            return (
              <div
                key={policy.id}
                onClick={handleRowClick(policy)}
                aria-expanded={isExpanded}
                className="cursor-pointer rounded-md border border-border bg-card p-4 shadow-xs"
              >
                {/* Main line: policy year + annualized premium */}
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex min-w-0 items-center gap-1.5 font-medium tabular-nums">
                    {isExpanded ? (
                      <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate">{policy.policyYear || '-'}</span>
                    {policy.subPolicy && (
                      <span className="truncate text-xs font-normal text-muted-foreground">
                        · {policy.subPolicy}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-medium">
                    <Redacted short />
                  </span>
                </div>

                {/* Secondary lines: policy no / period / insurer / attachments */}
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>
                    Policy No: <Redacted short />
                  </p>
                  <p>
                    Period: <Redacted short />
                  </p>
                  <p>
                    Insurer: <Redacted short />
                  </p>
                  <p>
                    Attachments: <Redacted short />
                  </p>
                </div>

                {/* Expanded: underwriting structure of the same policy year */}
                {isExpanded && (
                  <div className="mt-3 border-t border-border/60 pt-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Underwriting structure — {policy.policyYear || 'N/A'}
                    </div>
                    <InsurerStructure
                      rows={sameYearRows(policy)}
                      emptyText={`No insurer information for ${
                        policy.policyYear || 'this year'
                      }`}
                    />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Year</TableHead>
            <TableHead className="whitespace-nowrap min-w-[140px]">Policy No</TableHead>
            {showSubPolicy && (
              <TableHead className="whitespace-nowrap">Sub Policy</TableHead>
            )}
            <TableHead className="whitespace-nowrap">Period</TableHead>
            <TableHead className="whitespace-nowrap">Insurer</TableHead>
            <TableHead className="whitespace-nowrap text-right">
              Premium (Annualized)
            </TableHead>
            <TableHead className="whitespace-nowrap min-w-[160px]">PDF</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="h-32 text-center text-muted-foreground"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((policy) => {
              const isExpanded = expandedId === policy.id
              return (
                <Fragment key={policy.id}>
                  <TableRow
                    onClick={handleRowClick(policy)}
                    aria-expanded={isExpanded}
                    className="cursor-pointer hover:bg-muted/40"
                  >
                    <TableCell className="whitespace-nowrap tabular-nums font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {isExpanded ? (
                          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                        )}
                        {policy.policyYear || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      <Redacted short />
                    </TableCell>
                    {showSubPolicy && (
                      <TableCell className="whitespace-nowrap text-sm">
                        {policy.subPolicy || '-'}
                      </TableCell>
                    )}
                    <TableCell className="whitespace-nowrap text-sm">
                      <Redacted short />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      <Redacted short />
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      <Redacted short />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Redacted short />
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={columnCount} className="py-4">
                        <div className="max-w-xl">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Underwriting structure — {policy.policyYear || 'N/A'}
                          </div>
                          <InsurerStructure
                            rows={sameYearRows(policy)}
                            emptyText={`No insurer information for ${
                              policy.policyYear || 'this year'
                            }`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
