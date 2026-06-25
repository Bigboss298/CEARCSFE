import { useMemo, useState } from 'react'
import { useAlertDetailQuery, useAlertsQuery } from '@/api/hooks'
import { AlertCard } from '@/features/alerts/components/AlertCard'
import { AlertDetailSheet } from '@/features/alerts/components/AlertDetailSheet'
import { AlertMap } from '@/features/alerts/components/AlertMap'
import type { AlertResponse } from '@/types'
import { isActiveAlertStatus } from '@/types/enums/alert-status'

export function LiveAlertsPage() {
  const { data: alerts = [], isLoading, error } = useAlertsQuery()
  const [selectedAlert, setSelectedAlert] = useState<AlertResponse | null>(null)
  const { data: alertDetail } = useAlertDetailQuery(selectedAlert?.id ?? null, Boolean(selectedAlert))

  const activeAlerts = useMemo(
    () => alerts.filter((alert) => isActiveAlertStatus(alert.alertStatus)),
    [alerts],
  )

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading alerts...</p>
  if (error) return <p className="text-sm text-destructive">Failed to load alerts.</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Live Alerts</h2>
        <p className="text-sm text-muted-foreground">
          {activeAlerts.length} active alert{activeAlerts.length === 1 ? '' : 's'}
        </p>
      </div>

      <AlertMap alerts={activeAlerts} selectedAlertId={selectedAlert?.id} onSelectAlert={setSelectedAlert} height="420px" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {activeAlerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} onSelect={setSelectedAlert} />
        ))}
      </div>

      {activeAlerts.length === 0 && (
        <p className="text-sm text-muted-foreground">No active alerts at this time.</p>
      )}

      <AlertDetailSheet
        alert={alertDetail ?? selectedAlert}
        reporters={alertDetail?.reporters}
        open={Boolean(selectedAlert)}
        onOpenChange={(open) => !open && setSelectedAlert(null)}
      />
    </div>
  )
}
