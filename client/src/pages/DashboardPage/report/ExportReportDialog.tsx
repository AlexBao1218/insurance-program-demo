import { useState } from 'react'
import { toast } from 'sonner'
import { FileDown, Loader2 } from 'lucide-react'
import type { ReportSectionKey } from '@shared/api.interface'
import { generateReport } from '@/api/report'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import type { IClassWithRelations } from '@/data/programme'
import {
  POLICY_YEARS,
  CURRENT_YEAR,
  type PolicyYear,
} from '@/lib/analytics'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { buildReportPayload } from './build-report-data'
import { ALL_SECTION_KEYS } from './report-sections'
import ExportReportForm from './ExportReportForm'

export interface IReportResult {
  markdown: string
  mock: boolean
  failedSections?: string[]
  caliber?: string
}

interface ExportReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classes: IClassWithRelations[]
  onGenerated: (result: IReportResult) => void
}

function extractErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const e = error as {
      response?: { data?: { message?: string } }
      message?: string
    }
    return e.response?.data?.message ?? e.message ?? 'Unknown error'
  }
  return String(error)
}

export default function ExportReportDialog({
  open,
  onOpenChange,
  classes,
  onGenerated,
}: ExportReportDialogProps) {
  const isMobile = useMediaQuery('(max-width: 639px)')

  const [selectedKeys, setSelectedKeys] =
    useState<ReportSectionKey[]>(ALL_SECTION_KEYS)
  const [notes, setNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [snapshotYear, setSnapshotYear] =
    useState<PolicyYear>(CURRENT_YEAR)
  const [trendStartYear, setTrendStartYear] =
    useState<PolicyYear>(POLICY_YEARS[0])
  const [trendEndYear, setTrendEndYear] =
    useState<PolicyYear>(POLICY_YEARS[POLICY_YEARS.length - 1])

  const toggleSection = (key: ReportSectionKey, checked: boolean) => {
    setSelectedKeys((prev) =>
      ALL_SECTION_KEYS.filter((k) => (k === key ? checked : prev.includes(k))),
    )
  }

  const handleTrendStartChange = (v: string) => {
    const newStart = v as PolicyYear
    const newStartIdx = POLICY_YEARS.indexOf(newStart)
    const endIdx = POLICY_YEARS.indexOf(trendEndYear)
    setTrendStartYear(newStart)
    if (newStartIdx > endIdx) {
      setTrendEndYear(newStart)
    }
  }

  const handleTrendEndChange = (v: string) => {
    const newEnd = v as PolicyYear
    const startIdx = POLICY_YEARS.indexOf(trendStartYear)
    const newEndIdx = POLICY_YEARS.indexOf(newEnd)
    setTrendEndYear(newEnd)
    if (newEndIdx < startIdx) {
      setTrendStartYear(newEnd)
    }
  }

  const handleGenerate = async () => {
    if (selectedKeys.length === 0) return
    setGenerating(true)
    try {
      const payload = buildReportPayload(
        selectedKeys,
        classes,
        snapshotYear,
        trendStartYear,
        trendEndYear,
        notes.trim(),
      )
      const response = await generateReport(payload)
      onGenerated({
        markdown: response.report_markdown,
        mock: response.mock,
        failedSections: response.failed_sections,
        caliber: payload.report_caliber,
      })
      if (response.failed_sections && response.failed_sections.length > 0) {
        toast.warning(
          'Some sections failed: ' + response.failed_sections.join(', '),
        )
      }
    } catch (error) {
      toast.error('Report generation failed: ' + extractErrorMessage(error))
    } finally {
      setGenerating(false)
    }
  }

  const body = (
    <ExportReportForm
      selectedKeys={selectedKeys}
      toggleSection={toggleSection}
      snapshotYear={snapshotYear}
      setSnapshotYear={setSnapshotYear}
      trendStartYear={trendStartYear}
      handleTrendStartChange={handleTrendStartChange}
      trendEndYear={trendEndYear}
      handleTrendEndChange={handleTrendEndChange}
      notes={notes}
      setNotes={setNotes}
      generating={generating}
    />
  )

  if (isMobile) {
    return (
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!generating) onOpenChange(next)
        }}
      >
        <SheetContent
          side="bottom"
          className="flex h-[100dvh] max-h-[100dvh] w-screen flex-col gap-0 rounded-none border-0 p-0 [&>button]:hidden"
        >
          <div className="flex shrink-0 items-center justify-between border-b px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
            <div>
              <SheetTitle className="text-base">Export Report</SheetTitle>
            </div>
            <SheetClose className="h-11 w-11 shrink-0" />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {body}
          </div>

          <div className="shrink-0 space-y-2 border-t px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <Button
              onClick={handleGenerate}
              disabled={generating || selectedKeys.length === 0}
              className="h-11 w-full gap-1.5"
            >
              {generating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileDown className="size-4" />
              )}
              {generating ? 'Generating…' : 'Generate Report'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={generating}
              className="h-11 w-full"
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!generating) onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>
            Select the sections to include in the generated report.
            <span className="mt-1 block text-xs text-muted-foreground/70">
              Narrative is simulated in this demo; amounts are withheld, other figures come from the dashboard data.
            </span>
          </DialogDescription>
        </DialogHeader>

        {body}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || selectedKeys.length === 0}
            className="gap-1.5"
          >
            {generating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            {generating ? 'Generating…' : 'Generate Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}