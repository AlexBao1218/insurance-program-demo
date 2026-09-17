import { useState, useMemo } from 'react'
import { FileSearch } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Redacted } from '@/components/Redacted'
import type { IClassWithRelations, IClaimRecord } from '@/data/programme'
import ClaimDetailDialog from './ClaimDetailDialog'

interface ClaimsTabProps {
  cls: IClassWithRelations
}

/** Ledger class kind — decides which claim columns/fields are shown */
export type LedgerKind = 'PPL' | 'Motor' | 'EC' | 'Other'

export function ledgerKind(classCode: string): LedgerKind {
  if (classCode === 'PPL') return 'PPL'
  if (classCode === 'Motor') return 'Motor'
  if (classCode === 'EC') return 'EC'
  return 'Other'
}

/**
 * Class-specific extra columns, inserted between Claimant and Total Incurred.
 * Public demo: every one of these (loss location, case values, reserves, excess
 * recovered) is withheld, so the column header is the only thing that varies.
 */
interface IExtraColumn {
  key: string
  label: string
  align: 'left' | 'right'
}

function extraColumns(kind: LedgerKind): IExtraColumn[] {
  switch (kind) {
    case 'PPL':
      return [
        { key: 'lossLocation', label: 'Loss Location', align: 'left' },
        { key: 'caseValueInd', label: 'Case Value (Ind)', align: 'right' },
        { key: 'excessRecovered', label: 'Excess Recovered', align: 'right' },
      ]
    case 'Motor':
      return [
        { key: 'lossLocation', label: 'Loss Location', align: 'left' },
        { key: 'excessRecovered', label: 'Excess Recovered', align: 'right' },
      ]
    case 'EC':
      return [
        { key: 'reserveInd', label: 'Reserve (Ind)', align: 'right' },
        { key: 'reserveExp', label: 'Reserve (Exp)', align: 'right' },
      ]
    default:
      return []
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={
        status === 'Open'
          ? 'bg-warning/15 text-warning border-warning/20 hover:bg-warning/20'
          : 'bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80'
      }
    >
      {status || '-'}
    </Badge>
  )
}

/**
 * Claims ledger. Public demo: claim numbers, dates of loss, claimants, locations and
 * every monetary field are withheld — each such cell shows the Redacted bar. Policy
 * year and status stay, and are the only filters offered (the keyword search of the
 * production page has nothing to search once identities are withheld).
 */
export default function ClaimsTab({ cls }: ClaimsTabProps) {
  const [yearFilter, setYearFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedClaim, setSelectedClaim] = useState<IClaimRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const kind = ledgerKind(cls.classCode)
  const extras = useMemo(() => extraColumns(kind), [kind])
  const claims = cls.claims

  const availableYears = useMemo(() => {
    const years = new Set<string>()
    for (const c of claims) {
      if (c.policyYear) years.add(c.policyYear)
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a))
  }, [claims])

  const filtered = useMemo(
    () =>
      claims.filter((c) => {
        if (yearFilter !== 'all' && c.policyYear !== yearFilter) return false
        if (statusFilter !== 'all' && c.status !== statusFilter) return false
        return true
      }),
    [claims, yearFilter, statusFilter]
  )

  if (!cls.hasClaimsLedger) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border/40 bg-muted/30 px-6 py-16">
        <FileSearch className="size-10 text-muted-foreground/50 mb-4" />
        <h2 className="text-base font-semibold text-foreground mb-1">
          No claims ledger for this class
        </h2>
        <p className="text-sm text-muted-foreground text-center">
          Claims ledgers are maintained for PPL, EC and Motor only
        </p>
      </div>
    )
  }

  const columnCount = 6 + extras.length

  const handleRowClick = (claim: IClaimRecord) => {
    setSelectedClaim(claim)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Filter toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground shrink-0">Year:</span>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground shrink-0">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims table */}
      <div className="w-full overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap min-w-[130px]">Claim No</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap">Policy Year</TableHead>
              <TableHead className="whitespace-nowrap">DOL</TableHead>
              <TableHead className="whitespace-nowrap min-w-[140px]">Claimant</TableHead>
              {extras.map((col) => (
                <TableHead
                  key={col.key}
                  className={`whitespace-nowrap ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="whitespace-nowrap text-right">
                Total Incurred
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-32 text-center text-muted-foreground"
                >
                  No claims match the current filters
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((claim) => (
                <TableRow
                  key={claim.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => handleRowClick(claim)}
                >
                  <TableCell className="whitespace-nowrap font-medium">
                    <Redacted short />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={claim.status} />
                  </TableCell>
                  <TableCell className="text-sm tabular-nums whitespace-nowrap">
                    {claim.policyYear || '-'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    <Redacted short />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    <Redacted short />
                  </TableCell>
                  {extras.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`whitespace-nowrap text-sm ${
                        col.align === 'right' ? 'text-right' : ''
                      }`}
                    >
                      <Redacted short />
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    <Redacted short />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {filtered.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell
                  colSpan={columnCount - 1}
                  className="text-right text-sm font-semibold text-muted-foreground"
                >
                  Filtered Totals
                </TableCell>
                <TableCell className="text-right font-bold whitespace-nowrap">
                  <Redacted short />
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <ClaimDetailDialog
        claim={selectedClaim}
        kind={kind}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
