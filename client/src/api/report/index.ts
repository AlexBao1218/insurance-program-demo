/**
 * Client-side stand-in for the report backend.
 *
 * In production `generateReport` POSTed the dashboard snapshot to a NestJS
 * endpoint that called a Feishu Aily skill to write the narrative, and
 * `exportReportToDoc` created a Feishu cloud document. In the standalone demo
 * the narrative comes from a canned template and the data tables are rebuilt
 * from the request payload, so the numbers always match the dashboard.
 */
import type {
  GenerateReportRequest,
  GenerateReportResponse,
  ExportReportToDocRequest,
  ExportReportToDocResponse,
} from '@shared/api.interface'
import { MOCK_REPORT_MARKDOWN } from '@/data/mock-report'
import { REPORT_TITLE } from '@/lib/brand'

const GENERATE_DELAY_MIN_MS = 1500
const GENERATE_DELAY_MAX_MS = 2500

export const FEISHU_DOC_EXPORT_UNAVAILABLE =
  'Export to Feishu Docs is not available in the standalone demo'

/**
 * Every absolute HKD amount in the report is replaced by this literal (public
 * demo policy: shapes, shares and counts are shown, monetary amounts are not).
 */
export const REDACTED_AMOUNT = 'Redacted'

/** Section keys (see `ReportSectionKey`) → H2 title pattern in the template */
const SECTION_PATTERNS: Array<{ key: string; pattern: RegExp }> = [
  { key: 'premiumByClass', pattern: /premium\s+by\s+class/i },
  { key: 'premiumByBroker', pattern: /premium\s+by\s+broker/i },
  { key: 'premiumTrend', pattern: /premium\s+trend/i },
  { key: 'lossRatio', pattern: /loss\s+ratio/i },
  { key: 'claimsOverview', pattern: /claims?/i },
]

interface TemplateSection {
  title: string
  /** Section key when the title matches a selectable section; undefined for always-on sections */
  key?: string
  beforeTable: string
  table: string
  afterTable: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Amount cells never print a number, whatever the payload carries */
const amount = (): string => REDACTED_AMOUNT
const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v))
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const rowsOf = (v: unknown): Record<string, unknown>[] =>
  isRecord(v) && Array.isArray(v.rows) ? v.rows.filter(isRecord) : []

function table(header: string[], rows: string[][]): string {
  const line = (cells: string[]) => `| ${cells.join(' | ')} |`
  return [line(header), line(header.map(() => '---')), ...rows.map(line)].join('\n')
}

/** Split the template into intro + H2 sections, isolating the first Markdown table of each */
function parseTemplate(markdown: string): { intro: string; sections: TemplateSection[] } {
  const parts = markdown.replace(/\r\n/g, '\n').split(/^## /m)
  const intro = parts[0] ?? ''
  const sections = parts.slice(1).map((part) => {
    const nl = part.indexOf('\n')
    const title = (nl === -1 ? part : part.slice(0, nl)).trim()
    const lines = (nl === -1 ? '' : part.slice(nl + 1)).split('\n')
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
    const key = SECTION_PATTERNS.find((s) => s.pattern.test(title))?.key
    if (start === -1) {
      return { title, key, beforeTable: lines.join('\n'), table: '', afterTable: '' }
    }
    return {
      title,
      key,
      beforeTable: lines.slice(0, start).join('\n'),
      table: lines.slice(start, end + 1).join('\n'),
      afterTable: lines.slice(end + 1).join('\n'),
    }
  })
  return { intro, sections }
}

/** Build a section's data table from the dashboard snapshot; null → keep the template table */
function buildTable(section: TemplateSection, data: Record<string, unknown>): string | null {
  if (/executive\s+summary/i.test(section.title)) {
    const kpi = data.kpi
    if (!isRecord(kpi)) return null
    return table(
      ['Metric', 'Value'],
      [
        [`Premium (Policy Year ${str(kpi.current_policy_year)})`, amount()],
        ['Active Premium Items', amount()],
        ['Claims Count (All Years)', amount()],
        ['Open Claims', amount()],
        ['Total Incurred (All Years)', amount()],
      ],
    )
  }

  switch (section.key) {
    case 'premiumByClass': {
      const rows = rowsOf(data.premium_by_class)
      if (rows.length === 0) return null
      return table(
        ['Class', 'Full Name', 'Premium', 'Share (%)'],
        rows.map((r) => [str(r.class_code), str(r.full_name), amount(), str(r.share_pct)]),
      )
    }
    case 'premiumByBroker': {
      const rows = rowsOf(data.premium_by_broker)
      if (rows.length === 0) return null
      return table(
        ['Broker', 'Premium', 'Share (%)'],
        rows.map((r) => [amount(), amount(), str(r.share_pct)]),
      )
    }
    case 'premiumTrend': {
      const rows = rowsOf(data.premium_trend)
      if (rows.length === 0) return null
      return table(
        ['Policy Year', 'Core Classes', 'Other Classes', 'Total'],
        rows.map((r) => [str(r.policy_year), amount(), amount(), amount()]),
      )
    }
    case 'lossRatio': {
      const rows = rowsOf(data.loss_ratio)
      if (rows.length === 0) return null
      return table(
        ['Class', 'Full Name', 'Policy Year', 'Incurred', 'Premium', 'Loss Ratio', 'Status'],
        rows.map((r) => [
          str(r.class_code),
          str(r.full_name),
          str(r.policy_year),
          amount(),
          amount(),
          r.loss_ratio_pct === null || r.loss_ratio_pct === undefined ? 'n/a' : amount(),
          str(r.status ?? 'Settled'),
        ]),
      )
    }
    case 'claimsOverview': {
      const overview = data.claims_overview
      const rows = isRecord(overview) && Array.isArray(overview.ledger_classes)
        ? overview.ledger_classes.filter(isRecord)
        : []
      if (rows.length === 0) return null
      return table(
        ['Class', 'Full Name', 'Claims Count', 'Open Claims', 'Total Incurred'],
        rows.map((r) => [
          str(r.class_code),
          str(r.full_name),
          amount(),
          amount(),
          amount(),
        ]),
      )
    }
    default:
      return null
  }
}

function renderSection(section: TemplateSection, data: Record<string, unknown>): string {
  const body = [section.beforeTable.trim(), buildTable(section, data) ?? section.table, section.afterTable.trim()]
    .filter((s) => s.length > 0)
    .join('\n\n')
  return `## ${section.title}\n\n${body}`
}

/**
 * Simulated report generation: resolves after a short delay with a Markdown report
 * assembled from the canned narrative and the request's data snapshot. Only the
 * sections selected in `request.sections` are included (plus the always-on
 * Executive Summary and Data Notes).
 */
export async function generateReport(
  request: GenerateReportRequest,
): Promise<GenerateReportResponse> {
  await sleep(GENERATE_DELAY_MIN_MS + Math.random() * (GENERATE_DELAY_MAX_MS - GENERATE_DELAY_MIN_MS))

  const data = isRecord(request.report_data) ? request.report_data : {}
  const selected = new Set(request.sections ?? [])
  const { intro, sections } = parseTemplate(MOCK_REPORT_MARKDOWN)

  const header: string[] = [`# ${REPORT_TITLE}`]
  if (request.report_caliber) header.push(`**${request.report_caliber}**`)
  const introBody = intro.replace(/^#\s.*$/m, '').trim()
  if (introBody) header.push(introBody)
  const notes = request.notes?.trim()
  if (notes) header.push(`> **Notes:** ${notes.replace(/\n+/g, ' ')}`)

  const chosen = sections.filter((s) => s.key === undefined || selected.has(s.key))
  const body = chosen.map((s) => renderSection(s, data))

  const dataPeriod = str(data.data_period)
  let markdown = [...header, ...body].join('\n\n') + '\n'
  if (dataPeriod && !markdown.includes(dataPeriod)) {
    markdown = markdown.replace(/(## Data Notes\n\n)/, `$1- ${dataPeriod}.\n`)
  }

  return { report_markdown: markdown, mock: true }
}

/** Feishu cloud-doc export is a backend feature and is unavailable in the standalone demo. */
export async function exportReportToDoc(
  _request: ExportReportToDocRequest,
): Promise<ExportReportToDocResponse> {
  throw new Error(FEISHU_DOC_EXPORT_UNAVAILABLE)
}
