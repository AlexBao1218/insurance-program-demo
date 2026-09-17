import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { logger } from '@lark-apaas/client-toolkit'
import { ArrowLeft, RefreshCw, Database, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PoliciesTab from './sections/PoliciesTab'
import ClaimsTab from './sections/ClaimsTab'
import InsurerPanel from './sections/InsurerPanel'
import { loadProgrammeData } from '@/lib/data-source'
import { Redacted } from '@/components/Redacted'
import { NOT_AVAILABLE_LABEL } from '@/lib/brand'
import { CURRENT_YEAR } from '@/lib/analytics'
import type { IClassWithRelations } from '@/data/programme'

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const [cls, setCls] = useState<IClassWithRelations | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!classId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const result = await loadProgrammeData()
      const found = result.classes.find((c) => c.id === classId)
      setCls(found ?? null)
      if (!found) logger.warn(`Insurance class not found: ${classId}`)
    } finally {
      setLoading(false)
    }
  }, [classId])

  // Public demo: no Bitable tenant is bound, so Sync only explains itself
  const syncData = useCallback(() => {
    toast.info(NOT_AVAILABLE_LABEL, { description: 'Bitable sync' })
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])


  if (!cls && !loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border/40 bg-muted/30 px-6 py-16">
        <Database className="size-10 text-muted-foreground/50 mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-1">No Data</h2>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          This insurance class is not part of the demo dataset
        </p>
        <Button onClick={syncData} variant="outline" className="gap-2 max-md:h-11">
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Synchronize
        </Button>
      </div>
    )
  }

  if (!cls) return null

  // Premium and loss ratio are withheld in the public demo for every class; the
  // chips keep their place so the layout matches the production page.
  const chips: { label: string; value: string | null }[] = [
    { label: `Premium ${CURRENT_YEAR}`, value: null },
    { label: `Loss Ratio ${CURRENT_YEAR}`, value: null },
    { label: 'Claims', value: null },
    { label: 'Open Claims', value: null },
  ]

  return (
    <div className="space-y-6">
      {/* Top: back arrow on its own row, title (raw Full_Name) on its own row below */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="-ml-2 h-11 w-11 md:h-9 md:w-9"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-foreground break-words">
            {cls.fullName}
          </h1>
          <div className="mt-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-4 shrink-0" />
              Broker: <Redacted short />
            </span>
          </div>
        </div>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {chips.map((chip) => (
          <Card key={chip.label} className="p-4">
            <p className="text-xs text-muted-foreground">{chip.label}</p>
            <p className="text-lg font-bold tabular-nums text-foreground truncate leading-7">
              {chip.value === null ? <Redacted short /> : chip.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Insurer panel: current-year underwriting structure */}
      <InsurerPanel cls={cls} />

      {/* Tab switcher */}
      <Tabs defaultValue="policies">
        <TabsList>
          <TabsTrigger value="policies" className="max-md:min-h-11">
            Policies
          </TabsTrigger>
          <TabsTrigger value="claims" className="max-md:min-h-11">
            Claims
          </TabsTrigger>
        </TabsList>
        <TabsContent value="policies" className="mt-4">
          <PoliciesTab policies={cls.policies} />
        </TabsContent>
        <TabsContent value="claims" className="mt-4">
          <ClaimsTab cls={cls} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
