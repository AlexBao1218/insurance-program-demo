import { useRef, useState, useMemo } from 'react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AlertTriangle, ArrowLeft, Cloud, Copy, FileDown, Info, Loader2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DATA_PERIOD } from '@/lib/data-period'
import { REPORT_FILE_PREFIX, REPORT_TITLE } from '@/lib/brand'
import { FEISHU_DOC_EXPORT_UNAVAILABLE } from '@/api/report'
import type { IClassWithRelations } from '@/data/programme'
import type { PolicyYear } from '@/lib/analytics'
import type { IReportResult } from './ExportReportDialog'
import { matchReportSection } from './report-sections'
import ChartExportCapturer from './ChartExportCapturer'
import type { ChartExportCapturerHandle } from './ChartExportCapturer'

interface ReportPreviewProps {
  result: IReportResult
  classes: IClassWithRelations[]
  year: PolicyYear
  caliber?: string
  onBack: () => void
}

interface ReportBlock {
  title: string
  beforeTable: string
  table: string
  afterTable: string
}


/** Split by H2 sections; within each section, extract the first Markdown table (paragraphs → table → rest) */
function splitMarkdownBlocks(
  markdown: string,
): { intro: string; blocks: ReportBlock[] } {
  const normalized = markdown.replace(/\r\n/g, '\n')
  const parts = normalized.split(/^## /m)
  const intro = parts[0] ?? ''
  const blocks = parts.slice(1).map((part) => {
    const newlineIndex = part.indexOf('\n')
    const title = (
      newlineIndex === -1 ? part : part.slice(0, newlineIndex)
    ).trim()
    const body = newlineIndex === -1 ? '' : part.slice(newlineIndex + 1)
    return splitBlockBody(title, body)
  })
  return { intro, blocks }
}

function splitBlockBody(title: string, body: string): ReportBlock {
  const lines = body.split('\n')
  let start = -1
  let end = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('|')) {
      if (start === -1) start = i
      end = i
    } else if (start !== -1) {
      break
    }
  }
  if (start === -1) {
    return { title, beforeTable: body, table: '', afterTable: '' }
  }
  return {
    title,
    beforeTable: lines.slice(0, start).join('\n'),
    table: lines.slice(start, end + 1).join('\n'),
    afterTable: lines.slice(end + 1).join('\n'),
  }
}

export default function ReportPreview({
  result,
  classes,
  year,
  caliber,
  onBack,
}: ReportPreviewProps) {
  const { intro, blocks } = useMemo(
    () => splitMarkdownBlocks(result.markdown),
    [result.markdown],
  )
  const hasCaliberInMarkdown = useMemo(
    () => /\*\*Policy Year/.test(result.markdown),
    [result.markdown],
  )
  const generatedAt = useMemo(
    () =>
      new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [],
  )

  const [isDownloadingWord, setIsDownloadingWord] = useState(false)
  const chartExportRef = useRef<ChartExportCapturerHandle>(null)
  const [capturerMounted, setCapturerMounted] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.markdown)
      toast.success('Markdown copied to clipboard')
    } catch {
      toast.error('Copy failed, please copy manually')
    }
  }

  const handleDownloadWord = async () => {
    setIsDownloadingWord(true)
    try {
      if (!capturerMounted) {
        setCapturerMounted(true)
        await new Promise<void>((resolve) => setTimeout(resolve, 100))
      }

      let chartScreenshots = new Map<string, string>()
      if (chartExportRef.current) {
        chartScreenshots = await chartExportRef.current.captureAll()
      }

      const { generateDocxBlob } = await import('./export-docx')
      const blob = await generateDocxBlob(result.markdown, chartScreenshots)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${REPORT_FILE_PREFIX}_${new Date().toISOString().slice(0, 10)}.docx`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      toast.error('Failed to generate Word document')
    } finally {
      setIsDownloadingWord(false)
      setCapturerMounted(false)
    }
  }

  /** Feishu cloud-doc export needs the retired backend; explain instead of erroring. */
  const handleSaveToFeishuDocs = () => {
    toast.info(FEISHU_DOC_EXPORT_UNAVAILABLE)
  }

  /** Mobile share: no doc link to share in the demo, so fall back to the report text. */
  const handleShare = async () => {
    toast.info(FEISHU_DOC_EXPORT_UNAVAILABLE)
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: REPORT_TITLE, text: result.markdown })
        return
      } catch (e) {
        if ((e as DOMException)?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(result.markdown)
      toast.success('Report markdown copied to clipboard')
    } catch {
      toast.error('Unable to share at this time')
    }
  }

  return (
    <div id="report-print-root" className="min-w-0 overflow-x-hidden">
      <div className="print:hidden flex flex-wrap items-center gap-2 max-sm:hidden">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5"
          >
            <Copy className="size-4" />
            Copy Markdown
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadWord}
            disabled={isDownloadingWord}
            className="gap-1.5"
          >
            {isDownloadingWord ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            {isDownloadingWord ? 'Downloading…' : 'Download Word'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveToFeishuDocs}
            className="gap-1.5"
          >
            <Cloud className="size-4" />
            Save to Feishu Docs
          </Button>
        </div>
      </div>

      {/* Mobile: sticky top action bar — flush with header */}
      <div className="print:hidden hidden max-sm:flex sticky top-0 z-30 bg-[rgba(251_251_253_0.92)] backdrop-blur-md border-b border-black/5 px-4 py-1.5 min-h-[44px] items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 h-11 min-w-11 px-2.5">
          <ArrowLeft className="size-4" />
          <span className="text-sm">Back</span>
        </Button>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-11 min-w-11 px-2.5" aria-label="Copy">
            <Copy className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare} className="h-11 min-w-11 px-2.5" aria-label="Share">
            <Share2 className="size-4" />
          </Button>
        </div>
      </div>

      {result.mock && (
        <div
          className="print:hidden mt-3 flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
          role="note"
        >
          <Info className="size-4 shrink-0" />
          <span>
            Simulated narrative — in production this report was written by a Feishu Aily skill
            from the same dashboard snapshot. Monetary amounts are withheld in the public demo;
            shares, counts and ratios below are computed from the live data.
          </span>
        </div>
      )}

      {result.failedSections && result.failedSections.length > 0 && (
        <div
          className="print:hidden mt-3 flex items-center gap-2 rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
          role="alert"
        >
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            The following sections failed to generate and have been replaced with placeholders. You can regenerate:
            {result.failedSections.join(', ')}
          </span>
        </div>
      )}

      <div className="mt-4 max-md:p-4 max-sm:mt-0 max-sm:pt-[52px] rounded-xl border bg-card p-6 shadow-sm">
        <article className="prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{intro}</ReactMarkdown>
        </article>

        {caliber && !hasCaliberInMarkdown && (
          <p className="mt-3 text-sm text-muted-foreground">
            {caliber}
          </p>
        )}

        {blocks.map((block, index) => {
          const section = matchReportSection(block.title)
          const Chart = section?.Chart
          return (
            <section
              key={`${block.title}-${index}`}
              className="mt-8 first:mt-8"
            >
              <h2 className="text-lg font-semibold text-foreground">
                {block.title}
              </h2>
              {block.beforeTable.trim().length > 0 && (
                <div className="prose prose-sm mt-3 max-w-none print-avoid-break">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {block.beforeTable}
                  </ReactMarkdown>
                </div>
              )}
              {Chart && (
                <div
                  data-chart-id={section ? section.key.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '') : undefined}
                  className="report-chart mt-4 print-avoid-break"
                >
                  <Chart classes={classes} year={year} />
                </div>
              )}
              {(block.table + '\n' + block.afterTable).trim().length > 0 && (
                <div className="prose prose-sm mt-4 max-w-none print-avoid-break overflow-x-auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {block.table + '\n' + block.afterTable}
                  </ReactMarkdown>
                </div>
              )}
            </section>
          )
        })}

        <footer className="mt-10 border-t pt-4 text-xs text-muted-foreground">
          Report generated on {generatedAt} · {DATA_PERIOD}
        </footer>
      </div>

      {capturerMounted && (
        <ChartExportCapturer
          ref={chartExportRef}
          classes={classes}
          year={year}
        />
      )}
    </div>
  )
}
