import { useState, useEffect, useCallback, useMemo } from 'react'
import { logger } from '@lark-apaas/client-toolkit'
import { BarChart3, ChevronRight, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import PremiumByClassSection from './sections/PremiumByClassSection'
import PremiumByBrokerSection from './sections/PremiumByBrokerSection'
import PremiumTrendSection from './sections/PremiumTrendSection'
import ClaimsByYearSection from './sections/ClaimsByYearSection'
import IncurredByClassSection from './sections/IncurredByClassSection'
import LossRatioTableSection from './sections/LossRatioTableSection'
import { loadProgrammeData } from '@/lib/data-source'
import {
  POLICY_YEARS,
  CURRENT_YEAR,
  validateBaselines,
  type PolicyYear,
} from '@/lib/analytics'
import { DATA_PERIOD } from '@/lib/data-period'
import type { IClassWithRelations } from '@/data/programme'
import ExportReportDialog, {
  type IReportResult,
} from './report/ExportReportDialog'
import ReportPreview from './report/ReportPreview'

export default function DashboardPage() {
  const [classes, setClasses] = useState<IClassWithRelations[]>([])
  const [loading, setLoading] = useState(false)

  // --- Premium area shared year slicer ---
  const [premiumYear, setPremiumYear] = useState<PolicyYear>(CURRENT_YEAR)

  // --- Claims area year slicer ---
  const [claimsYear, setClaimsYear] = useState('all')

  const claimsYears = useMemo(() => {
    const yearSet = new Set<string>()
    for (const c of classes) {
      for (const claim of c.claims) {
        if (claim.policyYear) yearSet.add(claim.policyYear)
      }
    }
    return Array.from(yearSet).sort()
  }, [classes])

  const claimsFilteredClasses = useMemo(() => {
    if (claimsYear === 'all') return classes
    return classes.map((c) => ({
      ...c,
      claims: c.claims.filter((claim) => claim.policyYear === claimsYear),
    }))
  }, [classes, claimsYear])

  // 板块展开/收起状态（默认展开，桌面与移动端一致）
  const [premiumOpen, setPremiumOpen] = useState(true)
  const [claimsOpen, setClaimsOpen] = useState(true)

  // --- Export report ---
  const [exportOpen, setExportOpen] = useState(false)
  const [reportResult, setReportResult] = useState<IReportResult | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    // loadProgrammeData never throws: localStorage cache → Bitable → mock fallback
    const result = await loadProgrammeData()
    setClasses(result.classes)
    logger.info(
      `[Dashboard] Loaded ${result.classes.length} insurance classes (source: ${result.dataSource})`
    )
    validateBaselines(result.classes)
    setLoading(false)
  }, [])


  useEffect(() => {
    loadData()
  }, [loadData])

  const hasData = classes.some((c) => c.policies.length > 0 || c.claims.length > 0)

  if (reportResult) {
    return (
      <ReportPreview
        result={reportResult}
        classes={classes}
        year={premiumYear}
        caliber={reportResult.caliber}
        onBack={() => setReportResult(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Page title + actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {DATA_PERIOD}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">

          <Button
            size="sm"
            onClick={() => setExportOpen(true)}
            disabled={!hasData || loading}
            className="gap-1.5 max-md:h-11"
            style={{ background: '#1E6BB8', color: '#fff' }}
          >
            <FileDown className="size-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Loading / empty / content */}
      {loading && classes.length === 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[380px] rounded-xl" />
            ))}
          </div>
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/40 bg-muted/30 px-6 py-16">
          <BarChart3 className="size-10 text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">No Business Data</h2>
          <p className="text-sm text-muted-foreground text-center">
            Please go to Data Management to sync Bitable data
          </p>
        </div>
      ) : (
        <>
          {/* Premium analysis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPremiumOpen((v) => !v)}
                aria-expanded={premiumOpen}
className="flex items-center gap-2 text-[20px] font-semibold text-foreground hover:text-primary transition-colors max-md:-mx-2 max-md:min-h-11 max-md:px-2"
                >
                  <ChevronRight
                    className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      premiumOpen ? 'rotate-90' : ''
                    }`}
                  />
                  Premium Analysis
              </button>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-[13px] text-[#86868b] hidden sm:inline">Policy Year</span>
                <Select
                  value={premiumYear}
                  onValueChange={(v) => setPremiumYear(v as PolicyYear)}
                >
                  <SelectTrigger className="w-[120px] h-8 text-[13px] font-medium bg-white border-[rgba(0_0_0_0.08)] rounded-lg max-md:h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POLICY_YEARS.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {premiumOpen && (
              <>
                <PremiumByClassSection classes={classes} year={premiumYear} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PremiumByBrokerSection classes={classes} year={premiumYear} />
                  <PremiumTrendSection classes={classes} />
                </div>
              </>
            )}
          </div>

          {/* Claims analysis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setClaimsOpen((v) => !v)}
                aria-expanded={claimsOpen}
className="flex items-center gap-2 text-[20px] font-semibold text-foreground hover:text-primary transition-colors max-md:-mx-2 max-md:min-h-11 max-md:px-2"
                >
                  <ChevronRight
                    className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      claimsOpen ? 'rotate-90' : ''
                    }`}
                  />
                  Claims Analysis
              </button>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-[13px] text-[#86868b] hidden sm:inline">Claim Year</span>
                <Select
                  value={claimsYear}
                  onValueChange={setClaimsYear}
                >
                  <SelectTrigger className="w-[120px] h-8 text-[13px] font-medium bg-white border-[rgba(0_0_0_0.08)] rounded-lg max-md:h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {claimsYears.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {claimsOpen && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ClaimsByYearSection classes={claimsFilteredClasses} />
                  <IncurredByClassSection classes={claimsFilteredClasses} />
                </div>
                <LossRatioTableSection classes={claimsFilteredClasses} />
              </>
            )}
          </div>
        </>
      )}

      <ExportReportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        classes={classes}
        onGenerated={(result) => {
          setReportResult(result)
          setExportOpen(false)
        }}
      />
    </div>
  )
}
