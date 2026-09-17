import { useMemo, memo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import type { CallbackDataParams, TopLevelFormatterParams } from 'echarts/types/dist/shared'
import { Redacted } from '@/components/Redacted'
import {
  premiumByBroker,
  UNKNOWN_BROKER,
  POLICY_YEARS,
  type PolicyYear,
} from '@/lib/analytics'
import { OTHERS_COLOR, buildRankedColorMap } from '@/lib/chart-colors'
import type { IClassWithRelations } from '@/data/programme'

interface PremiumByBrokerChartProps {
  classes: IClassWithRelations[]
  year: PolicyYear
}

/** A broker row rendered as the pie's legend */
interface IBrokerRow {
  name: string
  amount: number
  color: string
}

function PremiumByBrokerChart({ classes, year }: PremiumByBrokerChartProps) {
  const slices = useMemo(() => premiumByBroker(classes, year), [classes, year])

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

  // One row per broker slice.
  const rows = useMemo<IBrokerRow[]>(() => {
    const pick = (name: string) =>
      name === UNKNOWN_BROKER ? OTHERS_COLOR : (colorMap[name] ?? OTHERS_COLOR)
    return slices.map((s) => ({ name: s.name, amount: s.amount, color: pick(s.name) }))
  }, [slices, colorMap])

  // Public demo: slice proportions and shares are shown, absolute HKD amounts are not.
  const chartOption = useMemo<EChartsOption | null>(() => {
    if (rows.length === 0) return null
    return {
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: (raw: TopLevelFormatterParams) => {
          const params = (Array.isArray(raw) ? raw[0] : raw) as CallbackDataParams
          return `Broker: Redacted (${params.percent}%)`
        },
      },
      legend: { show: false },
      color: rows.map((r) => r.color),
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '46%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: { label: { show: false } },
          data: rows.map((r) => ({ name: r.name, value: r.amount })),
        },
      ],
    }
  }, [rows])

  if (chartOption === null) {
    return (
      <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
        No premium data for {year}
      </div>
    )
  }

  return (
    <div className="relative w-[90%] min-w-[270px]">
      <ReactECharts option={chartOption} className="h-[280px] w-full" />
      {/* Donut centre: total premium withheld in the public demo */}
      <div className="pointer-events-none absolute inset-x-0 top-[46%] flex -translate-y-1/2 flex-col items-center gap-1">
        <Redacted short />
        <span className="text-[13px] text-[#6b7280]">Total</span>
      </div>
    </div>
  )
}

export default memo(PremiumByBrokerChart)
