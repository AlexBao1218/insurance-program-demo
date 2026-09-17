// EXPORTS: IAttachmentFile, IInsuranceClass, IPolicyMaster, IClaimRecord, IClassWithRelations, MOCK_CLASSES, MOCK_POLICIES, MOCK_CLAIMS

import { REDACTED } from '@/lib/brand'

/** Attachment file (Bitable attachment field item) */
export interface IAttachmentFile {
  name: string
  fileToken: string
  fileUrl?: string
}

/** Insurance class master record (Insurance_Class - 34 rows) */
export interface IInsuranceClass {
  /** record_id */
  id: string
  /** Class code (primary field): EC / PPL / Motor / PARMBBI / D&O / Cyber ... */
  classCode: string
  /** Full class name */
  fullName: string
  /** Item no. in the 26/27 Summary (historical numbering drifts; reference only) */
  itemNo: number
  /** Class-level broker label: Broker A / Broker B / Broker C / Broker D / Others (charts use per-policy broker) */
  broker: string
  /** Core class flag: EC/PPL/Motor/PARMBBI = true */
  isCore: boolean
  /** Has claims ledger: only PPL/EC/Motor = true */
  hasClaimsLedger: boolean
  /** Class level: 主险种 (main, 18) / 附属·项目保单 (project/ancillary, 16) */
  classLevel: string
  /** Pricing currency: HKD / USD / RMB (amounts are already HKD-converted) */
  currency: string
  /** Current-year (26/27 ∪ 26-27) annualized premium total (formula) */
  premiumCurrentYear: number
  /** Claims count (rollup, non-zero only for the 3 ledger classes) */
  claimsCountRollup: number
  /** Open claims count (rollup) */
  openClaimsRollup: number
  /** Total incurred (rollup) */
  totalIncurredRollup: number
  /** Summary-only class: premium/insurer are class-level hand-entered fields, no Policy_Master rows by design (GMI/BT/HMI) */
  isSummaryOnly: boolean
  /** Hand-entered annualized premium (HKD); the premium source for summary-only classes */
  premiumManual: number
  /** Class-level insurer text; the insurer source for summary-only classes */
  insurer: string
}

/** Policy master record (Policy_Master - 201 rows: 32 real + 55 placeholder + 114 summary-only) */
export interface IPolicyMaster {
  /** record_id */
  id: string
  /** Policy ID (primary field): {Policy_No}_{Policy_Year} — REDACTED in the public demo */
  policyId: string
  /** Policy number (may be empty for placeholder / some summary-only rows) — REDACTED in the public demo */
  policyNo: string
  /** Policy year: `YY/YY` (e.g. 25/26); PARMBBI long-term exception: `24-26` / `26-27` */
  policyYear: string
  /** Related Insurance_Class record_id */
  classRecordId: string
  /** Sub policy — Motor: Private Car/Fleet/Motor Cycle; PPL: Primary/1st Excess/2nd Excess */
  subPolicy: string
  /** Period start (yyyy/MM/dd, all 201 rows populated) */
  periodStart: string
  /** Period end (yyyy/MM/dd) */
  periodEnd: string
  /** Insurer free text (per-year value). Public demo: names are REDACTED tokens; share % / (Lead) / layer syntax is kept */
  insurer: string
  /** Broker (per-year value; empty for 23/24 non-core rows — source file had no broker column) */
  broker: string
  /** Currency: HKD / USD / RMB (amounts already HKD-converted) */
  currency: string
  /** Full-term premium (18-month total for the long PARMBBI policies) */
  premiumFullTerm: number
  /** 12-month annualized premium — ALL yearly aggregations and charts use this field */
  premiumAnnualized: number
  /** Original-currency premium before HKD conversion (Original_Amount; 0 for HKD rows) */
  originalAmount: number
  /** Placeholder row flag: 55 historical rows, no premium/PDF, exist only to anchor claims */
  isPlaceholder: boolean
  /** Policy PDF attachments */
  pdfPolicy: IAttachmentFile[]
  /** Endorsement PDF attachments */
  pdfEndorsement: IAttachmentFile[]
  /** Debit/Credit note PDF attachments */
  pdfDnCn: IAttachmentFile[]
  /** Claims count (rollup) */
  claimsCount: number
  /** Claims incurred (rollup) */
  claimsIncurred: number
  /** Loss ratio = Claims_Incurred / Premium_Full_Term (formula) */
  lossRatio: number
  /** Remarks (contains "Summary-only" / pending-FX notes etc.) */
  remarks: string
}

/** Claim record (Claims_Master - 767 rows: PPL 127 / Motor 263 / EC 377) */
export interface IClaimRecord {
  /** record_id */
  id: string
  /** Claim ID (primary field, unique; multi-incident suffix _01/_02, PPL cross-year suffix) — REDACTED in the public demo, suffix kept */
  claimId: string
  /** Original claim number (may repeat across rows) — REDACTED in the public demo */
  claimNo: string
  /** Related Insurance_Class record_id */
  classRecordId: string
  /** Related Policy_Master record_id (all 767 rows bound, 0 dangling) */
  policyRecordId: string
  /** Policy year: `YY/YY` */
  policyYear: string
  /** Date of loss (yyyy/MM/dd; 3 PPL claims fall outside their policy period — source data, normal) */
  dol: string
  /** Claimant (presence varies by class) */
  claimant: string
  /** Loss description */
  description: string
  /** Loss location (PPL/Motor only, EC has none) */
  lossLocation: string
  /** Lead insurer reference */
  leadInsurerRef: string
  /** Sequence number */
  sequenceNo: string
  /** Case value - indemnity (PPL only) */
  caseValueInd: number
  /** Case value - expense (PPL only) */
  caseValueExp: number
  /** Reserve - indemnity (EC only) */
  reserveInd: number
  /** Reserve - expense (EC only) */
  reserveExp: number
  /** Total reserve (all 3 classes) */
  reserveTotal: number
  /** Total paid (all 3 classes) */
  paidTotal: number
  /** Total incurred (all 3 classes) */
  totalIncurred: number
  /** Paid - indemnity (PPL and EC) */
  paidInd: number
  /** Paid - expense (PPL and EC) */
  paidExp: number
  /** Excess recovered (PPL and Motor) */
  excessRecovered: number
  /** Status: Open / Closed (normalized) */
  status: string
  /** Last update note */
  lastUpdateNote: string
  /** Remarks */
  remarks: string
  /** Source file */
  sourceFile: string
}

/** Insurance class with related data (after 3-table join) */
export interface IClassWithRelations extends IInsuranceClass {
  /** Related policy rows (all years, including placeholder rows) */
  policies: IPolicyMaster[]
  /** Related claim rows */
  claims: IClaimRecord[]
}

// --- Synthetic data (public demo) ---
// Aggregate-level numbers (premium per class per year, claim counts, incurred, loss
// ratios) are synthetic. Record-level fields that would identify a real entity or
// document (policy / claim numbers, insurer names, claimant, description, loss
// location, attachment names, remarks, source files) are stored as the REDACTED
// sentinel and rendered by <Redacted /> — never as an invented substitute.
// Covers the data quirks from the handoff spec: PARMBBI as a chain of back-to-back
// 18-month policies (23-24 through 2024/09/30, then 24-26, then 26-27 — handover years
// must be allocated pro-rata, never double counted), non-April-anchored Summary-only
// periods (1 Jan–31 Dec sample), placeholder rows carrying historical claims, premium
// consolidated on Motor Fleet / PPL Primary rows, per-class claim field presence,
// duplicate Claim_No with unique Claim_ID, DOL outside policy period, Group Travel
// without fixed premium, empty 23/24 brokers, and the 26/27 PPL twin policy rows.

function mkClass(
  id: string,
  classCode: string,
  fullName: string,
  itemNo: number,
  broker: string,
  classLevel: string,
  overrides: Partial<IInsuranceClass> = {}
): IInsuranceClass {
  return {
    id,
    classCode,
    fullName,
    itemNo,
    broker,
    isCore: false,
    hasClaimsLedger: false,
    classLevel,
    currency: 'HKD',
    premiumCurrentYear: 0,
    claimsCountRollup: 0,
    openClaimsRollup: 0,
    totalIncurredRollup: 0,
    isSummaryOnly: false,
    premiumManual: 0,
    insurer: '',
    ...overrides,
  }
}

const MAIN = '主险种'
const PROJECT = '附属·项目保单'

export const MOCK_CLASSES: IInsuranceClass[] = [
  // Standard lines of insurance keep their real class names / codes
  mkClass('recClsEC', 'EC', "Employees' Compensation", 1, 'Broker A', MAIN, {
    isCore: true,
    hasClaimsLedger: true,
    premiumCurrentYear: 6_800_000,
    claimsCountRollup: 6,
    openClaimsRollup: 1,
    totalIncurredRollup: 2_355_000,
  }),
  mkClass('recClsPPL', 'PPL', 'Public & Products Liability', 2, 'Broker A', MAIN, {
    isCore: true,
    hasClaimsLedger: true,
    premiumCurrentYear: 3_900_000,
    claimsCountRollup: 5,
    openClaimsRollup: 1,
    totalIncurredRollup: 1_755_000,
  }),
  mkClass('recClsMotor', 'Motor', 'Motor Fleet', 3, 'Broker B', MAIN, {
    isCore: true,
    hasClaimsLedger: true,
    premiumCurrentYear: 2_400_000,
    claimsCountRollup: 5,
    openClaimsRollup: 2,
    totalIncurredRollup: 690_000,
  }),
  mkClass('recClsPARMBBI', 'PARMBBI', 'Property All Risks, Machinery Breakdown & Business Interruption', 4, 'Broker A', MAIN, {
    isCore: true,
    premiumCurrentYear: 13_512_480,
  }),
  mkClass('recClsDO', 'D&O', "Directors' & Officers' Liability", 5, 'Broker A', MAIN, { premiumCurrentYear: 980_000 }),
  mkClass('recClsCyber', 'Cyber', 'Cyber Risk Insurance', 6, 'Broker A', MAIN, { premiumCurrentYear: 650_000 }),
  mkClass('recClsCrime', 'Crime', 'Commercial Crime', 7, 'Broker A', MAIN, { premiumCurrentYear: 310_000 }),
  mkClass('recClsGT', 'Group Travel', 'Group Business Travel', 8, 'Broker D', MAIN),
  mkClass('recClsGPA', 'Group PA', 'Group Personal Accident', 9, 'Broker D', MAIN, { premiumCurrentYear: 420_000 }),
  mkClass('recClsGMed', 'Group Medical', 'Group Medical Insurance', 10, 'Broker D', MAIN),
  mkClass('recClsMarine', 'Marine Cargo', 'Marine Cargo Open Cover', 11, 'Broker B', MAIN, { premiumCurrentYear: 380_000 }),
  mkClass('recClsMoney', 'Money', 'Money Insurance', 12, 'Broker B', MAIN, { premiumCurrentYear: 120_000 }),
  mkClass('recClsEEI', 'EEI', 'Electronic Equipment Insurance', 13, 'Broker B', MAIN, { premiumCurrentYear: 95_000 }),
  mkClass('recClsFG', 'Fidelity', 'Fidelity Guarantee', 14, 'Others', MAIN, { premiumCurrentYear: 180_000 }),
  mkClass('recClsTerror', 'Terrorism', 'Property Terrorism', 15, 'Broker A', MAIN, { premiumCurrentYear: 300_000 }),
  mkClass('recClsPI', 'PI', 'Professional Indemnity', 16, 'Others', MAIN),
  mkClass('recClsELCN', 'EL-China', "Employers' Liability (Mainland)", 17, 'Broker C', MAIN),
  mkClass('recClsTC', 'Trade Credit', 'Trade Credit Insurance', 18, 'Others', MAIN),
  // Class codes and names are kept as in the original mock dataset (owner's decision).
  // Class-level structure (classLevel, currency, premium, isCore/summary flags) is unchanged.
  mkClass('recClsPLMT', 'PL-MTech', 'Project Liability - MTech Plant', 19, 'Broker C', PROJECT, {
    premiumCurrentYear: 260_000,
    currency: 'RMB',
  }),
  mkClass('recClsPARPY', 'PAR-Panyu', 'Project All Risks - Panyu Facility', 20, 'Broker C', PROJECT, {
    premiumCurrentYear: 540_000,
    currency: 'RMB',
  }),
  mkClass('recClsPARFS', 'PAR-Foshan', 'Project All Risks - Foshan Plant', 21, 'Broker C', PROJECT),
  mkClass('recClsCARTKO', 'CAR-TKO', "Contractor's All Risks - TKO Pipeline", 22, 'Broker A', PROJECT),
  mkClass('recClsCARTM', 'CAR-TM', "Contractor's All Risks - Tuen Mun Network", 23, 'Broker A', PROJECT),
  mkClass('recClsEARPU', 'EAR-Upgrade', 'Erection All Risks - Plant Upgrade', 24, 'Broker B', PROJECT),
  mkClass('recClsPLEP', 'PL-EcoPark', 'Project Liability - EcoPark', 25, 'Broker C', PROJECT),
  mkClass('recClsPARMO', 'PAR-Macau', 'Project All Risks - Macau JV', 26, 'Others', PROJECT),
  mkClass('recClsMarLNG', 'Marine-LNG', 'Marine Project - LNG Terminal', 27, 'Broker A', PROJECT, { currency: 'USD' }),
  mkClass('recClsDSU', 'DSU-LNG', 'Delay in Start-Up - LNG Terminal', 28, 'Broker A', PROJECT, { currency: 'USD' }),
  mkClass('recClsCARSM', 'CAR-Smart', "Contractor's All Risks - Smart Meter Rollout", 29, 'Broker B', PROJECT),
  mkClass('recClsPLH2', 'PL-Hydrogen', 'Project Liability - Hydrogen Pilot', 30, 'Broker A', PROJECT),
  mkClass('recClsPARDC', 'PAR-Data', 'Project All Risks - Data Centre', 31, 'Broker B', PROJECT),
  mkClass('recClsEARTC', 'EAR-Telecity', 'Erection All Risks - Telecity', 32, 'Others', PROJECT),
  // Contractor's Plant & Machinery is a standard line — code/name kept
  mkClass('recClsCPM', 'CPM', "Contractor's Plant & Machinery", 33, 'Broker B', PROJECT),
  mkClass('recClsPARHQ', 'PAR-HQ', 'Property All Risks - HQ Renovation', 34, 'Others', PROJECT),
]

/**
 * Co-insurance insurer text used on the PARMBBI rows. Names are REDACTED tokens;
 * the share / (Lead) syntax exercises the InsurerStructure parser like the real Base.
 */
const CO_INSURED = `${REDACTED} — 60% (Lead)\n${REDACTED} — 40%`

function mkPolicy(
  id: string,
  classRecordId: string,
  policyYear: string,
  premiumAnnualized: number,
  periodStart: string,
  periodEnd: string,
  overrides: Partial<IPolicyMaster> = {}
): IPolicyMaster {
  const isPlaceholder = overrides.isPlaceholder === true
  return {
    id,
    // Policy_ID / Policy_No identify a real document → redacted; placeholder rows have
    // no policy number in the source Base, so they keep an empty Policy_No
    policyId: isPlaceholder ? `(placeholder)_${policyYear}` : REDACTED,
    policyNo: isPlaceholder ? '' : REDACTED,
    policyYear,
    classRecordId,
    subPolicy: '',
    periodStart,
    periodEnd,
    insurer: REDACTED,
    broker: '',
    currency: 'HKD',
    premiumFullTerm: premiumAnnualized,
    premiumAnnualized,
    originalAmount: 0,
    isPlaceholder: false,
    pdfPolicy: [],
    pdfEndorsement: [],
    pdfDnCn: [],
    claimsCount: 0,
    claimsIncurred: 0,
    lossRatio: 0,
    remarks: '',
    ...overrides,
  }
}

export const MOCK_POLICIES: IPolicyMaster[] = [
  // --- 26/27 (2026/04/01 - 2027/03/31) ---
  mkPolicy('recPolEC2627', 'recClsEC', '26/27', 6_800_000, '2026/04/01', '2027/03/31', {
    insurer: REDACTED, broker: 'Broker A',
    pdfPolicy: [{ name: REDACTED, fileToken: 'mockTokenEC2627' }],
  }),
  // Public demo: exactly one policy row per class per policy year
  mkPolicy('recPolPPL2627b', 'recClsPPL', '26/27', 3_900_000, '2026/04/01', '2027/03/31', {
    subPolicy: 'Primary', insurer: REDACTED, broker: 'Broker A', claimsCount: 1, claimsIncurred: 900_000,
    pdfPolicy: [{ name: REDACTED, fileToken: 'mockTokenPPL2627' }],
  }),
  // Motor premium is consolidated on the Fleet row
  mkPolicy('recPolMotor2627f', 'recClsMotor', '26/27', 2_400_000, '2026/04/01', '2027/03/31', {
    subPolicy: 'Fleet', insurer: REDACTED, broker: 'Broker B', claimsCount: 1, claimsIncurred: 150_000,
    remarks: REDACTED,
  }),
  // PARMBBI 18-month long policy `26-27`: full-term premium ≠ annualized premium
  mkPolicy('recPolPAR2627', 'recClsPARMBBI', '26-27', 13_512_480, '2026/04/01', '2027/09/30', {
    insurer: CO_INSURED, broker: 'Broker A', premiumFullTerm: 20_268_720,
    remarks: REDACTED,
  }),
  mkPolicy('recPolDO2627', 'recClsDO', '26/27', 980_000, '2026/04/01', '2027/03/31', {
    insurer: REDACTED, broker: 'Broker A',
  }),
  mkPolicy('recPolCyber2627', 'recClsCyber', '26/27', 650_000, '2026/04/01', '2027/03/31', {
    insurer: REDACTED, broker: 'Broker A',
  }),
  mkPolicy('recPolCrime2627', 'recClsCrime', '26/27', 310_000, '2026/04/01', '2027/03/31', {
    insurer: REDACTED, broker: 'Broker A',
  }),
  mkPolicy('recPolGPA2627', 'recClsGPA', '26/27', 420_000, '2026/04/01', '2027/03/31', {
    insurer: REDACTED, broker: 'Broker D',
  }),
  mkPolicy('recPolMarine2627', 'recClsMarine', '26/27', 380_000, '2026/04/01', '2027/03/31', {
    insurer: REDACTED, broker: 'Broker B',
  }),
  mkPolicy('recPolMoney2627', 'recClsMoney', '26/27', 120_000, '2026/04/01', '2027/03/31', {
    insurer: REDACTED, broker: 'Broker B',
  }),
  mkPolicy('recPolEEI2627', 'recClsEEI', '26/27', 95_000, '2026/04/01', '2027/03/31', {
    insurer: REDACTED, broker: 'Broker B',
  }),
  mkPolicy('recPolFG2627', 'recClsFG', '26/27', 180_000, '2026/04/01', '2027/03/31', {
    insurer: REDACTED, broker: 'Others',
  }),
  mkPolicy('recPolTerror2627', 'recClsTerror', '26/27', 300_000, '2026/04/01', '2027/03/31', {
    insurer: REDACTED, broker: 'Broker A',
  }),
  mkPolicy('recPolPLMT2627', 'recClsPLMT', '26/27', 260_000, '2026/04/01', '2027/03/31', {
    insurer: REDACTED, broker: 'Broker C', currency: 'RMB', originalAmount: 239_600,
    remarks: REDACTED,
  }),
  mkPolicy('recPolPARPY2627', 'recClsPARPY', '26/27', 540_000, '2026/04/01', '2027/03/31', {
    insurer: REDACTED, broker: 'Broker C', currency: 'RMB', originalAmount: 497_500,
  }),

  // --- 25/26 (2025/04/01 - 2026/03/31) ---
  mkPolicy('recPolEC2526', 'recClsEC', '25/26', 6_200_000, '2025/04/01', '2026/03/31', {
    insurer: REDACTED, broker: 'Broker A', claimsCount: 2, claimsIncurred: 620_000,
  }),
  mkPolicy('recPolPPL2526', 'recClsPPL', '25/26', 3_600_000, '2025/04/01', '2026/03/31', {
    subPolicy: 'Primary', insurer: REDACTED, broker: 'Broker A', claimsCount: 2, claimsIncurred: 375_000,
  }),
  mkPolicy('recPolMotor2526', 'recClsMotor', '25/26', 2_300_000, '2025/04/01', '2026/03/31', {
    subPolicy: 'Fleet', insurer: REDACTED, broker: 'Broker B', claimsCount: 2, claimsIncurred: 240_000,
  }),
  // Group Travel 25/26 has no fixed premium (per-trip declaration) — empty premium is normal
  mkPolicy('recPolGT2526', 'recClsGT', '25/26', 0, '2025/04/01', '2026/03/31', {
    insurer: REDACTED, broker: 'Broker D', remarks: REDACTED,
  }),
  mkPolicy('recPolDO2526', 'recClsDO', '25/26', 950_000, '2025/04/01', '2026/03/31', {
    insurer: REDACTED, broker: 'Broker A',
  }),
  mkPolicy('recPolCyber2526', 'recClsCyber', '25/26', 600_000, '2025/04/01', '2026/03/31', {
    insurer: REDACTED, broker: 'Broker A',
  }),

  // --- PARMBBI 18-month long policy `24-26` (2024/10/01 - 2026/03/31) ---
  // Must be counted in BOTH the 24/25 and 25/26 buckets by period overlap (D1-c rule)
  mkPolicy('recPolPAR2426', 'recClsPARMBBI', '24-26', 13_512_480, '2024/10/01', '2026/03/31', {
    insurer: CO_INSURED, broker: 'Broker A', premiumFullTerm: 20_268_720,
    remarks: REDACTED,
  }),

  // --- 24/25 (2024/04/01 - 2025/03/31) ---
  mkPolicy('recPolEC2425', 'recClsEC', '24/25', 5_900_000, '2024/04/01', '2025/03/31', {
    insurer: REDACTED, broker: 'Broker A', claimsCount: 1, claimsIncurred: 85_000,
  }),
  mkPolicy('recPolPPL2425', 'recClsPPL', '24/25', 3_400_000, '2024/04/01', '2025/03/31', {
    subPolicy: 'Primary', insurer: REDACTED, broker: 'Broker A',
  }),
  mkPolicy('recPolMotor2425', 'recClsMotor', '24/25', 2_200_000, '2024/04/01', '2025/03/31', {
    subPolicy: 'Fleet', insurer: REDACTED, broker: 'Broker B', claimsCount: 1, claimsIncurred: 60_000,
  }),
  mkPolicy('recPolDO2425', 'recClsDO', '24/25', 900_000, '2024/04/01', '2025/03/31', {
    insurer: REDACTED, broker: 'Broker A',
  }),

  // --- 23/24 (2023/04/01 - 2024/03/31) — non-core rows have empty broker (source file had none) ---
  mkPolicy('recPolEC2324', 'recClsEC', '23/24', 5_500_000, '2023/04/01', '2024/03/31', {
    insurer: REDACTED, broker: 'Broker A', claimsCount: 1, claimsIncurred: 1_650_000,
  }),
  mkPolicy('recPolPPL2324', 'recClsPPL', '23/24', 3_200_000, '2023/04/01', '2024/03/31', {
    subPolicy: 'Primary', insurer: REDACTED, broker: 'Broker A',
  }),
  mkPolicy('recPolMotor2324', 'recClsMotor', '23/24', 2_100_000, '2023/04/01', '2024/03/31', {
    subPolicy: 'Fleet', insurer: REDACTED, broker: 'Broker B',
  }),
  // PARMBBI chain predecessor: 18-month `23-24` running through 2024/09/30 — its 24/25
  // share (6/12) plus the `24-26` successor share (6/12) must sum to ONE full PA12
  mkPolicy('recPolPAR2324', 'recClsPARMBBI', '23-24', 12_800_000, '2023/04/01', '2024/09/30', {
    insurer: CO_INSURED, broker: 'Broker A', premiumFullTerm: 19_200_000,
    remarks: REDACTED,
  }),
  // Non-April-anchored Summary-only row: calendar-year period allocates 3/12 to 24/25
  // and 9/12 to 25/26
  mkPolicy('recPolELCN2025', 'recClsELCN', '2025', 240_000, '2025/01/01', '2025/12/31', {
    insurer: REDACTED, broker: 'Broker C',
    remarks: REDACTED,
  }),
  mkPolicy('recPolDO2324', 'recClsDO', '23/24', 850_000, '2023/04/01', '2024/03/31', {
    insurer: REDACTED, remarks: REDACTED,
  }),
  mkPolicy('recPolCyber2324', 'recClsCyber', '23/24', 550_000, '2023/04/01', '2024/03/31', {
    insurer: REDACTED, remarks: REDACTED,
  }),
  mkPolicy('recPolMarine2324', 'recClsMarine', '23/24', 340_000, '2023/04/01', '2024/03/31', {
    insurer: REDACTED, remarks: REDACTED,
  }),

]

function mkClaim(
  id: string,
  claimId: string,
  claimNo: string,
  classRecordId: string,
  policyRecordId: string,
  policyYear: string,
  dol: string,
  status: string,
  totalIncurred: number,
  overrides: Partial<IClaimRecord> = {}
): IClaimRecord {
  return {
    id,
    claimId,
    claimNo,
    classRecordId,
    policyRecordId,
    policyYear,
    dol,
    claimant: '',
    description: '',
    lossLocation: '',
    leadInsurerRef: '',
    sequenceNo: '',
    caseValueInd: 0,
    caseValueExp: 0,
    reserveInd: 0,
    reserveExp: 0,
    reserveTotal: 0,
    paidTotal: 0,
    totalIncurred,
    paidInd: 0,
    paidExp: 0,
    excessRecovered: 0,
    status,
    lastUpdateNote: '',
    remarks: '',
    sourceFile: '',
    ...overrides,
  }
}

export const MOCK_CLAIMS: IClaimRecord[] = [
  // --- PPL claims (Case_Value_Ind/Exp + Paid_Ind/Exp + Excess_Recovered; no Reserve_Ind/Exp) ---
  // DOL outside the policy period (source data is like this — do not assert against it)
  mkClaim('recClmPPL1', REDACTED, REDACTED, 'recClsPPL', '', '18/19', '2019/06/15', 'Closed', 480_000, {
    claimant: REDACTED, description: REDACTED,
    lossLocation: REDACTED, caseValueInd: 480_000, caseValueExp: 65_000,
    paidInd: 450_000, paidExp: 30_000, paidTotal: 480_000, excessRecovered: 50_000,
    sourceFile: REDACTED,
  }),
  mkClaim('recClmPPL2', REDACTED, REDACTED, 'recClsPPL', 'recPolPPL2627b', '26/27', '2026/05/10', 'Open', 900_000, {
    claimant: REDACTED, description: REDACTED,
    lossLocation: REDACTED, caseValueInd: 850_000, caseValueExp: 90_000,
    reserveTotal: 780_000, paidInd: 100_000, paidExp: 20_000, paidTotal: 120_000,
    lastUpdateNote: REDACTED, sourceFile: REDACTED,
  }),
  // Duplicate Claim_No (two incidents) — Claim_ID keeps the _01/_02 suffix (on the redacted token) and stays unique
  mkClaim('recClmPPL3', `${REDACTED}_01`, REDACTED, 'recClsPPL', 'recPolPPL2526', '25/26', '2025/08/03', 'Closed', 215_000, {
    claimant: REDACTED, description: REDACTED,
    lossLocation: REDACTED, caseValueInd: 215_000, paidInd: 205_000, paidExp: 10_000, paidTotal: 215_000,
    sourceFile: REDACTED,
  }),
  mkClaim('recClmPPL4', `${REDACTED}_02`, REDACTED, 'recClsPPL', 'recPolPPL2526', '25/26', '2025/08/03', 'Closed', 160_000, {
    claimant: REDACTED, description: REDACTED,
    lossLocation: REDACTED, caseValueInd: 160_000, paidInd: 160_000, paidTotal: 160_000, excessRecovered: 20_000,
    sourceFile: REDACTED,
  }),

  // --- Motor claims (Reserve_Total/Paid_Total/Total_Incurred + Excess_Recovered only; no Ind/Exp splits) ---
  mkClaim('recClmMTR1', REDACTED, REDACTED, 'recClsMotor', 'recPolMotor2627f', '26/27', '2026/06/20', 'Open', 150_000, {
    claimant: REDACTED, description: REDACTED,
    lossLocation: REDACTED, reserveTotal: 150_000, sourceFile: REDACTED,
  }),
  mkClaim('recClmMTR2', REDACTED, REDACTED, 'recClsMotor', 'recPolMotor2526', '25/26', '2025/11/02', 'Closed', 145_000, {
    description: REDACTED, lossLocation: REDACTED,
    paidTotal: 145_000, excessRecovered: 15_000, sourceFile: REDACTED,
  }),
  mkClaim('recClmMTR3', REDACTED, REDACTED, 'recClsMotor', 'recPolMotor2526', '25/26', '2026/01/18', 'Open', 95_000, {
    description: REDACTED, lossLocation: REDACTED,
    reserveTotal: 80_000, paidTotal: 15_000, sourceFile: REDACTED,
  }),
  mkClaim('recClmMTR4', REDACTED, REDACTED, 'recClsMotor', 'recPolMotor2425', '24/25', '2024/09/12', 'Closed', 60_000, {
    description: REDACTED, lossLocation: REDACTED,
    paidTotal: 60_000, sourceFile: REDACTED,
  }),
  // Historical claim: no policy row exists for this year (resolves by class)
  mkClaim('recClmMTR5', REDACTED, REDACTED, 'recClsMotor', '', '13/14', '2013/07/30', 'Closed', 240_000, {
    description: REDACTED, lossLocation: REDACTED,
    paidTotal: 240_000, excessRecovered: 30_000, sourceFile: REDACTED,
  }),

  // --- EC claims (Reserve_Ind/Exp + Paid_Ind/Exp; no Excess_Recovered / Loss_Location) ---
  mkClaim('recClmEC1', REDACTED, REDACTED, 'recClsEC', 'recPolEC2627', '26/27', '2026/07/08', 'Open', 850_000, {
    claimant: REDACTED, description: REDACTED,
    reserveInd: 600_000, reserveExp: 100_000, reserveTotal: 700_000,
    paidInd: 120_000, paidExp: 30_000, paidTotal: 150_000,
    lastUpdateNote: REDACTED, sourceFile: REDACTED,
  }),
  mkClaim('recClmEC2', REDACTED, REDACTED, 'recClsEC', 'recPolEC2526', '25/26', '2025/06/25', 'Closed', 420_000, {
    claimant: REDACTED, description: REDACTED,
    paidInd: 380_000, paidExp: 40_000, paidTotal: 420_000, sourceFile: REDACTED,
  }),
  mkClaim('recClmEC3', REDACTED, REDACTED, 'recClsEC', 'recPolEC2526', '25/26', '2025/12/01', 'Closed', 200_000, {
    claimant: REDACTED, description: REDACTED,
    paidInd: 170_000, paidExp: 30_000, paidTotal: 200_000, sourceFile: REDACTED,
  }),
  mkClaim('recClmEC4', REDACTED, REDACTED, 'recClsEC', 'recPolEC2425', '24/25', '2024/10/15', 'Closed', 85_000, {
    claimant: REDACTED, description: REDACTED,
    paidInd: 80_000, paidExp: 5_000, paidTotal: 85_000, sourceFile: REDACTED,
  }),
  mkClaim('recClmEC5', REDACTED, REDACTED, 'recClsEC', 'recPolEC2324', '23/24', '2023/08/22', 'Closed', 1_650_000, {
    claimant: REDACTED, description: REDACTED,
    paidInd: 1_500_000, paidExp: 150_000, paidTotal: 1_650_000, sourceFile: REDACTED,
  }),
  // Historical claim: no policy row exists for this year (resolves by class)
  mkClaim('recClmEC6', REDACTED, REDACTED, 'recClsEC', '', '15/16', '2015/09/10', 'Closed', 520_000, {
    claimant: REDACTED, description: REDACTED,
    paidInd: 470_000, paidExp: 50_000, paidTotal: 520_000, sourceFile: REDACTED,
  }),
]

// ---------------------------------------------------------------------------
// Synthetic claim volume for the public demo
//
// The hand-written rows above preserve the structural quirks of the source
// ledger. Real volume (hundreds of claims per ledger class over 15 policy
// years) is reproduced here with a seeded generator so the claims charts look
// like a real programme. Every identifying field is REDACTED; amounts are
// synthetic.
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface ILedgerProfile {
  classRecordId: string
  /** Base claims per policy year; drifts a little year to year */
  perYear: number
  /** Incurred range (HKD) for a typical claim, log-uniform */
  minIncurred: number
  maxIncurred: number
}

const LEDGER_PROFILES: ILedgerProfile[] = [
  { classRecordId: 'recClsEC', perYear: 22, minIncurred: 15_000, maxIncurred: 900_000 },
  { classRecordId: 'recClsPPL', perYear: 9, minIncurred: 8_000, maxIncurred: 600_000 },
  { classRecordId: 'recClsMotor', perYear: 19, minIncurred: 3_000, maxIncurred: 180_000 },
]

/** Policy years 12/13 … 26/27, ascending */
const GENERATED_YEARS: string[] = Array.from({ length: 15 }, (_, i) => {
  const start = 12 + i
  return `${String(start).padStart(2, '0')}/${String(start + 1).padStart(2, '0')}`
})

/** Target total so the hub card ("767 claims") matches the dataset */
const TARGET_TOTAL_CLAIMS = 767

function generateSyntheticClaims(existing: IClaimRecord[]): IClaimRecord[] {
  const rand = mulberry32(20260911)
  const out: IClaimRecord[] = []
  let seq = 0
  for (const year of GENERATED_YEARS) {
    const [yy] = year.split('/')
    const startYear = 2000 + Number(yy)
    for (const profile of LEDGER_PROFILES) {
      const drift = 0.7 + rand() * 0.6
      const count = Math.round(profile.perYear * drift)
      for (let i = 0; i < count; i++) {
        seq++
        // DOL inside the policy period (Apr 1 – Mar 31)
        const dayOffset = Math.floor(rand() * 365)
        const d = new Date(Date.UTC(startYear, 3, 1 + dayOffset))
        const dol = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}`
        const logMin = Math.log(profile.minIncurred)
        const logMax = Math.log(profile.maxIncurred)
        const incurred = Math.round(Math.exp(logMin + rand() * (logMax - logMin)) / 100) * 100
        const age = 2026 - startYear
        const openProb = age <= 0 ? 0.55 : age === 1 ? 0.25 : age === 2 ? 0.08 : 0.01
        const isOpen = rand() < openProb
        const paid = isOpen ? Math.round(incurred * (0.1 + rand() * 0.4)) : incurred
        out.push(
          mkClaim(
            `recClmGen${String(seq).padStart(4, '0')}`,
            REDACTED,
            REDACTED,
            profile.classRecordId,
            '',
            year,
            dol,
            isOpen ? 'Open' : 'Closed',
            incurred,
            {
              claimant: REDACTED,
              description: REDACTED,
              paidTotal: paid,
              reserveTotal: isOpen ? incurred - paid : 0,
              sourceFile: REDACTED,
            }
          )
        )
      }
    }
  }
  const room = Math.max(0, TARGET_TOTAL_CLAIMS - existing.length)
  return out.slice(0, room)
}

MOCK_CLAIMS.push(...generateSyntheticClaims(MOCK_CLAIMS))

