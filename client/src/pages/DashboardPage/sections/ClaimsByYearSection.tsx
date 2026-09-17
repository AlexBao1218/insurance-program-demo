import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { IClassWithRelations } from '@/data/programme'
import ClaimsByYearChart from '../charts/ClaimsByYearChart'

interface ClaimsByYearSectionProps {
  classes: IClassWithRelations[]
}

function ClaimsByYearSection({ classes }: ClaimsByYearSectionProps) {
  // The chart itself (option + empty state) lives in ../charts/ClaimsByYearChart.
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[15px] font-semibold">
          Claims Count by Policy Year
        </CardTitle>
      </CardHeader>
      <CardContent className="p-7 pt-0">
        <ClaimsByYearChart classes={classes} />
      </CardContent>
    </Card>
  )
}

export default memo(ClaimsByYearSection)
