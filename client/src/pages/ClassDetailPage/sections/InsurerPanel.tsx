import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CURRENT_YEAR, currentYearPolicies } from '@/lib/analytics'
import InsurerStructure from './InsurerStructure'
import type { IClassWithRelations, IPolicyMaster } from '@/data/programme'

interface InsurerPanelProps {
  /** The class being viewed (policy rows + class-level summary-only fields) */
  cls: IClassWithRelations
}

/**
 * Synthetic single-row wrapper so Summary-only classes reuse InsurerStructure's
 * insurer-text parser (shares / layers / Lead marks) without a special renderer.
 */
function summaryInsurerRow(insurer: string): IPolicyMaster {
  return {
    id: '__summary_only__',
    policyId: '',
    policyNo: '',
    policyYear: CURRENT_YEAR,
    classRecordId: '',
    subPolicy: '',
    periodStart: '',
    periodEnd: '',
    insurer,
    broker: '',
    currency: 'HKD',
    premiumFullTerm: 0,
    premiumAnnualized: 0,
    originalAmount: 0,
    isPlaceholder: false,
    pdfPolicy: [],
    pdfEndorsement: [],
    pdfDnCn: [],
    claimsCount: 0,
    claimsIncurred: 0,
    lossRatio: 0,
    remarks: '',
  }
}

export default function InsurerPanel({ cls }: InsurerPanelProps) {
  // Summary-only classes: insurer lives at class level (no policy rows by design)
  const rows = useMemo(() => {
    if (cls.isSummaryOnly) {
      return cls.insurer.trim() ? [summaryInsurerRow(cls.insurer)] : []
    }
    return currentYearPolicies(cls.policies)
  }, [cls])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insurer</CardTitle>
        <CardDescription>
          Underwriting structure — {CURRENT_YEAR}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InsurerStructure
          rows={rows}
          emptyText={`No insurer information for ${CURRENT_YEAR}`}
        />
      </CardContent>
    </Card>
  )
}
