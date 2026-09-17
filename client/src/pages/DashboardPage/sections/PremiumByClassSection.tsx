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
  premiumByClass,
  foldTopN,
  classPremiumInYear,
  POLICY_YEARS,
  type PolicyYear,
} from '@/lib/analytics'
import { OTHERS_COLOR, buildRankedColorMap } from '@/lib/chart-colors'
import type { IClassWithRelations } from '@/data/programme'
import PremiumByClassChart from '../charts/PremiumByClassChart'
import { classNameLookup } from '@/lib/analytics'


interface PremiumByClassSectionProps {
  classes: IClassWithRelations[]
  year: PolicyYear
}

/** A slice row the table renders as the pie's legend */
interface IClassRow {
  name: string
  amount: number
  color: string
}

function PremiumByClassSection({ classes, year }: PremiumByClassSectionProps) {
  const slices = useMemo(() => premiumByClass(classes, year), [classes, year])
  const total = useMemo(() => slices.reduce((s, d) => s + d.amount, 0), [slices])
  const folded = useMemo(() => foldTopN(slices), [slices])

  // Stable colour binding: rank each class by its TOTAL premium across all policy
  // years, then map rank -> colour. The same class keeps its hue whichever policy
  // year is selected.
  const colorMap = useMemo(() => {
    const ranked = classes
      .map((c) => ({
        name: c.classCode,
        total: POLICY_YEARS.reduce((sum, y) => sum + classPremiumInYear(c, y), 0),
      }))
      .sort((a, b) => b.total - a.total)
      .map((x) => x.name)
    return buildRankedColorMap(ranked)
  }, [classes])

  // The table doubles as the pie legend: one row per visible slice (Top-N + Others).
  // (The chart itself lives in ../charts/PremiumByClassChart.)
  const displayName = useMemo(() => classNameLookup(classes), [classes])

  const rows = useMemo<IClassRow[]>(() => {
    const pick = (name: string) =>
      name === 'Others' ? OTHERS_COLOR : (colorMap[name] ?? OTHERS_COLOR)
    const r: IClassRow[] = folded.top.map((s) => ({
      name: s.name,
      amount: s.amount,
      color: pick(s.name),
    }))
    if (folded.othersTotal > 0) {
      r.push({ name: 'Others', amount: folded.othersTotal, color: OTHERS_COLOR })
    }
    return r
  }, [folded, colorMap])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[15px] font-semibold">Premium by Class</CardTitle>
      </CardHeader>
      <CardContent className="p-7 pt-0">
        {slices.length === 0 ? (
          <div className="flex items-center justify-center h-[360px] text-sm text-muted-foreground">
            No premium data for {year}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/2 min-w-0 flex flex-col items-center justify-center gap-2">
              <PremiumByClassChart classes={classes} year={year} />
              <p className="text-[11px] text-muted-foreground/70 text-center leading-snug">
                Premium allocated pro-rata by month to the policy year
              </p>
            </div>
            <div className="lg:w-1/2 min-w-0 overflow-x-auto self-center">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b] border-b border-black/5">Class</TableHead>
                    <TableHead className="whitespace-nowrap text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b] border-b border-black/5">Premium</TableHead>
                    <TableHead className="whitespace-nowrap text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b] border-b border-black/5">Share %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.name} className="h-[44px] border-b border-black/5 last:border-b-0">
                      <TableCell className={`whitespace-nowrap${r.name === 'Others' ? ' text-[#86868b]' : ''}`}>
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: r.color }}
                          />
                          <span className="font-medium truncate max-w-[15rem]" title={displayName(r.name)}>
                            {displayName(r.name)}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className={`text-[14px] text-right tabular-nums whitespace-nowrap${r.name === 'Others' ? ' text-[#86868b]' : ''}`}>
                        <Redacted short />
                      </TableCell>
                      <TableCell className={`text-[13px] text-right tabular-nums whitespace-nowrap${r.name === 'Others' ? ' text-[#86868b]' : ' text-[#6e6e73]'}`}>
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

export default memo(PremiumByClassSection)
