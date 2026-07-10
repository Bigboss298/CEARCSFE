import { useMemo, useState } from 'react'
import { useAlertDetailQuery, useAlertsQuery } from '@/api/hooks'
import { AlertDetailSheet } from '@/features/alerts/components/AlertDetailSheet'
import type { AlertResponse } from '@/types'
import { AlertStatus } from '@/types/enums/alert-status'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertType } from '@/types/enums/alert-type'
import {
  formatDateTime,
  getAlertStatusLabel,
  getAlertStatusVariant,
  getAlertTypeLabel,
} from '@/utils/alert-theme'
import { Eye } from 'lucide-react'

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
        <CardContent className="overflow-hidden">
          <ScrollArea className="h-[420px]">
            <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <table className="min-w-[720px] w-full table-fixed text-left text-sm sm:min-w-0">
                <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                  <tr className="border-b border-slate-200/70 text-[10px] uppercase tracking-[0.12em] text-muted-foreground dark:border-slate-800 sm:text-xs sm:tracking-[0.14em]">
                    <th className="w-[34%] px-3 py-3 sm:w-[30%] sm:px-4">Student</th>
                    <th className="w-[16%] px-3 py-3 sm:w-[16%] sm:px-4">Type</th>
                    <th className="w-[16%] px-3 py-3 sm:w-[16%] sm:px-4">Status</th>
                    <th className="hidden px-4 py-3 md:table-cell md:w-[18%]">Time</th>
                    <th className="hidden px-4 py-3 lg:table-cell lg:w-[16%]">Confidence</th>
                    <th className="w-[18%] px-3 py-3 sm:px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {historyAlerts.map((alert) => {
                    const typeVariant =
                      alert.alertType === AlertType.Fire
                        ? 'fire'
                        : alert.alertType === AlertType.Medical
                          ? 'medical'
                          : 'security'

                    return (
                      <tr
                        key={alert.id}
                        className="cursor-pointer align-top transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/50"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <td className="px-3 py-3 sm:px-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white sm:text-base">
                              {alert.studentFullName}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground md:hidden">
                              {formatDateTime(alert.createdAt)}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-3 sm:px-4">
                          <Badge variant={typeVariant} className="text-[10px] sm:text-xs">
                            {getAlertTypeLabel(alert.alertType)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 sm:px-4">
                          <Badge variant={getAlertStatusVariant(alert.alertStatus)} className="text-[10px] sm:text-xs">
                            {getAlertStatusLabel(alert.alertStatus)}
                          </Badge>
                        </td>
                        <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
                          {formatDateTime(alert.createdAt)}
                        </td>
                        <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
                          {alert.confidenceScore.toFixed(1)}
                        </td>
                        <td className="px-3 py-3 sm:px-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedAlert(alert)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Details
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </ScrollArea>
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
