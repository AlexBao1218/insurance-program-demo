import { capabilityClient, logger } from '@lark-apaas/client-toolkit'
import type {
  IAttachmentFile,
  IInsuranceClass,
  IPolicyMaster,
  IClaimRecord,
  IClassWithRelations,
} from '@/data/programme'
import { MOCK_CLASSES, MOCK_POLICIES, MOCK_CLAIMS } from '@/data/programme'
import {
  CLASS_FIELDS,
  POLICY_FIELDS,
  CLAIM_FIELDS,
} from '@/lib/field-names'

// --- Plugin instance IDs (must match shared/capabilities/<id>.json) ---
const PLUGIN_CLASSES = 'programme_insurance_class_reader_1'
const PLUGIN_POLICY = 'programme_policy_master_reader_1'
const PLUGIN_CLAIMS = 'programme_claims_master_reader_1'

// Bitable deep links (record / attachment URLs) are intentionally absent from the public
// demo: "View in Bitable" and attachment chips render disabled with NOT_AVAILABLE_LABEL.

// --- localStorage persistent storage ---
const STORAGE_KEY = 'demo_programme_data'
/** Bump to force a fresh Bitable fetch when the plugin's field set changes */
const STORAGE_VERSION_KEY = 'demo_programme_data_v'
const STORAGE_VERSION = '3'
const SYNC_TIME_KEY = 'demo_programme_data_sync_time'

/** Save sync timestamp */
function saveSyncTime(): void {
  localStorage.setItem(SYNC_TIME_KEY, String(Date.now()))
}

/** Read last sync timestamp (ms), returns null if not synced */
export function getLastSyncTime(): number | null {
  const raw = localStorage.getItem(SYNC_TIME_KEY)
  if (!raw) return null
  const ts = Number(raw)
  return Number.isFinite(ts) ? ts : null
}

/** Read imported data from localStorage */
export function getLocalData(): IClassWithRelations[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as IClassWithRelations[]
    if (!Array.isArray(data)) return null
    // Basic validation: ensure first record has classCode field (backward compatible)
    if (data.length > 0 && !data[0].classCode) return null
    // Schema guard: caches written before Summary-only support lack the class-level
    // keys — treat them as stale so a fresh Bitable fetch repopulates them
    if (data.length > 0 && !('isSummaryOnly' in data[0])) return null
    // Schema guard: caches written before Original_Amount support lack the key on
    // policy rows — treat them as stale so a fresh Bitable fetch repopulates it
    const firstWithPolicies = data.find((c) => c.policies && c.policies.length > 0)
    if (firstWithPolicies && !('originalAmount' in firstWithPolicies.policies[0])) {
      return null
    }
    // Version guard: caches written before the plugin returned Summary-only fields
    // (Is_Summary_Only / Premium_Manual / Insurer) carry them as default values and
    // pass the key-presence guards above, so compare against the current version
    if (localStorage.getItem(STORAGE_VERSION_KEY) !== STORAGE_VERSION) return null
    return data
  } catch {
    logger.warn('[data-source] Failed to parse localStorage data, clearing')
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

/** Write data to localStorage */
export function saveLocalData(classes: IClassWithRelations[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classes))
    localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION)
    saveSyncTime()
    logger.info(`[data-source] Saved ${classes.length} classes to localStorage`)
  } catch (err) {
    logger.error('[data-source] Failed to save to localStorage:', String(err))
  }
}

/** Check if localStorage has imported data */
export function hasLocalData(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null
}

/** Data source identifier: local = synced from Bitable, mock = preview fallback */
export type DataSource = 'local' | 'mock'

/** loadProgrammeData / importFromBitable return result */
export interface FetchClassResult {
  classes: IClassWithRelations[]
  dataSource: DataSource
}

// --- Bitable raw records ---

interface RawBitableRecord {
  id: string
  record: Record<string, unknown>
}

interface SearchRecordsResponse {
  hasMore: boolean
  pageToken?: string
  total?: number
  records: RawBitableRecord[]
}

/** Paginated fetch of all records from a single table */
async function fetchTableData(pluginId: string): Promise<RawBitableRecord[]> {
  const all: RawBitableRecord[] = []
  let pageToken: string | undefined
  let hasMore = true

  while (hasMore) {
    const response = await capabilityClient
      .load(pluginId)
      .call<SearchRecordsResponse>('searchRecords', {
        pageSize: 500,
        ...(pageToken ? { pageToken } : {}),
      })

    if (response.records && Array.isArray(response.records)) {
      all.push(...response.records)
    }
    hasMore = response.hasMore
    pageToken = response.pageToken
  }

  if (all.length > 0) {
    const fieldKeys = Object.keys(all[0].record)
    logger.info(`[${pluginId}] Returned ${all.length} records, field count: ${fieldKeys.length}`)
  }

  return all
}

// --- Common field value extractors ---

/** Extract text value */
export function extractText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) {
    if (value.length === 0) return ''
    return value
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>
          if ('text' in obj) return String(obj.text)
          if ('name' in obj) return String(obj.name)
        }
        return ''
      })
      .filter(Boolean)
      .join(', ')
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if ('text' in obj) return String(obj.text)
    if ('name' in obj) return String(obj.name)
  }
  return String(value)
}

/** Extract numeric value */
export function extractNumber(value: unknown): number {
  if (value == null) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim()
    const n = Number(cleaned)
    return isNaN(n) ? 0 : n
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0]
    if (typeof first === 'number') return first
    if (first && typeof first === 'object' && 'text' in first) {
      const n = Number((first as Record<string, unknown>).text)
      return isNaN(n) ? 0 : n
    }
  }
  // Handle Bitable nested object format: {"text": "5"} / {"value": 5}
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if ('text' in obj) return extractNumber(obj.text)
    if ('value' in obj) return extractNumber(obj.value)
  }
  return 0
}

/** Extract checkbox value */
export function extractCheckbox(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    return ['true', 'yes', 'y', '1', 'checked'].includes(value.trim().toLowerCase())
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if ('value' in obj) return extractCheckbox(obj.value)
    if ('text' in obj) return extractCheckbox(obj.text)
  }
  return false
}

/** Millisecond timestamp → yyyy/MM/dd */
export function formatDate(ms: number): string {
  if (!ms) return ''
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

/** Extract date (yyyy/MM/dd), supports timestamps, strings, and Bitable objects */
export function extractDate(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'number') return formatDate(value)
  if (typeof value === 'string') {
    const d = new Date(value)
    if (!isNaN(d.getTime())) return formatDate(d.getTime())
    return value
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0]
    if (typeof first === 'number') return formatDate(first)
    if (first && typeof first === 'object' && 'text' in first) {
      const text = String((first as Record<string, unknown>).text)
      const d = new Date(text)
      if (!isNaN(d.getTime())) return formatDate(d.getTime())
      return text
    }
  }
  // Handle Bitable DateTime nested object format: {"text": "2026-12-31"} / {"value": 1735689600000}
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if ('text' in obj) return extractDate(obj.text)
    if ('value' in obj) return extractDate(obj.value)
  }
  return extractText(value)
}

/** Number → thousands separator formatting */
export function formatCurrency(num: number): string {
  if (num == null || isNaN(num)) return '-'
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/** Extract record_id array from link field */
export function extractLinkIds(value: unknown): string[] {
  if (value == null) return []
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>
          if ('id' in obj) return String(obj.id)
          if ('record_id' in obj) return String(obj.record_id)
        }
        return ''
      })
      .filter(Boolean)
  }
  // Handle Bitable DuplexLink field format: {"link_record_ids": ["id1", "id2"]}
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if ('link_record_ids' in obj && Array.isArray(obj.link_record_ids)) {
      return (obj.link_record_ids as unknown[])
        .map((item) => (typeof item === 'string' ? item : ''))
        .filter(Boolean)
    }
    if ('id' in obj) return [String(obj.id)]
    if ('record_id' in obj) return [String(obj.record_id)]
  }
  return []
}

/** Extract attachment file list */
export function extractFiles(value: unknown): IAttachmentFile[] {
  if (value == null) return []
  if (Array.isArray(value)) {
    return value
      .map((item): IAttachmentFile | null => {
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>
          const name = String(obj.name ?? obj.file_name ?? '')
          const fileToken = String(obj.file_token ?? obj.token ?? '')
          // Scan various Bitable attachment URL field names (platform returns camelCase tmpUrl)
          const directUrl =
            (typeof obj.tmpUrl === 'string' && obj.tmpUrl) ||
            (typeof obj.tmp_url === 'string' && obj.tmp_url) ||
            (typeof obj.url === 'string' && obj.url) ||
            (typeof obj.download_url === 'string' && obj.download_url) ||
            (typeof obj.file_url === 'string' && obj.file_url) ||
            (typeof obj.src === 'string' && obj.src) ||
            undefined
          // Only assign when API returns a valid direct link, skip invalid /file/{token} paths
          const fileUrl = directUrl || undefined
          if (name || fileToken) return { name, fileToken, fileUrl }
        }
        return null
      })
      .filter((v): v is IAttachmentFile => v !== null)
  }
  return []
}

// --- Bitable record parsing functions ---

/** Parse insurance class record (Bitable raw → IInsuranceClass) */
function parseClass(raw: RawBitableRecord): IInsuranceClass {
  const r = raw.record
  return {
    id: raw.id,
    classCode: extractText(r[CLASS_FIELDS.CLASS_CODE]),
    fullName: extractText(r[CLASS_FIELDS.FULL_NAME]),
    itemNo: extractNumber(r[CLASS_FIELDS.ITEM_NO]),
    broker: extractText(r[CLASS_FIELDS.BROKER]),
    isCore: extractCheckbox(r[CLASS_FIELDS.IS_CORE]),
    hasClaimsLedger: extractCheckbox(r[CLASS_FIELDS.HAS_CLAIMS_LEDGER]),
    classLevel: extractText(r[CLASS_FIELDS.CLASS_LEVEL]),
    currency: extractText(r[CLASS_FIELDS.CURRENCY]),
    premiumCurrentYear: extractNumber(r[CLASS_FIELDS.PREMIUM_CURRENT_YEAR]),
    claimsCountRollup: extractNumber(r[CLASS_FIELDS.CLAIMS_COUNT_ROLLUP]),
    openClaimsRollup: extractNumber(r[CLASS_FIELDS.OPEN_CLAIMS_ROLLUP]),
    totalIncurredRollup: extractNumber(r[CLASS_FIELDS.TOTAL_INCURRED_ROLLUP]),
    isSummaryOnly: extractCheckbox(r[CLASS_FIELDS.IS_SUMMARY_ONLY]),
    premiumManual: extractNumber(r[CLASS_FIELDS.PREMIUM_MANUAL]),
    insurer: extractText(r[CLASS_FIELDS.INSURER]),
  }
}

/** Parse policy master record (Bitable raw → IPolicyMaster) */
function parsePolicy(raw: RawBitableRecord): IPolicyMaster {
  const r = raw.record
  return {
    id: raw.id,
    policyId: extractText(r[POLICY_FIELDS.POLICY_ID]),
    policyNo: extractText(r[POLICY_FIELDS.POLICY_NO]),
    policyYear: extractText(r[POLICY_FIELDS.POLICY_YEAR]),
    classRecordId: extractLinkIds(r[POLICY_FIELDS.CLASS])[0] ?? '',
    subPolicy: extractText(r[POLICY_FIELDS.SUB_POLICY]),
    periodStart: extractDate(r[POLICY_FIELDS.PERIOD_START]),
    periodEnd: extractDate(r[POLICY_FIELDS.PERIOD_END]),
    insurer: extractText(r[POLICY_FIELDS.INSURER]),
    broker: extractText(r[POLICY_FIELDS.BROKER]),
    currency: extractText(r[POLICY_FIELDS.CURRENCY]),
    premiumFullTerm: extractNumber(r[POLICY_FIELDS.PREMIUM_FULL_TERM]),
    premiumAnnualized: extractNumber(r[POLICY_FIELDS.PREMIUM_ANNUALIZED_12M]),
    originalAmount: extractNumber(r[POLICY_FIELDS.ORIGINAL_AMOUNT]),
    isPlaceholder: extractCheckbox(r[POLICY_FIELDS.IS_PLACEHOLDER]),
    pdfPolicy: extractFiles(r[POLICY_FIELDS.PDF_POLICY]),
    pdfEndorsement: extractFiles(r[POLICY_FIELDS.PDF_ENDORSEMENT]),
    pdfDnCn: extractFiles(r[POLICY_FIELDS.PDF_DN_CN]),
    claimsCount: extractNumber(r[POLICY_FIELDS.CLAIMS_COUNT]),
    claimsIncurred: extractNumber(r[POLICY_FIELDS.CLAIMS_INCURRED]),
    lossRatio: extractNumber(r[POLICY_FIELDS.LOSS_RATIO]),
    remarks: extractText(r[POLICY_FIELDS.REMARKS]),
  }
}

/** Parse claim record (Bitable raw → IClaimRecord) */
function parseClaim(raw: RawBitableRecord): IClaimRecord {
  const r = raw.record
  return {
    id: raw.id,
    claimId: extractText(r[CLAIM_FIELDS.CLAIM_ID]),
    claimNo: extractText(r[CLAIM_FIELDS.CLAIM_NO]),
    classRecordId: extractLinkIds(r[CLAIM_FIELDS.CLASS])[0] ?? '',
    policyRecordId: extractLinkIds(r[CLAIM_FIELDS.POLICY])[0] ?? '',
    policyYear: extractText(r[CLAIM_FIELDS.POLICY_YEAR]),
    dol: extractDate(r[CLAIM_FIELDS.DOL]),
    claimant: extractText(r[CLAIM_FIELDS.CLAIMANT]),
    description: extractText(r[CLAIM_FIELDS.DESCRIPTION]),
    lossLocation: extractText(r[CLAIM_FIELDS.LOSS_LOCATION]),
    leadInsurerRef: extractText(r[CLAIM_FIELDS.LEAD_INSURER_REF]),
    sequenceNo: extractText(r[CLAIM_FIELDS.SEQUENCE_NO]),
    caseValueInd: extractNumber(r[CLAIM_FIELDS.CASE_VALUE_IND]),
    caseValueExp: extractNumber(r[CLAIM_FIELDS.CASE_VALUE_EXP]),
    reserveInd: extractNumber(r[CLAIM_FIELDS.RESERVE_IND]),
    reserveExp: extractNumber(r[CLAIM_FIELDS.RESERVE_EXP]),
    reserveTotal: extractNumber(r[CLAIM_FIELDS.RESERVE_TOTAL]),
    paidTotal: extractNumber(r[CLAIM_FIELDS.PAID_TOTAL]),
    totalIncurred: extractNumber(r[CLAIM_FIELDS.TOTAL_INCURRED]),
    paidInd: extractNumber(r[CLAIM_FIELDS.PAID_IND]),
    paidExp: extractNumber(r[CLAIM_FIELDS.PAID_EXP]),
    excessRecovered: extractNumber(r[CLAIM_FIELDS.EXCESS_RECOVERED]),
    status: extractText(r[CLAIM_FIELDS.STATUS]),
    lastUpdateNote: extractText(r[CLAIM_FIELDS.LAST_UPDATE_NOTE]),
    remarks: extractText(r[CLAIM_FIELDS.REMARKS]),
    sourceFile: extractText(r[CLAIM_FIELDS.SOURCE_FILE]),
  }
}

// --- Join builder ---

/** Build 3-table association mapping */
export function buildClassData(
  classes: IInsuranceClass[],
  policies: IPolicyMaster[],
  claims: IClaimRecord[]
): IClassWithRelations[] {
  // classRecordId → policies[]
  const policyMap = new Map<string, IPolicyMaster[]>()
  // policy record_id → classRecordId (for claims whose Class link is missing)
  const policyClassMap = new Map<string, string>()
  for (const p of policies) {
    policyClassMap.set(p.id, p.classRecordId)
    if (p.classRecordId) {
      const arr = policyMap.get(p.classRecordId) ?? []
      arr.push(p)
      policyMap.set(p.classRecordId, arr)
    }
  }

  // classRecordId → claims[] (falls back to resolving class via the bound policy)
  const claimMap = new Map<string, IClaimRecord[]>()
  for (const c of claims) {
    const classId = c.classRecordId || policyClassMap.get(c.policyRecordId) || ''
    if (classId) {
      const arr = claimMap.get(classId) ?? []
      arr.push(c)
      claimMap.set(classId, arr)
    }
  }

  return classes.map((cls) => ({
    ...cls,
    policies: policyMap.get(cls.id) ?? [],
    claims: claimMap.get(cls.id) ?? [],
  }))
}

/** Build the synthetic dataset (fallback when the Bitable capability is unavailable — always the case in the public demo) */
export function getMockData(): IClassWithRelations[] {
  return buildClassData(MOCK_CLASSES, MOCK_POLICIES, MOCK_CLAIMS)
}

// --- Bitable fetch orchestration ---

/** Fetch 3-table data from Bitable in real-time and build associations */
async function fetchFromBitable(): Promise<IClassWithRelations[]> {
  logger.info('[data-source] Fetching programme data from Bitable (3 tables)...')

  const [classRaws, policyRaws, claimRaws] = await Promise.all([
    fetchTableData(PLUGIN_CLASSES),
    fetchTableData(PLUGIN_POLICY),
    fetchTableData(PLUGIN_CLAIMS),
  ])

  logger.info(
    `[data-source] Bitable fetched: ${classRaws.length} classes, ${policyRaws.length} policies, ${claimRaws.length} claims`
  )

  if (classRaws.length === 0) {
    throw new Error('Bitable returned 0 insurance class records')
  }

  // Check if record has field data (record is {} when plugin fields config is empty)
  if (Object.keys(classRaws[0].record).length === 0) {
    throw new Error('Bitable class records have empty fields (plugin fields config may be empty)')
  }

  // Diagnostic: policy year distribution (verifies Policy_Year field mapping)
  if (policyRaws.length > 0) {
    const yearCounts = new Map<string, number>()
    for (const p of policyRaws) {
      const yearVal = extractText(p.record[POLICY_FIELDS.POLICY_YEAR])
      const key = yearVal || '(empty)'
      yearCounts.set(key, (yearCounts.get(key) ?? 0) + 1)
    }
    const yearSummary = Array.from(yearCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([y, c]) => `${y}: ${c}`)
      .join(', ')
    logger.info(`[data-source] Policy year distribution: ${yearSummary}`)
  }

  const classes = classRaws.map(parseClass)
  const policies = policyRaws.map(parsePolicy)
  const claims = claimRaws.map(parseClaim)

  return buildClassData(classes, policies, claims)
}

/**
 * Import data from Bitable and save to localStorage (called by the Sync button
 * and by loadProgrammeData on first visit). Throws when the capability is unavailable.
 */
export async function importFromBitable(): Promise<FetchClassResult> {
  logger.info('[data-source] Importing data from Bitable...')

  const classes = await fetchFromBitable()
  if (classes.length === 0 || !classes.some((c) => c.classCode)) {
    throw new Error('Bitable returned 0 valid insurance class records')
  }

  logger.info(`[data-source] Imported ${classes.length} classes from Bitable`)
  saveLocalData(classes)

  return { classes, dataSource: 'local' }
}

/**
 * Load data for page mount: localStorage cache → Bitable capability → mock fallback.
 * Never throws — when the capability is unavailable (e.g. previewing outside Spark
 * or before Base binding), returns mock data with dataSource 'mock' so all pages
 * still render.
 */
export async function loadProgrammeData(): Promise<FetchClassResult> {
  const localData = getLocalData()
  if (localData) {
    logger.info(`[data-source] Loaded ${localData.length} classes from localStorage`)
    return { classes: localData, dataSource: 'local' }
  }

  try {
    return await importFromBitable()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.warn(`[data-source] Bitable unavailable, falling back to mock data: ${msg}`)
    return { classes: getMockData(), dataSource: 'mock' }
  }
}
