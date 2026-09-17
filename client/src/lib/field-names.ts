// EXPORTS: BASE_APP_TOKEN, TABLE_IDS, CLASS_FIELDS, POLICY_FIELDS, CLAIM_FIELDS

/**
 * Programme Base field name constants — the single source of truth for Bitable column names.
 *
 * ⚠️ These are DESIGN names from the handoff spec. The actual Base may differ in
 * casing/underscores. If a field reads back empty after binding, verify the column
 * name in the Base matches the constant here character-for-character, then update
 * BOTH this file and the corresponding shared/capabilities/*.json entry.
 */

/** Base appToken — demo placeholder (the real tenant token is not shipped with the portfolio demo) */
export const BASE_APP_TOKEN = 'demo-base-token'

/** Table IDs — demo placeholders (real IDs are filled in after binding capabilities in Spark) */
export const TABLE_IDS = {
  /** Insurance_Class (34 rows) — bound via programme_insurance_class_reader_1 */
  CLASS: 'demo-table-class',
  /** Policy_Master (201 rows) — bound via programme_policy_master_reader_1 */
  POLICY: 'demo-table-policy',
  /** Claims_Master (767 rows) — bound via programme_claims_master_reader_1 */
  CLAIMS: 'demo-table-claims',
} as const

/** Insurance_Class table columns */
export const CLASS_FIELDS = {
  CLASS_CODE: 'Class_Code',
  FULL_NAME: 'Full_Name',
  ITEM_NO: 'Item_No',
  BROKER: 'Broker',
  IS_CORE: 'Is_Core',
  HAS_CLAIMS_LEDGER: 'Has_Claims_Ledger',
  CLASS_LEVEL: 'Class_Level',
  CURRENCY: 'Currency',
  PREMIUM_CURRENT_YEAR: 'Premium_Current_Year',
  CLAIMS_COUNT_ROLLUP: 'Claims_Count_Rollup',
  OPEN_CLAIMS_ROLLUP: 'Open_Claims_Rollup',
  TOTAL_INCURRED_ROLLUP: 'Total_Incurred_Rollup',
  /** Summary-only class flag: premium/insurer live at class level, no Policy_Master rows */
  IS_SUMMARY_ONLY: 'Is_Summary_Only',
  /** Hand-entered annualized premium (HKD) for summary-only classes */
  PREMIUM_MANUAL: 'Premium_Manual',
  /** Class-level insurer (summary-only classes; normal classes read it per policy row) */
  INSURER: 'Insurer',
} as const

/** Policy_Master table columns */
export const POLICY_FIELDS = {
  POLICY_ID: 'Policy_ID',
  POLICY_NO: 'Policy_No',
  POLICY_YEAR: 'Policy_Year',
  CLASS: 'Class',
  SUB_POLICY: 'Sub_Policy',
  PERIOD_START: 'Period_Start',
  PERIOD_END: 'Period_End',
  INSURER: 'Insurer',
  BROKER: 'Broker',
  CURRENCY: 'Currency',
  PREMIUM_FULL_TERM: 'Premium_Full_Term',
  PREMIUM_ANNUALIZED_12M: 'Premium_Annualized_12m',
  /** Original-currency premium before HKD conversion (populated for USD/RMB rows) */
  ORIGINAL_AMOUNT: 'Original_Amount',
  IS_PLACEHOLDER: 'Is_Placeholder',
  PDF_POLICY: 'PDF_Policy',
  PDF_ENDORSEMENT: 'PDF_Endorsement',
  PDF_DN_CN: 'PDF_DN_CN',
  CLAIMS_COUNT: 'Claims_Count',
  CLAIMS_INCURRED: 'Claims_Incurred',
  LOSS_RATIO: 'Loss_Ratio',
  REMARKS: 'Remarks',
} as const

/** Claims_Master table columns */
export const CLAIM_FIELDS = {
  CLAIM_ID: 'Claim_ID',
  CLAIM_NO: 'Claim_No',
  CLASS: 'Class',
  POLICY: 'Policy',
  POLICY_YEAR: 'Policy_Year',
  DOL: 'DOL',
  CLAIMANT: 'Claimant',
  DESCRIPTION: 'Description',
  LOSS_LOCATION: 'Loss_Location',
  LEAD_INSURER_REF: 'Lead_Insurer_Ref',
  SEQUENCE_NO: 'Sequence_No',
  CASE_VALUE_IND: 'Case_Value_Ind',
  CASE_VALUE_EXP: 'Case_Value_Exp',
  RESERVE_IND: 'Reserve_Ind',
  RESERVE_EXP: 'Reserve_Exp',
  RESERVE_TOTAL: 'Reserve_Total',
  PAID_TOTAL: 'Paid_Total',
  TOTAL_INCURRED: 'Total_Incurred',
  PAID_IND: 'Paid_Ind',
  PAID_EXP: 'Paid_Exp',
  EXCESS_RECOVERED: 'Excess_Recovered',
  STATUS: 'Status',
  LAST_UPDATE_NOTE: 'Last_Update_Note',
  REMARKS: 'Remarks',
  SOURCE_FILE: 'Source_File',
} as const
