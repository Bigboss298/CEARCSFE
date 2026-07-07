import type { AlertDetailsResponse, AlertResponse } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SingleAlertMap } from '@/features/alerts/components/AlertMap'
import {
  formatDateTime,
  getAlertStatusLabel,
  getAlertStatusVariant,
  getAlertTypeLabel,
} from '@/utils/alert-theme'
import { buildGoogleMapsUrl } from '@/utils/maps'
import { AlertStatus } from '@/types/enums/alert-status'
import {
  useAcknowledgeAlertMutation,
  useBroadcastAlertMutation,
  useCloseAlertMutation,
  useResolveAlertMutation,
  getMutationErrorMessage,
} from '@/api/hooks'
import { useState } from 'react'

interface AlertDetailSheetProps {
  alert: AlertResponse | AlertDetailsResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
  reporters?: AlertDetailsResponse['reporters']
}

export function AlertDetailSheet({ alert, open, onOpenChange, reporters }: AlertDetailSheetProps) {
  const acknowledge = useAcknowledgeAlertMutation()
  const broadcast = useBroadcastAlertMutation()
  const resolve = useResolveAlertMutation()
  const close = useCloseAlertMutation()
  const [actionError, setActionError] = useState<string | null>(null)

  if (!alert) return null

  const canAcknowledge = alert.alertStatus === AlertStatus.Pending
  const canBroadcast =
    alert.alertStatus === AlertStatus.Pending ||
    alert.alertStatus === AlertStatus.Acknowledged ||
    alert.alertStatus === AlertStatus.AutoEscalated ||
    alert.alertStatus === AlertStatus.Broadcasted
  const canResolve =
    alert.alertStatus !== AlertStatus.Resolved && alert.alertStatus !== AlertStatus.Closed
  const canClose = alert.alertStatus === AlertStatus.Resolved

  async function runAction(action: () => Promise<unknown>) {
    setActionError(null)
    try {
      await action()
    } catch (error) {
      setActionError(getMutationErrorMessage(error, 'Action failed.'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl font-bold">Emergency Alert Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* ── Cohesive map section ── */}
          <SingleAlertMap
            latitude={alert.latitude}
            longitude={alert.longitude}
            alertType={alert.alertType}
            height="260px"
            className="w-full"
          />

          {/* ── Alert information section ── */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={getAlertStatusVariant(alert.alertStatus)}>{getAlertStatusLabel(alert.alertStatus)}</Badge>
              <Badge
                variant={
                  getAlertTypeLabel(alert.alertType) === 'Fire'
                    ? 'fire'
                    : getAlertTypeLabel(alert.alertType) === 'Medical'
                      ? 'medical'
                      : 'security'
                }
              >
                {getAlertTypeLabel(alert.alertType)}
              </Badge>
            </div>

            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Reporter:</span> {alert.studentFullName}
              </p>
              <p>
                <span className="font-medium">Confidence:</span> {alert.confidenceScore.toFixed(1)}
              </p>
              <p>
                <span className="font-medium">Created:</span> {formatDateTime(alert.createdAt)}
              </p>
              <p>
                <span className="font-medium">Last reported:</span> {formatDateTime(alert.lastReportedAt)}
              </p>
              <p>
                <span className="font-medium">Coordinates:</span> {alert.latitude.toFixed(6)},{' '}
                {alert.longitude.toFixed(6)}
              </p>
              <a
                className="text-blue-600 underline font-medium inline-block mt-1"
                href={buildGoogleMapsUrl(alert.latitude, alert.longitude)}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps
              </a>
            </div>

            {reporters && reporters.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-2 font-medium">Reporters ({reporters.length})</h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {reporters.map((reporter) => (
                      <li key={reporter.studentId} className="rounded-md border p-2">
                        <p className="font-medium">{reporter.studentFullName}</p>
                        <p className="text-muted-foreground">{formatDateTime(reporter.reportedAt)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <Separator />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                disabled={!canAcknowledge || acknowledge.isPending}
                onClick={() => runAction(() => acknowledge.mutateAsync(alert.id))}
                className="w-full"
              >
                Acknowledge
              </Button>
              <Button
                variant="destructive"
                disabled={!canBroadcast || broadcast.isPending}
                onClick={() =>
                  runAction(() =>
                    broadcast.mutateAsync({ alertId: alert.id, alertType: alert.alertType }),
                  )
                }
                className="w-full"
              >
                Broadcast
              </Button>
              <Button
                variant="secondary"
                disabled={!canResolve || resolve.isPending}
                onClick={() => runAction(() => resolve.mutateAsync(alert.id))}
                className="w-full"
              >
                Resolve
              </Button>
              <Button
                variant="outline"
                disabled={!canClose || close.isPending}
                onClick={() => runAction(() => close.mutateAsync(alert.id))}
                className="w-full"
              >
                Close
              </Button>
            </div>

            {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
