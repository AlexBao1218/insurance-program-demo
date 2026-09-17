import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsType } from 'echarts'
import type { EChartsOption } from 'echarts'
import type { CallbackDataParams, TopLevelFormatterParams } from 'echarts/types/dist/shared'
import {
  premiumByClass,
  premiumByBroker,
  premiumTrend,
  foldTopN,
  classPremiumInYear,
  UNKNOWN_BROKER,
  POLICY_YEARS,
  type PolicyYear,
} from '@/lib/analytics'
import { OTHERS_COLOR, CHART_COLORS, buildRankedColorMap } from '@/lib/chart-colors'
import type { IClassWithRelations } from '@/data/programme'
import { logger } from '@lark-apaas/client-toolkit/logger'

export interface ChartExportCapturerHandle {
  captureAll: () => Promise<Map<string, string>>
}

interface Props {
  classes: IClassWithRelations[]
  year: PolicyYear
}

const CANVAS_WIDTH = 720
const CANVAS_HEIGHT = 400
const OTHER_CLASSES_COLOR = '#8FB4E3'

/** Pie centre as a fraction of the canvas height (matches `series.center`) */
const PIE_CENTER_Y = 0.46
/** Grey "Redacted" pill drawn in the donut hole, mirroring `<Redacted short />` */
const PILL_WIDTH = 88
const PILL_HEIGHT = 26

/**
 * Public demo: the exported PNGs carry no absolute HKD amounts. The donut hole
 * shows a grey "Redacted" pill instead of the total, and tooltips (never
 * captured, but kept consistent) print "Redacted" next to the share.
 */
function buildPieOption(
  rows: Array<{ name: string; amount: number; color: string }>,
): EChartsOption {
  const centerY = CANVAS_HEIGHT * PIE_CENTER_Y
  return {
    animation: false,
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: (params: TopLevelFormatterParams) => {
        const p = (Array.isArray(params) ? params[0] : params) as CallbackDataParams | undefined
        if (!p) return ''
        return `${p.name}<br/>Redacted (${p.percent}%)`
      },
    },
    legend: { show: false },
    graphic: [
      {
        type: 'group',
        left: 'center',
        top: centerY - PILL_HEIGHT / 2 - 8,
        children: [
          {
            type: 'rect',
            shape: { x: 0, y: 0, width: PILL_WIDTH, height: PILL_HEIGHT, r: 6 },
            style: { fill: '#f1f5f9' },
          },
          {
            type: 'text',
            x: PILL_WIDTH / 2,
            y: PILL_HEIGHT / 2,
            style: {
              text: 'Redacted',
              fontSize: 12,
              align: 'center',
              verticalAlign: 'middle',
              fill: '#64748b',
            },
          },
        ],
      },
      {
        type: 'text',
        left: 'center',
        top: centerY + PILL_HEIGHT / 2 - 2,
        style: {
          text: 'Total',
          fontSize: 13,
          align: 'center',
          fill: '#6b7280',
        },
      },
    ],
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
}

function PremiumByClassExport({
  classes,
  year,
  onReady,
}: Props & { onReady: (inst: EChartsType) => void }) {
  const slices = premiumByClass(classes, year)
  const folded = foldTopN(slices)

  const colorMap = (() => {
    const ranked = classes
      .map((c) => ({
        name: c.classCode,
        total: POLICY_YEARS.reduce((sum, y) => sum + classPremiumInYear(c, y), 0),
      }))
      .sort((a, b) => b.total - a.total)
      .map((x) => x.name)
    return buildRankedColorMap(ranked)
  })()

  const pick = (name: string) =>
    name === 'Others' ? OTHERS_COLOR : (colorMap[name] ?? OTHERS_COLOR)

  const rows: Array<{ name: string; amount: number; color: string }> = folded.top.map((s) => ({
    name: s.name,
    amount: s.amount,
    color: pick(s.name),
  }))
  if (folded.othersTotal > 0) {
    rows.push({ name: 'Others', amount: folded.othersTotal, color: OTHERS_COLOR })
  }

  const option = buildPieOption(rows)

  return (
    <ReactECharts
      option={option}
      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      onChartReady={onReady}
      notMerge
    />
  )
}

function PremiumByBrokerExport({
  classes,
  year,
  onReady,
}: Props & { onReady: (inst: EChartsType) => void }) {
  const slices = premiumByBroker(classes, year)

  const colorMap = (() => {
    const totals = new Map<string, number>()
    for (const y of POLICY_YEARS) {
      for (const s of premiumByBroker(classes, y)) {
        totals.set(s.name, (totals.get(s.name) ?? 0) + s.amount)
      }
    }
    const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n)
    return buildRankedColorMap(ranked)
  })()

  const pick = (name: string) =>
    name === UNKNOWN_BROKER ? OTHERS_COLOR : (colorMap[name] ?? OTHERS_COLOR)

  const rows = slices.map((s) => ({
    name: s.name,
    amount: s.amount,
    color: pick(s.name),
  }))

  const option = buildPieOption(rows)

  return (
    <ReactECharts
      option={option}
      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      onChartReady={onReady}
      notMerge
    />
  )
}

function PremiumTrendExport({
  classes,
  onReady,
}: { classes: IClassWithRelations[]; onReady: (inst: EChartsType) => void }) {
  // Public demo: bar proportions only — no y-axis ticks, data labels or tooltip amounts.
  const trend = premiumTrend(classes)
  const coreValues = trend.map((t) => t.core)
  const otherValues = trend.map((t) => t.other)

  const option: EChartsOption = {
    animation: false,
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
      textStyle: { fontSize: 11, color: '#334155' },
      itemGap: 20,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '16%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: [...POLICY_YEARS],
      axisLabel: { fontSize: 11, color: '#334155' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { show: false },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
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

  return (
    <ReactECharts
      option={option}
      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      onChartReady={onReady}
      notMerge
    />
  )
}

async function isBlankDataUrl(dataUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(true)
        return
      }
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = imageData.data
      let nonWhiteCount = 0
      const step = 20
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const idx = (y * canvas.width + x) * 4
          const r = pixels[idx]!
          const g = pixels[idx + 1]!
          const b = pixels[idx + 2]!
          const a = pixels[idx + 3]!
          if (a < 200) continue
          if (r < 250 || g < 250 || b < 250) {
            nonWhiteCount++
          }
        }
      }
      const totalSamples = Math.ceil(canvas.height / step) * Math.ceil(canvas.width / step)
      const ratio = nonWhiteCount / totalSamples
      resolve(ratio < 0.005)
    }
    img.onerror = () => resolve(true)
    img.src = dataUrl
  })
}

const ChartExportCapturer = forwardRef<ChartExportCapturerHandle, Props>(
  function ChartExportCapturer({ classes, year }, ref) {
    const [mounted, setMounted] = useState(false)
    const byClassRef = useRef<EChartsType | null>(null)
    const byBrokerRef = useRef<EChartsType | null>(null)
    const trendRef = useRef<EChartsType | null>(null)
    const readyCount = useRef(0)
    const allReady = useRef<() => void>(() => {})
    const readyPromise = useRef<Promise<void> | undefined>(undefined)
    if (readyPromise.current === undefined) {
      readyPromise.current = new Promise((resolve) => {
        allReady.current = resolve
      })
    }

    const onReady = useCallback(
      (key: string, inst: EChartsType) => {
        if (key === 'byClass') byClassRef.current = inst
        else if (key === 'byBroker') byBrokerRef.current = inst
        else if (key === 'trend') trendRef.current = inst
        readyCount.current++
        if (readyCount.current >= 3) {
          allReady.current()
        }
      },
      [],
    )

    useImperativeHandle(ref, () => ({
      captureAll: async () => {
        if (!mounted) {
          setMounted(true)
          await new Promise<void>((resolve) => setTimeout(resolve, 150))
        }
        const timeout = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Chart render timeout')), 15000),
        )
        try {
          await Promise.race([readyPromise.current, timeout])
        } catch {
          logger.warn('[docx] chart render timeout, proceeding without charts')
          return new Map()
        }

        const instances: Array<{ id: string; inst: EChartsType | null }> = [
          { id: 'premium-by-class', inst: byClassRef.current },
          { id: 'premium-by-broker', inst: byBrokerRef.current },
          { id: 'premium-trend', inst: trendRef.current },
        ]

        const result = new Map<string, string>()

        for (const { id, inst } of instances) {
          if (!inst) {
            logger.warn(`[docx] chart instance missing, skipped: ${id}`)
            continue
          }
          try {
            const dataUrl = inst.getDataURL({
              type: 'png',
              pixelRatio: 2,
              backgroundColor: '#ffffff',
            })

            const blank = await isBlankDataUrl(dataUrl)
            if (blank) {
              logger.warn(`[docx] chart blank (first attempt), retrying: ${id}`)
              await new Promise((r) => setTimeout(r, 200))
              const retry = inst.getDataURL({
                type: 'png',
                pixelRatio: 2,
                backgroundColor: '#ffffff',
              })
              const retryBlank = await isBlankDataUrl(retry)
              if (retryBlank) {
                logger.warn(`[docx] chart blank, skipped: ${id}`)
                continue
              }
              result.set(id, retry)
            } else {
              result.set(id, dataUrl)
            }
          } catch (e) {
            logger.warn(`[docx] Failed to capture chart ${id}:`, String(e))
          }
        }

        return result
      },
    }))

    if (!mounted) {
      return null
    }

    return (
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: `${CANVAS_WIDTH}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          <PremiumByClassExport
            classes={classes}
            year={year}
            onReady={(inst) => onReady('byClass', inst)}
          />
        </div>
        <div style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          <PremiumByBrokerExport
            classes={classes}
            year={year}
            onReady={(inst) => onReady('byBroker', inst)}
          />
        </div>
        <div style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          <PremiumTrendExport
            classes={classes}
            onReady={(inst) => onReady('trend', inst)}
          />
        </div>
      </div>
    )
  },
)

export default ChartExportCapturer