import { useState, useEffect, useCallback } from 'react'
import { logger } from '@lark-apaas/client-toolkit'
import { toast } from 'sonner'
import { RefreshCw, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ClassTableSection from './sections/ClassTableSection'
import { loadProgrammeData } from '@/lib/data-source'
import { DATA_PERIOD } from '@/lib/data-period'
import { NOT_AVAILABLE_LABEL } from '@/lib/brand'
import type { IClassWithRelations } from '@/data/programme'

export default function DataManagePage() {
  const [classes, setClasses] = useState<IClassWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await loadProgrammeData()
      setClasses(result.classes)
      logger.info(`Loaded ${result.classes.length} insurance classes (${result.dataSource})`)
    } finally {
      setLoading(false)
    }
  }, [])

  // Public demo: no Bitable tenant is bound, so Sync only explains itself
  const syncData = useCallback(() => {
    toast.info(NOT_AVAILABLE_LABEL, { description: 'Bitable sync' })
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="space-y-6">
      {/* Page title — the data cutoff is month-level; no sync timestamp in the public demo */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-foreground">
            Insurance Classes
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{DATA_PERIOD}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={syncData}
            disabled={loading}
            className="gap-1.5 max-md:h-11"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Data
          </Button>
        </div>
      </div>

      {!loading && classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/40 bg-muted/30 px-6 py-16">
          <Database className="size-10 text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">No Data</h2>
          <p className="text-sm text-muted-foreground text-center">
            No insurance classes loaded
          </p>
        </div>
      ) : (
        <ClassTableSection classes={classes} loading={loading} />
      )}
    </div>
  )
}
