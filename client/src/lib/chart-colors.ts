/**
 * ECharts chart color constants (hex format)
 * Corresponds to --chart-1 ~ --chart-5 in src/tailwind-theme.css
 * Chart libraries do not parse CSS variables — hex literals required
 */
export const CHART_COLORS = [
  '#226CD2', // chart-1: hsl(215 72% 48%)
  '#3122D2', // chart-2: hsl(245 72% 48%)
  '#8922D2', // chart-3: hsl(275 72% 48%)
  '#D222C3', // chart-4: hsl(305 72% 48%)
  '#D22269', // chart-5: hsl(335 72% 48%)
] as const

/**
 * Categorical palette for the premium donuts: 8 well-separated hues so no two
 * slices read as near-duplicates (only a single blue). A class is bound to a
 * colour via its stable total-premium rank, so it keeps the same hue across years.
 */
export const CATEGORY_COLORS = [
  '#2563EB', // blue
  '#F97316', // orange
  '#16A34A', // green
  '#DC2626', // red
  '#7C3AED', // violet
  '#0D9488', // teal
  '#DB2777', // magenta
  '#CA8A04', // gold
] as const

/** Neutral grey for the folded "Others" slice and unknown brokers */
export const OTHERS_COLOR = '#9CA3AF'

/**
 * Colour slot for the class at `rank` in a stable importance ordering. The dominant
 * classes (first six) each get a unique hue; every remaining class alternates over
 * the last two hues — at most one of those is a visible slice at a time, so they
 * never collide with the dominant group.
 */
export function rankedCategoryColor(rank: number): string {
  const tail = CATEGORY_COLORS.length - 2
  if (rank < tail) return CATEGORY_COLORS[rank] as string
  return CATEGORY_COLORS[tail + ((rank - tail) % 2)] as string
}

/** Map names (already sorted by stable importance, desc) to colours. */
export function buildRankedColorMap(orderedNames: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  orderedNames.forEach((name, i) => {
    if (!(name in map)) map[name] = rankedCategoryColor(i)
  })
  return map
}
