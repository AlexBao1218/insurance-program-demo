import type {
  GenerateReportRequest,
  ReportSectionKey,
} from '@shared/api.interface'
import type { IClassWithRelations } from '@/data/programme'
import { REDACTED_AMOUNT } from '@/api/report'
import { DATA_PERIOD } from '@/lib/data-period'
import {
  POLICY_YEARS,
  claimsCountByYear,
  foldTopN,
  kpiSummary,
  lossRatioMatrix,
  premiumByBroker,
  premiumByClass,
  premiumTrend,
  type PolicyYear,
} from '@/lib/analytics'

const PRO_RATA_NOTE = 'Premium allocated pro-rata by month to the policy year'

/**
 * 组装报告输入：只取 Dashboard 当前渲染状态已算好的数据（不重新查询 Base）。
 * 每行凡带险种代码的必须同时带 full_name，防止报告模型把缩写编造成错误全称。
 *
 * Public demo: absolute HKD amounts never enter the payload — every `*_hkd`
 * field carries the REDACTED_AMOUNT literal. Shares, counts and ratios are real.
 */
export function buildReportPayload(
  sectionKeys: ReportSectionKey[],
  classes: IClassWithRelations[],
  snapshotYear: PolicyYear,
  trendStartYear: PolicyYear,
  trendEndYear: PolicyYear,
  notes: string,
): GenerateReportRequest {
  const fullNameByCode = new Map(
    classes.map((c) => [c.classCode, c.fullName || c.classCode]),
  )
  const kpi = kpiSummary(classes)
  const trendStartIdx = POLICY_YEARS.indexOf(trendStartYear)
  const trendEndIdx = POLICY_YEARS.indexOf(trendEndYear)

  const reportData: Record<string, unknown> = {
    data_period: DATA_PERIOD,
    selected_policy_year: snapshotYear,
    report_caliber: `Policy Year ${snapshotYear} · Trend ${trendStartYear}–${trendEndYear}`,
    kpi: {
      current_policy_year: snapshotYear,
      current_year_premium_hkd: REDACTED_AMOUNT,
      active_item_count: kpi.activeItemCount,
      total_claims: kpi.totalClaims,
      open_claims: kpi.openClaims,
      total_incurred_hkd: REDACTED_AMOUNT,
    },
  }

  if (sectionKeys.includes('premiumByClass')) {
    const slices = premiumByClass(classes, snapshotYear)
    const total = slices.reduce((s, d) => s + d.amount, 0)
    const pct = (amount: number): number =>
      total > 0 ? Number(((amount / total) * 100).toFixed(1)) : 0
    const folded = foldTopN(slices)
    const rows = folded.top.map((s) => ({
      class_code: s.name,
      full_name: fullNameByCode.get(s.name) ?? s.name,
      premium_hkd: REDACTED_AMOUNT,
      share_pct: pct(s.amount),
    }))
    if (folded.othersTotal > 0) {
      rows.push({
        class_code: 'Others',
        full_name: 'Others (aggregated)',
        premium_hkd: REDACTED_AMOUNT,
        share_pct: pct(folded.othersTotal),
      })
    }
    reportData.premium_by_class = {
      policy_year: snapshotYear,
      total_hkd: REDACTED_AMOUNT,
      rows,
      note: PRO_RATA_NOTE,
    }
  }

  if (sectionKeys.includes('premiumByBroker')) {
    const slices = premiumByBroker(classes, snapshotYear)
    const total = slices.reduce((s, d) => s + d.amount, 0)
    const pct = (amount: number): number =>
      total > 0 ? Number(((amount / total) * 100).toFixed(1)) : 0
    reportData.premium_by_broker = {
      policy_year: snapshotYear,
      total_hkd: REDACTED_AMOUNT,
      rows: slices.map((s) => ({
        broker: s.name,
        premium_hkd: REDACTED_AMOUNT,
        share_pct: pct(s.amount),
      })),
      note: PRO_RATA_NOTE,
    }
  }

  if (sectionKeys.includes('premiumTrend')) {
    const allTrendRows = premiumTrend(classes).map((p) => ({
      policy_year: p.year,
      core_classes_hkd: REDACTED_AMOUNT,
      other_classes_hkd: REDACTED_AMOUNT,
      total_hkd: REDACTED_AMOUNT,
    }))
    reportData.premium_trend = {
      column_labels: {
        policy_year: 'Policy Year',
        core_classes_hkd: 'Core Classes',
        other_classes_hkd: 'Other Classes',
        total_hkd: 'Total',
      },
      rows: allTrendRows.filter((r) => {
        const idx = POLICY_YEARS.indexOf(r.policy_year as PolicyYear)
        return idx >= trendStartIdx && idx <= trendEndIdx
      }),
      note: 'Annualized premium allocated pro-rata by month',
    }
  }

  if (sectionKeys.includes('lossRatio')) {
    const DEVELOPING_YEARS: PolicyYear[] = ['25/26', '26/27']
    const flatRows: Array<Record<string, unknown>> = []
    const matrix = lossRatioMatrix(classes)
    for (const r of matrix) {
      for (const c of r.cells) {
        const idx = POLICY_YEARS.indexOf(c.year)
        if (idx < trendStartIdx || idx > trendEndIdx) continue
        const row: Record<string, unknown> = {
          class_code: r.classCode,
          full_name: fullNameByCode.get(r.classCode) ?? r.classCode,
          policy_year: c.year,
          incurred_hkd: REDACTED_AMOUNT,
          premium_hkd: REDACTED_AMOUNT,
          loss_ratio_pct:
            c.ratio === null
              ? null
              : Number((c.ratio * 100).toFixed(1)),
        }
        if (DEVELOPING_YEARS.includes(c.year)) {
          row.status = 'Developing'
        }
        flatRows.push(row)
      }
    }
    reportData.loss_ratio = {
      column_labels: {
        class_code: 'Class',
        full_name: 'Full Name',
        policy_year: 'Policy Year',
        incurred_hkd: 'Incurred',
        premium_hkd: 'Premium',
        loss_ratio_pct: 'Loss Ratio (%)',
        status: 'Status',
      },
      rows: flatRows,
      note: 'Loss ratio = Total Incurred ÷ Annualized Premium (allocated pro-rata by month)',
    }
  }

  if (sectionKeys.includes('claimsOverview')) {
    const snapshotClasses = classes.map((c) => ({
      ...c,
      claims: c.claims.filter(
        (claim) => claim.policyYear === snapshotYear,
      ),
    }))
    const ledger = snapshotClasses.filter((c) => c.hasClaimsLedger)
    reportData.claims_overview = {
      ledger_classes: ledger.map((c) => ({
        class_code: c.classCode,
        full_name: fullNameByCode.get(c.classCode) ?? c.classCode,
        claims_count: c.claims.length,
        open_claims: c.claims.filter((claim) => claim.status === 'Open').length,
        total_incurred_hkd: REDACTED_AMOUNT,
      })),
      claims_by_year: claimsCountByYear(snapshotClasses),
    }
  }

  return {
    report_data: reportData,
    sections: sectionKeys,
    notes,
    report_caliber: `Policy Year ${snapshotYear} · Trend ${trendStartYear}–${trendEndYear}`,
  }
}
