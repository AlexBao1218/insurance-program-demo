import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { IClaimRecord } from '@/data/programme'
import { Redacted } from '@/components/Redacted'
import type { LedgerKind } from './ClaimsTab'

interface ClaimDetailDialogProps {
  claim: IClaimRecord | null
  kind: LedgerKind
  open: boolean
  onOpenChange: (open: boolean) => void
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground break-words">{children}</span>
    </div>
  )
}

/** A field withheld from the public demo — always the Redacted bar, even when empty */
function WithheldRow({ label }: { label: string }) {
  return (
    <FieldRow label={label}>
      <Redacted />
    </FieldRow>
  )
}

/**
 * Full claim record. Public demo: only Status and Policy Year are shown; every
 * identifying, date and monetary field is withheld and rendered as the Redacted bar.
 * The field list still follows the ledger class (PPL / Motor / EC) like production.
 */
export default function ClaimDetailDialog({
  claim,
  kind,
  open,
  onOpenChange,
}: ClaimDetailDialogProps) {
  if (!claim) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Claim Detail
            <Badge
              className={
                claim.status === 'Open'
                  ? 'bg-warning/15 text-warning border-warning/20 hover:bg-warning/20'
                  : 'bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80'
              }
            >
              {claim.status || '-'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Complete claim record — record-level values are withheld in the public demo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <WithheldRow label="Claim No" />
              <WithheldRow label="Claim ID" />
              <FieldRow label="Status">{claim.status || '-'}</FieldRow>
              <FieldRow label="Policy Year">{claim.policyYear || '-'}</FieldRow>
              <WithheldRow label="Date of Loss" />
              <WithheldRow label="Sequence No" />
              <WithheldRow label="Lead Insurer Ref" />
              <WithheldRow label="Source File" />
            </div>
          </div>

          {/* Financials — only fields relevant to this ledger class */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Financials</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <WithheldRow label="Reserve Total" />
              <WithheldRow label="Paid Total" />
              <WithheldRow label="Total Incurred" />
              {kind === 'PPL' && (
                <>
                  <WithheldRow label="Case Value (Ind)" />
                  <WithheldRow label="Case Value (Exp)" />
                  <WithheldRow label="Paid (Ind)" />
                  <WithheldRow label="Paid (Exp)" />
                  <WithheldRow label="Excess Recovered" />
                </>
              )}
              {kind === 'Motor' && <WithheldRow label="Excess Recovered" />}
              {kind === 'EC' && (
                <>
                  <WithheldRow label="Reserve (Ind)" />
                  <WithheldRow label="Reserve (Exp)" />
                  <WithheldRow label="Paid (Ind)" />
                  <WithheldRow label="Paid (Exp)" />
                </>
              )}
            </div>
          </div>

          {/* Other */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Other Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <WithheldRow label="Claimant" />
              {kind !== 'EC' && <WithheldRow label="Loss Location" />}
            </div>
            <WithheldRow label="Description" />
            <WithheldRow label="Last Update Note" />
            <WithheldRow label="Remarks" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
