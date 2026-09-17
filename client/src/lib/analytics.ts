import { logger } from '@lark-apaas/client-toolkit'
import type { IClassWithRelations, IPolicyMaster } from '@/data/programme'

// EXPORTS: POLICY_YEARS, CURRENT_YEAR, normalizeYear, classLevelLabel, isPremiumRow, policyOverlapsYear,
// premiumShareInYear, premiumInYear, premiumLabelInYear, classPremiumInYear, classPremiumLabelInYear,
// currentYearPolicies, premiumByClass, foldTopN, premiumByBroker, premiumTrend,
// kpiSummary, claimsCountByYear, incurredByClass, lossRatioMatrix, validateBaselines

/** The four policy years shown on Dashboard, ascending */
export const POLICY_YEARS = ['23/24', '24/25', '25/26', '26/27'] as const

export type PolicyYear = (typeof POLICY_YEARS)[number]

/** Current policy year (Dashboard default) */
export const CURRENT_YEAR: PolicyYear = '26/27'

/** Normalize a Policy_Year label: '26-27' / ' 26/27 ' → '26/27' */
export function normalizeYear(year: string): string {
  return year.trim().replace(/-/g, '/')
}

/** Class_Level raw value → English display label */
export function classLevelLabel(level: string): string {
  if (level.includes('主')) return 'Main Class'
  if (level.includes('附属') || level.includes('项目')) return 'Project / Ancillary'
  return level || '-'
}

/**
 * Premium row filter: placeholder rows and rows without premium (e.g. Group Travel
 * declaration-basis, PPL excess layers, Motor non-fleet rows) are excluded from ALL
 * premium aggregations. Claims statistics do NOT use this filter.
 */
export function isPremiumRow(p: IPolicyMaster): boolean {
  return !p.isPlaceholder && p.premiumAnnualized > 0
}

/** Parse yyyy/MM/dd → Date (null when invalid) */
function parseDateStr(s: string): Date | null {
  if (!s) return null
  const m = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return isNaN(d.getTime()) ? null : d
}

/** Policy-year bucket: year N = [N/04/01, N+1/03/31] (label 'YY/YY' → N = 2000+YY) */
function yearBucket(label: PolicyYear): { start: Date; end: Date } {
  const startYear = 2000 + Number(label.slice(0, 2))
  return {
    start: new Date(startYear, 3, 1),
    end: new Date(startYear + 1, 2, 31, 23, 59, 59),
  }
}

/**
 * D1-c year attribution (pro-rata revision) — the single most error-prone logic in this app.
 *
 * Whole months of [Period_Start, Period_End] falling inside year bucket N (0-12).
 * Month granularity is sufficient: periods in the Base are month-aligned (start on the
 * 1st, end on a month's last day). Falls back to exact Policy_Year string match
 * (12 months or 0) only when period dates are missing.
 */
function overlapMonths(p: IPolicyMaster, year: PolicyYear): number {
  const start = parseDateStr(p.periodStart)
  const end = parseDateStr(p.periodEnd)
  if (!start || !end) return p.policyYear === year ? 12 : 0
  const bucket = yearBucket(year)
  const s = start > bucket.start ? start : bucket.start
  const e = end < bucket.end ? end : bucket.end
  if (s > e) return 0
  const months = e.getFullYear() * 12 + e.getMonth() - (s.getFullYear() * 12 + s.getMonth()) + 1
  return Math.max(0, Math.min(12, months))
}

/** Whether a policy row touches year bucket N at all (overlap of ≥ 1 month) */
export function policyOverlapsYear(p: IPolicyMaster, year: PolicyYear): boolean {
  return overlapMonths(p, year) > 0
}

/**
 * Annualized premium attributed to year bucket N, allocated PRO-RATA BY MONTH:
 * share = Premium_Annualized_12m × (overlap months with [N/04/01, N+1/03/31]) ÷ 12.
 *
 * Rationale: PARMBBI runs as a chain of back-to-back 18-month policies (e.g. the 2023
 * policy covers through 2024/09/30, `24-26` picks up 2024/10/01), and some
 * Summary-only rows use non-April-anchored periods (1 Jan–31 Dec, 1 Mar–28 Feb).
 * Counting the FULL PA12 on any overlap would double count handover years
 * (24/25 would read ~13M too high). April-aligned 12-month policies are unaffected
 * (12/12 in their own year, 0 elsewhere).
 */
export function premiumShareInYear(p: IPolicyMaster, year: PolicyYear): number {
  return p.premiumAnnualized * (overlapMonths(p, year) / 12)
}

/** Total annualized premium of premium rows attributed to a year (pro-rata by month) */
export function premiumInYear(policies: IPolicyMaster[], year: PolicyYear): number {
  return policies
    .filter(isPremiumRow)
    .reduce((sum, p) => sum + premiumShareInYear(p, year), 0)
}

/**
 * Display caliber: total Premium_Annualized_12m of premium rows whose Policy_Year
 * label normalizes to the given year. NO monthly pro-rata allocation — the value maps
 * 1:1 to the historical policies table (list-page Premium column / detail-page chip).
 * Includes PARMBBI's long-policy label ('26-27' ≡ '26/27').
 */
export function premiumLabelInYear(
  policies: IPolicyMaster[],
  year: PolicyYear
): number {
  return policies
    .filter((p) => isPremiumRow(p) && normalizeYear(p.policyYear) === year)
    .reduce((sum, p) => sum + p.premiumAnnualized, 0)
}

/**
 * Summary-only special case — the single entry point for per-class premium.
 *
 * Classes flagged Is_Summary_Only (GMI/BT/HMI) have NO Policy_Master rows by
 * design: premium is hand-entered at class level as Premium_Manual and counts
 * toward the CURRENT policy year only. All premium aggregations (list, detail,
 * charts, KPI, reports) must use these wrappers instead of the policy-row
 * calibers directly, so summary-only classes are never silently dropped.
 */
export function classPremiumInYear(cls: IClassWithRelations, year: PolicyYear): number {
  if (cls.isSummaryOnly) return year === CURRENT_YEAR ? cls.premiumManual : 0
  return premiumInYear(cls.policies, year)
}

/** Label-caliber variant of classPremiumInYear (list Premium column / detail chip) */
export function classPremiumLabelInYear(cls: IClassWithRelations, year: PolicyYear): number {
  if (cls.isSummaryOnly) return year === CURRENT_YEAR ? cls.premiumManual : 0
  return premiumLabelInYear(cls.policies, year)
}

/**
 * Policy rows overlapping the current year (26/27), placeholders excluded.
 * Display-only helper: class-list period sub-row / insurer dedup / original-currency sum.
 */
export function currentYearPolicies(policies: IPolicyMaster[]): IPolicyMaster[] {
  return policies.filter(
    (p) => !p.isPlaceholder && policyOverlapsYear(p, CURRENT_YEAR)
  )
}

export interface IPremiumSlice {
  /** Slice label (class code or broker name) */
  name: string
  /** Annualized premium total (HKD) */
  amount: number
}

/** Per-class annualized premium for a year, descending (zero-premium classes omitted) */
export function premiumByClass(classes: IClassWithRelations[], year: PolicyYear): IPremiumSlice[] {
  return classes
    .map((c) => ({ name: c.classCode, amount: classPremiumInYear(c, year) }))
    .filter((s) => s.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}

/** Fold a descending slice list into Top-N + Others (no fold when ≤ N+1 entries) */
export function foldTopN(
  slices: IPremiumSlice[],
  n = 7
): { top: IPremiumSlice[]; others: IPremiumSlice[]; othersTotal: number } {
  if (slices.length <= n + 1) return { top: slices, others: [], othersTotal: 0 }
  const top = slices.slice(0, n)
  const others = slices.slice(n)
  return { top, others, othersTotal: others.reduce((s, o) => s + o.amount, 0) }
}

/** Broker label for rows with an empty per-year Broker (23/24 source file had no broker column) */
export const UNKNOWN_BROKER = 'Unknown (2023 file)'

/**
 * Per-broker annualized premium for a year, descending. Uses the PER-POLICY broker
 * (year-specific), not the class-level broker. Empty brokers are kept as a named
 * "Unknown" slice instead of being silently dropped.
 */
export function premiumByBroker(classes: IClassWithRelations[], year: PolicyYear): IPremiumSlice[] {
  const map = new Map<string, number>()
  for (const c of classes) {
    for (const p of c.policies) {
      if (!isPremiumRow(p)) continue
      const share = premiumShareInYear(p, year)
      if (share <= 0) continue
      const broker = p.broker.trim() || UNKNOWN_BROKER
      map.set(broker, (map.get(broker) ?? 0) + share)
    }
  }
  // Summary-only classes: attribute the class-level manual premium to the class-level broker
  if (year === CURRENT_YEAR) {
    for (const c of classes) {
      if (!c.isSummaryOnly || c.premiumManual <= 0) continue
      const broker = c.broker.trim() || UNKNOWN_BROKER
      map.set(broker, (map.get(broker) ?? 0) + c.premiumManual)
    }
  }
  return Array.from(map.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export interface ITrendPoint {
  year: PolicyYear
  /** Core-class (EC/PPL/Motor/PARMBBI) annualized premium */
  core: number
  /** Non-core annualized premium */
  other: number
  total: number
}

/** Four-year premium trend, split core vs non-core, attributed by period overlap */
export function premiumTrend(classes: IClassWithRelations[]): ITrendPoint[] {
  return POLICY_YEARS.map((year) => {
    let core = 0
    let other = 0
    for (const c of classes) {
      const amount = classPremiumInYear(c, year)
      if (c.isCore) core += amount
      else other += amount
    }
    return { year, core, other, total: core + other }
  })
}

export interface IKpiSummary {
  /** Current-year (26/27) annualized premium total */
  currentYearPremium: number
  /** Count of policy rows with premium in the current year */
  activeItemCount: number
  totalClaims: number
  openClaims: number
  totalIncurred: number
}

/** Dashboard KPI numbers */
export function kpiSummary(classes: IClassWithRelations[]): IKpiSummary {
  const allPolicies = classes.flatMap((c) => c.policies)
  const allClaims = classes.flatMap((c) => c.claims)
  const currentRows = allPolicies
    .filter(isPremiumRow)
    .filter((p) => policyOverlapsYear(p, CURRENT_YEAR))
  // Summary-only classes have no policy rows; each active one counts as one item
  const summaryOnlyActive = classes.filter((c) => c.isSummaryOnly && c.premiumManual > 0)
  return {
    currentYearPremium:
      currentRows.reduce((s, p) => s + premiumShareInYear(p, CURRENT_YEAR), 0) +
      summaryOnlyActive.reduce((s, c) => s + c.premiumManual, 0),
    activeItemCount: currentRows.length + summaryOnlyActive.length,
    totalClaims: allClaims.length,
    openClaims: allClaims.filter((c) => c.status === 'Open').length,
    totalIncurred: allClaims.reduce((s, c) => s + c.totalIncurred, 0),
  }
}

export interface IClaimsYearStack {
  /** Ascending list of claim policy years present in the data */
  years: string[]
  /** One series per ledger class (PPL/Motor/EC), aligned with `years` */
  series: Array<{ classCode: string; counts: number[] }>
}

/**
 * Claims count by Policy_Year, stacked by ledger class. Includes claims anchored on
 * placeholder policy rows (claims statistics always include them).
 */
export function claimsCountByYear(classes: IClassWithRelations[]): IClaimsYearStack {
  const ledgerClasses = classes.filter((c) => c.hasClaimsLedger)
  const yearSet = new Set<string>()
  for (const c of ledgerClasses) {
    for (const claim of c.claims) {
      if (claim.policyYear) yearSet.add(claim.policyYear)
    }
  }
  const years = Array.from(yearSet).sort()
  const series = ledgerClasses.map((c) => {
    const countMap = new Map<string, number>()
    for (const claim of c.claims) {
      if (claim.policyYear) countMap.set(claim.policyYear, (countMap.get(claim.policyYear) ?? 0) + 1)
    }
    return { classCode: c.classCode, counts: years.map((y) => countMap.get(y) ?? 0) }
  })
  return { years, series }
}

/** Total incurred per ledger class, descending */
export function incurredByClass(classes: IClassWithRelations[]): IPremiumSlice[] {
  return classes
    .filter((c) => c.hasClaimsLedger)
    .map((c) => ({
      name: c.classCode,
      amount: c.claims.reduce((s, claim) => s + claim.totalIncurred, 0),
    }))
    .sort((a, b) => b.amount - a.amount)
}

export interface ILossRatioCell {
  year: PolicyYear
  incurred: number
  premium: number
  /** Incurred ÷ annualized premium; null when the year has no premium */
  ratio: number | null
}

export interface ILossRatioRow {
  classCode: string
  cells: ILossRatioCell[]
}

/**
 * Loss ratio matrix: 3 ledger classes × 4 policy years.
 * Numerator: claims Total_Incurred matched by the claim's Policy_Year string.
 * Denominator: annualized premium attributed to the year by period overlap (D1-c).
 */
export function lossRatioMatrix(classes: IClassWithRelations[]): ILossRatioRow[] {
  return classes
    .filter((c) => c.hasClaimsLedger)
    .map((c) => ({
      classCode: c.classCode,
      cells: POLICY_YEARS.map((year) => {
        const incurred = c.claims
          .filter((claim) => claim.policyYear === year)
          .reduce((s, claim) => s + claim.totalIncurred, 0)
        const premium = classPremiumInYear(c, year)
        return { year, incurred, premium, ratio: premium > 0 ? incurred / premium : null }
      }),
    }))
}

/**
 * Dev-time self-check against the handoff baseline numbers. Logs computed aggregates
 * so they can be compared with the reference values after real data is bound:
 * total claims 767 (PPL 127 / Motor 263 / EC 377); incurred PPL 5,740,590.44 /
 * Motor 8,856,664.20 / EC 23,046,607.38; open PPL 5 / Motor 48 / EC 15;
 * trend 23/24 ≈ 30.8M, 24/25 ≈ 32.4M, 25/26 ≈ 31.8M, 26/27 = 31.08M.
 * Note the handoff reference values were estimated under the old full-amount-on-overlap
 * rule; with pro-rata month allocation the PARMBBI chain contributes partial shares in
 * handover years, so 24/25 and 25/26 are expected to come in below those estimates.
 */
export function validateBaselines(classes: IClassWithRelations[]): void {
  const kpi = kpiSummary(classes)
  const perClass = classes
    .filter((c) => c.hasClaimsLedger)
    .map((c) => {
      const incurred = c.claims.reduce((s, claim) => s + claim.totalIncurred, 0)
      const open = c.claims.filter((claim) => claim.status === 'Open').length
      return `${c.classCode}: count=${c.claims.length}, open=${open}, incurred=${incurred.toFixed(2)}`
    })
    .join(' | ')
  const trend = premiumTrend(classes)
    .map((t) => `${t.year}: ${(t.total / 1_000_000).toFixed(2)}M`)
    .join(', ')
  logger.info(`[baselines] Claims total=${kpi.totalClaims}, open=${kpi.openClaims}, incurred=${kpi.totalIncurred.toFixed(2)}`)
  logger.info(`[baselines] Per ledger class: ${perClass}`)
  logger.info(`[baselines] Premium trend (period-overlap): ${trend}`)
}


/**
 * Display name for a class code. The dashboard groups and colours by code, but
 * viewers see the full class name; unknown keys (e.g. "Others") pass through.
 */
export function classNameLookup(classes: IClassWithRelations[]): (code: string) => string {
  // Chart labels use the name up to the first comma, e.g. "Property All Risks"
  // instead of "Property All Risks, Machinery Breakdown & Business Interruption".
  const short = (name: string) => name.split(',')[0].trim()
  const map = new Map(classes.map((c) => [c.classCode, short(c.fullName) || c.classCode]))
  return (code) => map.get(code) ?? code
}
