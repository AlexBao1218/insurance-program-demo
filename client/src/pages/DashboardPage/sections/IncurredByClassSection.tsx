import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { IClassWithRelations } from '@/data/programme'
import IncurredByClassChart from '../charts/IncurredByClassChart'

interface IncurredByClassSectionProps {
  classes: IClassWithRelations[]
}

function IncurredByClassSection({ classes }: IncurredByClassSectionProps) {
  // The chart itself (option + empty state) lives in ../charts/IncurredByClassChart.
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[15px] font-semibold">
          Total Incurred by Class
        </CardTitle>
      </CardHeader>
      <CardContent className="p-7 pt-0">
        <IncurredByClassChart classes={classes} />
      </CardContent>
    </Card>
  )
}

export default memo(IncurredByClassSection)
