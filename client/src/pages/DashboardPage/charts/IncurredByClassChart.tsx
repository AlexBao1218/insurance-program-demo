import { useMemo, memo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import type { CallbackDataParams } from 'echarts/types/dist/shared'
import { incurredByClass, classNameLookup } from '@/lib/analytics'
import { CHART_COLORS } from '@/lib/chart-colors'
import type { IClassWithRelations } from '@/data/programme'

interface IncurredByClassChartProps {
  classes: IClassWithRelations[]
}

function IncurredByClassChart({ classes }: IncurredByClassChartProps) {
  // Public demo: bar lengths keep their proportions, but the x-axis ticks, data
  // labels and tooltip amounts are withheld.
  const chartOption = useMemo<EChartsOption | null>(() => {
    const slices = incurredByClass(classes)
    const displayName = classNameLookup(classes)
    if (slices.length === 0 || slices.every((s) => s.amount === 0)) return null

    // Horizontal bar: reverse so the largest sits on top
    const ordered = [...slices].reverse()

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        confine: true,
        formatter: (params: CallbackDataParams | CallbackDataParams[]) => {
          const p = Array.isArray(params) ? params[0] : params
          return `${p.name}<br/>Total Incurred: <b>Redacted</b>`
        },
      },
      grid: {
        left: '3%',
        right: '10%',
        bottom: '8%',
        top: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLabel: { show: false },
      },
      yAxis: {
        type: 'category',
        data: ordered.map((s) => displayName(s.name)),
        axisLabel: { fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: ordered.map((s, i) => ({
            value: s.amount,
            itemStyle: {
              color: CHART_COLORS[(ordered.length - 1 - i) % CHART_COLORS.length] as string,
              borderRadius: [0, 3, 3, 0] as [number, number, number, number],
            },
          })),
          barMaxWidth: 32,
          label: { show: false },
        },
      ],
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

export default memo(IncurredByClassChart)
