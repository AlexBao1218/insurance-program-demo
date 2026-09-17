import { useMemo, memo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import type { CallbackDataParams, TopLevelFormatterParams } from 'echarts/types/dist/shared'
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
import { classNameLookup } from '@/lib/analytics'


interface PremiumByClassChartProps {
  classes: IClassWithRelations[]
  year: PolicyYear
}

/** A slice row rendered as the pie's legend */
interface IClassRow {
  name: string
  amount: number
  color: string
}

function PremiumByClassChart({ classes, year }: PremiumByClassChartProps) {
  const slices = useMemo(() => premiumByClass(classes, year), [classes, year])
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

  // One row per visible slice (Top-N + Others).
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

  // Public demo: slice proportions and shares are shown, absolute HKD amounts are not.
  const chartOption = useMemo<EChartsOption>(() => {
    return {
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: (raw: TopLevelFormatterParams) => {
          const params = (Array.isArray(raw) ? raw[0] : raw) as CallbackDataParams
          return `${displayName(String(params.name))}<br/>Redacted (${params.percent}%)`
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
  }, [rows, displayName])

  if (slices.length === 0) {
    return (
      <div className="flex items-center justify-center h-[360px] text-sm text-muted-foreground">
        No premium data for {year}
      </div>
    )
  }

  return (
    <div className="relative w-[90%] min-w-[270px]">
      <ReactECharts option={chartOption} className="h-[360px] w-full" />
      {/* Donut centre: total premium withheld in the public demo */}
      <div className="pointer-events-none absolute inset-x-0 top-[46%] flex -translate-y-1/2 flex-col items-center gap-1">
        <Redacted short />
        <span className="text-[13px] text-[#6b7280]">Total</span>
      </div>
    </div>
  )
}

export default memo(PremiumByClassChart)
