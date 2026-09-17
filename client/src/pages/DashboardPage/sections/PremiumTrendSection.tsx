import { useMemo, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { premiumTrend } from '@/lib/analytics'
import type { IClassWithRelations } from '@/data/programme'
import PremiumTrendChart from '../charts/PremiumTrendChart'

interface PremiumTrendSectionProps {
  classes: IClassWithRelations[]
}

function PremiumTrendSection({ classes }: PremiumTrendSectionProps) {
  // The chart itself (option + empty state) lives in ../charts/PremiumTrendChart.
  // hasData is recomputed here only to decide whether the footnote applies.
  const hasData = useMemo(
    () => premiumTrend(classes).some((t) => t.total > 0),
    [classes]
  )

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-[15px] font-semibold">
          Premium Trend by Policy Year
        </CardTitle>
      </CardHeader>
      <CardContent className="p-7 pt-0 flex-1 flex flex-col">
        <div className="flex-1 min-h-0">
          <PremiumTrendChart classes={classes} />
        </div>
        {hasData && (
          <p className="text-xs text-muted-foreground mt-2">
            Annualized premium allocated pro-rata by month
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default memo(PremiumTrendSection)
