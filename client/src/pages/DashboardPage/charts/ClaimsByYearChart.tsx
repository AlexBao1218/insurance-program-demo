import { useMemo, memo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { claimsCountByYear, classNameLookup } from '@/lib/analytics'
import { CHART_COLORS } from '@/lib/chart-colors'
import type { IClassWithRelations } from '@/data/programme'

interface ClaimsByYearChartProps {
  classes: IClassWithRelations[]
}

function ClaimsByYearChart({ classes }: ClaimsByYearChartProps) {
  const chartOption = useMemo<EChartsOption | null>(() => {
    const { years, series } = claimsCountByYear(classes)
    const displayName = classNameLookup(classes)
    if (years.length === 0 || series.length === 0) return null


    return {
      // Public demo: bar proportions only — no numeric tick values, no counts
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        confine: true,
        formatter: () => 'Claims count: <b>Redacted</b>',
      },
      legend: {
        data: series.map((s) => displayName(s.classCode)),
        bottom: 0,
        textStyle: { fontSize: 11 },
        itemGap: 20,
      },
      grid: {
        left: '6%',
        right: '6%',
        bottom: '12%',
        top: '16%',
        containLabel: true,
      },
      // Axes, ticks and the policy-year categories stay; only the numeric
      // tick values and per-bar counts are withheld.
      xAxis: {
        type: 'category',
        data: years,
        axisLabel: { fontSize: 11 },
        axisTick: { show: true, alignWithLabel: true },
        axisLine: { show: true },
      },
      yAxis: {
        type: 'value',
        name: 'Claims Count',
        nameGap: 14,
        nameTextStyle: { fontSize: 11, color: '#6b7280', align: 'left' as const, padding: [0, 0, 0, -20] },
        minInterval: 1,
        axisLabel: { show: false },
        axisTick: { show: true },
        axisLine: { show: true },
        splitLine: { show: true, lineStyle: { type: 'dashed' as const } },
      },
      color: series.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] as string),
      series: series.map((s, i) => ({
        name: displayName(s.classCode),
        type: 'bar' as const,
        stack: 'claims',
        data: s.counts,
        barMaxWidth: 36,
        label: { show: false },
        ...(i === series.length - 1
          ? { itemStyle: { borderRadius: [3, 3, 0, 0] as [number, number, number, number] } }
          : {}),
      })),
    }
  }, [classes])

  if (chartOption === null) {
    return (
      <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
        No claims data
      </div>
    )
  }

  return <ReactECharts option={chartOption} className="h-[300px] w-full" />
}

export default memo(ClaimsByYearChart)
