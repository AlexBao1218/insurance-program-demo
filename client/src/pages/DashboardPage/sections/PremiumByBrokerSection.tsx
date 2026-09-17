import { useMemo, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Redacted } from '@/components/Redacted'
import {
  premiumByBroker,
  UNKNOWN_BROKER,
  POLICY_YEARS,
  type PolicyYear,
} from '@/lib/analytics'
import { OTHERS_COLOR, buildRankedColorMap } from '@/lib/chart-colors'
import type { IClassWithRelations } from '@/data/programme'
import PremiumByBrokerChart from '../charts/PremiumByBrokerChart'

interface PremiumByBrokerSectionProps {
  classes: IClassWithRelations[]
  year: PolicyYear
}

/** A broker row the table renders as the pie's legend */
interface IBrokerRow {
  name: string
  amount: number
  color: string
}

function PremiumByBrokerSection({ classes, year }: PremiumByBrokerSectionProps) {
  const slices = useMemo(() => premiumByBroker(classes, year), [classes, year])
  const total = useMemo(() => slices.reduce((s, d) => s + d.amount, 0), [slices])

  // Stable colour binding by total premium rank across all years (same rule as the
  // class chart), so a broker keeps its hue whichever policy year is selected.
  const colorMap = useMemo(() => {
    const totals = new Map<string, number>()
    for (const y of POLICY_YEARS) {
      for (const s of premiumByBroker(classes, y)) {
        totals.set(s.name, (totals.get(s.name) ?? 0) + s.amount)
      }
    }
    const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n)
    return buildRankedColorMap(ranked)
  }, [classes])

  // The table doubles as the pie legend: one row per broker slice.
  // (The chart itself lives in ../charts/PremiumByBrokerChart.)
  const rows = useMemo<IBrokerRow[]>(() => {
    const pick = (name: string) =>
      name === UNKNOWN_BROKER ? OTHERS_COLOR : (colorMap[name] ?? OTHERS_COLOR)
    return slices.map((s) => ({ name: s.name, amount: s.amount, color: pick(s.name) }))
  }, [slices, colorMap])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[15px] font-semibold">Premium by Broker</CardTitle>
      </CardHeader>
      <CardContent className="p-7 pt-0">
        {rows.length === 0 ? (
          <div className="flex items-center justify-center h-[360px] text-sm text-muted-foreground">
            No premium data for {year}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2">
              <PremiumByBrokerChart classes={classes} year={year} />
              <p className="text-[11px] text-muted-foreground/70 text-center leading-snug">
                Premium allocated pro-rata by month to the policy year
              </p>
            </div>
            <div className="min-w-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b] border-b border-black/5">Broker</TableHead>
                    <TableHead className="whitespace-nowrap text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b] border-b border-black/5">Premium</TableHead>
                    <TableHead className="whitespace-nowrap text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b] border-b border-black/5">Share %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.name} className="h-[44px] border-b border-black/5 last:border-b-0">
                      <TableCell className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: r.color }}
                          />
                          <Redacted short />
                        </span>
                      </TableCell>
                      <TableCell className="text-[14px] text-right tabular-nums whitespace-nowrap">
                        <Redacted short />
                      </TableCell>
                      <TableCell className="text-[13px] text-right tabular-nums whitespace-nowrap text-[#6e6e73]">
                        {total > 0 ? ((r.amount / total) * 100).toFixed(1) : '0.0'}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default memo(PremiumByBrokerSection)
