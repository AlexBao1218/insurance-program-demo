const CASE_STUDY_URL = 'https://zijun.cloud/en/projects/insurance-program'

/**
 * Compact, non-dismissible disclosure line at the bottom of every page.
 *
 * Required by the disclosure policy (PROJECT.md Part 2 / DELIVERY.md §8): the
 * demo must state on every page that the figures are synthetic and that the AI
 * features are simulated. It sits at the bottom rather than the top so the app
 * can be embedded in an iframe without a notice strip eating the fold.
 */
export default function DemoFooter() {
  return (
    <footer
      role="contentinfo"
      className="flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-border px-3 py-2 text-xs text-muted-foreground"
    >
      <span>Portfolio demo · synthetic data · AI features simulated</span>
      <a
        href={CASE_STUDY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-foreground"
      >
        How it was built →
      </a>
    </footer>
  )
}
