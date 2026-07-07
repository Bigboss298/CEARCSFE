import { useMemo, useState } from 'react'
import { useAlertDetailQuery, useAlertsQuery } from '@/api/hooks'
import { AlertCard } from '@/features/alerts/components/AlertCard'
import { AlertDetailSheet } from '@/features/alerts/components/AlertDetailSheet'
import type { AlertResponse } from '@/types'
import { AlertStatus } from '@/types/enums/alert-status'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AlertHistoryPage() {
  const { data: alerts = [], isLoading, error } = useAlertsQuery()
  const [selectedAlert, setSelectedAlert] = useState<AlertResponse | null>(null)
  const { data: alertDetail } = useAlertDetailQuery(selectedAlert?.id ?? null, Boolean(selectedAlert))

  const historyAlerts = useMemo(
    () =>
      alerts.filter(
        (alert) =>
          alert.alertStatus === AlertStatus.Resolved || alert.alertStatus === AlertStatus.Closed,
      ),
    [alerts],
  )

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading history...</p>
  if (error) return <p className="text-sm text-destructive">Failed to load alert history.</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Alert History</h2>
        <p className="mt-1 text-sm text-muted-foreground">Resolved and closed incidents.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historical Feed</CardTitle>
          <CardDescription>Recent incident history with detail drill-down.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {historyAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onSelect={setSelectedAlert} />
            ))}
          </div>
          {historyAlerts.length === 0 && (
            <p className="py-8 text-sm text-muted-foreground">No historical alerts yet.</p>
          )}
        </CardContent>
      </Card>

      <AlertDetailSheet
        alert={alertDetail ?? selectedAlert}
        reporters={alertDetail?.reporters}
        open={Boolean(selectedAlert)}
        onOpenChange={(open) => !open && setSelectedAlert(null)}
      />
    </div>
  )
}
