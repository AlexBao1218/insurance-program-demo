import { useMemo, memo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import type { TopLevelFormatterParams } from 'echarts/types/dist/shared'
import { premiumTrend, POLICY_YEARS } from '@/lib/analytics'
import { CHART_COLORS } from '@/lib/chart-colors'
import type { IClassWithRelations } from '@/data/programme'

interface PremiumTrendChartProps {
  classes: IClassWithRelations[]
}

/** Softer companion tone for the non-core stack segment */
const OTHER_CLASSES_COLOR = '#8FB4E3'

function PremiumTrendChart({ classes }: PremiumTrendChartProps) {
  // Public demo: bar heights keep their proportions, but the y-axis ticks, data
  // labels and tooltip amounts are withheld.
  const { chartOption, hasData } = useMemo(() => {
    const trend = premiumTrend(classes)
    const coreValues = trend.map((t) => t.core)
    const otherValues = trend.map((t) => t.other)
    const anyData = trend.some((t) => t.total > 0)

    const option: EChartsOption = {
      tooltip: {
        trigger: 'axis',
        confine: true,
        formatter: (params: TopLevelFormatterParams) => {
          const list = Array.isArray(params) ? params : [params]
          let html = `<b>${list[0]?.name}</b>`
          for (const p of list) {
            const marker = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:6px;"></span>`
            html += `<br/>${marker}${p.seriesName}: <b>Redacted</b>`
          }
          html += '<br/>Total: <b>Redacted</b>'
          return html
        },
      },
      legend: {
        data: ['Core Classes', 'Other Classes'],
        bottom: 0,
        textStyle: { fontSize: 11 },
        itemGap: 20,
      },
      grid: {
        left: '6%',
        right: '4%',
        bottom: '12%',
        top: '16%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: [...POLICY_YEARS],
        axisLabel: { fontSize: 11 },
      },
      // Same treatment as the claims chart: axis, ticks and gridlines stay so the
      // bars read against a scale; the numeric tick values are withheld.
      yAxis: {
        type: 'value',
        name: 'Annualised Premium',
        nameGap: 14,
        nameTextStyle: { fontSize: 11, color: '#6b7280', align: 'left' as const, padding: [0, 0, 0, -20] },
        axisLabel: { show: false },
        axisTick: { show: true },
        axisLine: { show: true },
        splitLine: { show: true, lineStyle: { type: 'dashed' as const } },
      },
      color: [CHART_COLORS[0], OTHER_CLASSES_COLOR],
      series: [
        {
          name: 'Core Classes',
          type: 'bar',
          stack: 'premium',
          data: coreValues,
          barMaxWidth: 48,
          label: { show: false },
        },
        {
          name: 'Other Classes',
          type: 'bar',
          stack: 'premium',
          data: otherValues,
          barMaxWidth: 48,
          itemStyle: { borderRadius: [3, 3, 0, 0] },
          label: { show: false },
        },
      ],
    }
    return { chartOption: option, hasData: anyData }
  }, [classes])

  if (!hasData) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height: '100%', minHeight: 300 }}>
        No premium data
      </div>
    )
  }

  return <ReactECharts option={chartOption} className="w-full" style={{ height: '100%', minHeight: 300 }} />
}

export default memo(PremiumTrendChart)
