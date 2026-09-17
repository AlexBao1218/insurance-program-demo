/**
 * Naming and disclosure constants for the public portfolio demo.
 *
 * The original app belonged to a real employer. The public demo uses a
 * neutral programme name, never a company name, and marks anything that
 * cannot be shown with an explicit label instead of inventing a substitute.
 */
export const PROGRAM_NAME = 'Internal Insurance Program'
export const PROGRAM_SHORT = 'Insurance Program'
/** Header fallback where the tenant user's org used to appear */
export const ORG_LABEL = 'Risk Management · Demo'

export const REPORT_TITLE = 'Internal Insurance Report'
export const REPORT_FILE_PREFIX = 'Internal_Insurance_Report'
export const ASSISTANT_TITLE = 'Insurance Consultant'

/** Sentinel stored in the dataset for record-level values that are withheld */
export const REDACTED = '[redacted]'
export const REDACTED_LABEL = 'Redacted for public demo'
export const NOT_AVAILABLE_LABEL = 'Not available in public demo'
export const SYNTHETIC_LABEL = 'Synthetic data'
/** Tooltip on the synthetic badge */
export const SYNTHETIC_HINT = 'Aggregates are synthetic; record-level fields are redacted'
export const isRedacted = (v: unknown): boolean => v === REDACTED
