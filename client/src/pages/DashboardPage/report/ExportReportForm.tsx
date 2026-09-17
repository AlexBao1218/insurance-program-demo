import { Loader2 } from 'lucide-react'
import type { ReportSectionKey } from '@shared/api.interface'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { IClassWithRelations } from '@/data/programme'
import {
  POLICY_YEARS,
  type PolicyYear,
} from '@/lib/analytics'
import { ALL_SECTION_KEYS, REPORT_SECTION_OPTIONS } from './report-sections'

interface ExportReportFormProps {
  selectedKeys: ReportSectionKey[]
  toggleSection: (key: ReportSectionKey, checked: boolean) => void
  snapshotYear: PolicyYear
  setSnapshotYear: (v: PolicyYear) => void
  trendStartYear: PolicyYear
  handleTrendStartChange: (v: string) => void
  trendEndYear: PolicyYear
  handleTrendEndChange: (v: string) => void
  notes: string
  setNotes: (v: string) => void
  generating: boolean
}

export default function ExportReportForm({
  selectedKeys,
  toggleSection,
  snapshotYear,
  setSnapshotYear,
  trendStartYear,
  handleTrendStartChange,
  trendEndYear,
  handleTrendEndChange,
  notes,
  setNotes,
  generating,
}: ExportReportFormProps) {
  return (
    <div className="space-y-4">
      {/* Report Year */}
      <div className="space-y-1.5">
        <label htmlFor="report-year" className="text-sm font-medium">
          Report Year
        </label>
        <Select
          value={snapshotYear}
          onValueChange={(v) => setSnapshotYear(v as PolicyYear)}
          disabled={generating}
        >
          <SelectTrigger id="report-year" className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POLICY_YEARS.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Trend Range */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Trend Range</label>
        <div className="flex items-center gap-2">
          <Select
            value={trendStartYear}
            onValueChange={handleTrendStartChange}
            disabled={generating}
          >
            <SelectTrigger className="h-9 min-w-0 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POLICY_YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="shrink-0 text-muted-foreground">–</span>
          <Select
            value={trendEndYear}
            onValueChange={handleTrendEndChange}
            disabled={generating}
          >
            <SelectTrigger className="h-9 min-w-0 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POLICY_YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2.5">
        {REPORT_SECTION_OPTIONS.map((option) => (
          <label
            key={option.key}
            className="flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors"
          >
            <Checkbox
              checked={selectedKeys.includes(option.key)}
              onCheckedChange={(v) =>
                toggleSection(option.key, v === true)
              }
              disabled={generating}
            />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
      </div>

      <div className="space-y-3">
        <label htmlFor="report-notes" className="text-sm font-medium">
          Additional Notes
        </label>
        <Textarea
          id="report-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything you want the report to highlight"
          rows={3}
          disabled={generating}
        />
      </div>

      {generating && (
        <div className="flex items-start gap-2 rounded-md bg-accent/60 px-3 py-2.5 text-xs text-muted-foreground">
          <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin" />
          <span>
            Generating report — the narrative is simulated in this demo, so this
            only takes a couple of seconds.
          </span>
        </div>
      )}
    </div>
  )
}