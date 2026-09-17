import { memo, useCallback, useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface PieLegendItem {
  /** 图例名称（与扇区系列名一致） */
  name: string
  /** 圆点颜色（与扇区颜色一致） */
  color: string
}

interface PieLegendProps {
  items: PieLegendItem[]
}

/** 图例项之间的间隙（与网格列的 gap-x-4 一致，16px） */
const ITEM_GAP = 16
/** 滑动手势翻页的位移阈值（px） */
const SWIPE_THRESHOLD = 40

/**
 * 单个图例项渲染：色点 + 名称。
 * - measure 模式：隐藏测量行用，名称按上限截断后取自然宽度
 * - display 模式：网格单元格用，名称随格宽自适应收缩并省略号截断（格变窄也不溢出）
 */
function renderLegendItem(
  item: PieLegendItem,
  mode: 'measure' | 'display' = 'display'
): ReactNode {
  return (
    <span
      key={item.name}
      className={cn(
        'items-center gap-1.5 text-xs text-muted-foreground',
        mode === 'measure' ? 'inline-flex whitespace-nowrap' : 'flex min-w-0'
      )}
    >
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: item.color }}
      />
      <span
        className={mode === 'measure' ? 'max-w-[6rem] truncate' : 'min-w-0 flex-1 truncate'}
        title={item.name}
      >
        {item.name}
      </span>
    </span>
  )
}

/**
 * 饼图分页图例（桌面端与移动端统一）：
 * - 每页容量按容器宽度动态计算（隐藏测量行取最宽项），不写死数量
 * - 左右小箭头固定两端，首页左箭头置灰、末页右箭头置灰，触控热区 ≥44px
 * - 箭头下方居中小圆点指示当前页，点击可直达
 * - 翻页带轻量滑动过渡；移动端支持左右滑动手势翻页
 */
function PieLegend({ items }: PieLegendProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const [perPage, setPerPage] = useState(Math.max(1, items.length))
  const [page, setPage] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)

  const pageCount = Math.max(1, Math.ceil(items.length / perPage))
  const safePage = Math.min(page, pageCount - 1)

  /** 按"最宽图例项"计算当前容器宽度能整行容纳的条目数 */
  const recalcPerPage = useCallback(() => {
    const el = containerRef.current
    const meas = measureRef.current
    if (!el || !meas) return
    const widths = Array.from(meas.children).map(
      (child) => (child as HTMLElement).offsetWidth
    )
    const maxItemWidth = widths.length > 0 ? Math.max(...widths) : 0
    if (maxItemWidth <= 0 || el.clientWidth <= 0) return
    // 每页至少 3 个条目；容量不足时名称自适应截断保证不溢出网格列
    const fit = Math.max(
      3,
      Math.floor((el.clientWidth + ITEM_GAP) / (maxItemWidth + ITEM_GAP))
    )
    setPerPage(Math.min(fit, Math.max(1, items.length)))
  }, [items.length])

  useEffect(() => {
    recalcPerPage()
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(recalcPerPage)
    ro.observe(el)
    return () => ro.disconnect()
  }, [recalcPerPage])

  /** 数据源变化时回到第一页 */
  useEffect(() => {
    setPage(0)
  }, [items])

  if (items.length === 0) return null

  const goPrev = () => {
    if (safePage === 0) return
    setDir(-1)
    setPage((p) => Math.max(0, p - 1))
  }

  const goNext = () => {
    if (safePage >= pageCount - 1) return
    setDir(1)
    setPage((p) => Math.min(pageCount - 1, p + 1))
  }

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current
    touchStartX.current = null
    const endX = e.changedTouches[0]?.clientX ?? null
    if (startX === null || endX === null) return
    const dx = endX - startX
    if (dx > SWIPE_THRESHOLD) goPrev()
    else if (dx < -SWIPE_THRESHOLD) goNext()
  }

  const pageItems = items.slice(safePage * perPage, safePage * perPage + perPage)

  /** 箭头基础样式：视觉 28px，before 伪元素向外扩 8px，触控热区 44px */
  const arrowClass =
    'relative flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-35 before:absolute before:-inset-2 before:content-[\'\']'

  return (
    <div className="pt-3">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="图例上一页"
          onClick={goPrev}
          disabled={safePage === 0}
          className={arrowClass}
        >
          <ChevronLeft className="size-4" />
        </button>
        <div
          ref={containerRef}
          className="relative min-w-0 flex-1 touch-pan-y overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* 隐藏测量行：取最宽图例项宽度，不参与展示 */}
          <div
            ref={measureRef}
            aria-hidden
            className="pointer-events-none invisible absolute left-0 top-0 flex flex-nowrap gap-x-4 whitespace-nowrap"
          >
            {items.map((item) => renderLegendItem(item, 'measure'))}
          </div>
          {/* 当前页：等宽网格列，条目间距均匀；翻页轻量滑动过渡 */}
          <motion.div
            key={safePage}
            initial={{ opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div
              className="grid gap-x-4"
              style={{ gridTemplateColumns: `repeat(${perPage}, minmax(0, 1fr))` }}
            >
              {pageItems.map((item) => renderLegendItem(item))}
            </div>
          </motion.div>
        </div>
        <button
          type="button"
          aria-label="图例下一页"
          onClick={goNext}
          disabled={safePage >= pageCount - 1}
          className={arrowClass}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      {/* 页码指示小圆点：仅多页时显示 */}
      {pageCount > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`图例第 ${i + 1} 页`}
              onClick={() => {
                if (i === safePage) return
                setDir(i > safePage ? 1 : -1)
                setPage(i)
              }}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === safePage ? 'w-4 bg-primary' : 'w-1.5 bg-border hover:bg-muted-foreground/40'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(PieLegend)
