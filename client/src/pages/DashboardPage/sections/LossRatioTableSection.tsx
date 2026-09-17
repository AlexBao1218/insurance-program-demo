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
import { lossRatioMatrix, POLICY_YEARS, classNameLookup } from '@/lib/analytics'
import type { IClassWithRelations } from '@/data/programme'

interface LossRatioTableSectionProps {
  classes: IClassWithRelations[]
}

function LossRatioTableSection({ classes }: LossRatioTableSectionProps) {
  const rows = useMemo(() => lossRatioMatrix(classes), [classes])
  const displayName = useMemo(() => classNameLookup(classes), [classes])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[15px] font-semibold">
          Loss Ratio by Class & Policy Year
        </CardTitle>
      </CardHeader>
      <CardContent className="p-7 pt-0">
        {rows.length === 0 ? (
          <div className="flex items-center justify-center h-[120px] text-sm text-muted-foreground">
            No claims ledger data
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b] border-b border-black/5">Class</TableHead>
                    {POLICY_YEARS.map((year) => (
                      <TableHead key={year} className="whitespace-nowrap text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#86868b] border-b border-black/5">
                        {year}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.classCode} className="h-[44px] border-b border-black/5 last:border-b-0">
                      <TableCell className="font-medium whitespace-nowrap">
                        {displayName(row.classCode)}
                      </TableCell>
                      {row.cells.map((cell) => (
                        <TableCell
                          key={cell.year}
                          className="text-[13px] text-right whitespace-nowrap"
                        >
                          {cell.ratio === null ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <Redacted short />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Values withheld in the public demo. Loss ratio = Total Incurred ÷ Annualized Premium (allocated pro-rata by month); cells are colour-coded above 60% and 100%.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default memo(LossRatioTableSection)
