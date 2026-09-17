import type { IPolicyMaster } from '@/data/programme'

// EXPORTS: IInsurerEntry, parseInsurerEntries, insurerNamesFromText, distinctInsurerNames

/** Parsed insurer entry extracted from one token of an Insurer free-text value */
export interface IInsurerEntry {
  /** Insurer name (share expression and parenthetical segments stripped) */
  name: string
  /** Share percentage value (40 for '40%'), null when the token carries no share */
  share: number | null
  /** Layer name parsed from a 'Layer:' colon prefix in the same line ('' when absent) */
  lineLayer: string
  /** Whether the token carries a '(Lead)' / '(Lead Insurer)' marker */
  isLead: boolean
}

/** Extract (name, share, lead flag) from a single token:
 * 'Insurer X — 40% (Lead)' → ('Insurer X', 40, true); 'Insurer Y' → ('Insurer Y', null, false).
 * In the public demo the name token is the REDACTED sentinel; share / lead parsing still applies. */
function extractNameAndShare(token: string): {
  name: string
  share: number | null
  isLead: boolean
} {
  const match = token.match(/(\d+(?:\.\d+)?)\s*%/)
  const share = match ? Number.parseFloat(match[1]) : null
  const leadMatch = token.match(/[（(]\s*lead(\s+insurer)?\s*[）)]/i)
  const isLead = leadMatch !== null
  const name = token
    .replace(/[—–-]?\s*\d+(?:\.\d+)?\s*%/g, '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .trim()
  return { name, share, isLead }
}

/**
 * Parse an Insurer free-text value into entries with name/share/line-layer. Handles
 * the three formats present in the Base: a single name ('Insurer X'); a co-insurance list
 * where each line reads 'Name — Share% (Lead optional)'; and layered text where each
 * line reads 'Layer: Name1, Name2 (in-layer shares optional)'.
 */
export function parseInsurerEntries(text: string): IInsurerEntry[] {
  const entries: IInsurerEntry[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const colonIdx = line.search(/[:：]/)
    const lineLayer = colonIdx >= 0 ? line.slice(0, colonIdx).trim() : ''
    const body = colonIdx >= 0 ? line.slice(colonIdx + 1) : line
    for (const rawToken of body.split(/[,，、;；]/)) {
      const { name, share, isLead } = extractNameAndShare(rawToken)
      if (name) entries.push({ name, share, lineLayer, isLead })
    }
  }
  return entries
}

/** Insurer names contained in one Insurer text value (order preserved) */
export function insurerNamesFromText(text: string): string[] {
  return parseInsurerEntries(text).map((entry) => entry.name)
}

/** Case-insensitively deduplicated insurer names across the given policy rows */
export function distinctInsurerNames(policies: IPolicyMaster[]): string[] {
  const seen = new Map<string, string>()
  for (const policy of policies) {
    for (const name of insurerNamesFromText(policy.insurer)) {
      const key = name.toLowerCase().replace(/\s+/g, ' ')
      if (!seen.has(key)) seen.set(key, name)
    }
  }
  return Array.from(seen.values())
}
