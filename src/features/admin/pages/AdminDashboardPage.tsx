import type { ComponentType } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import { useDashboardQuery } from '@/api/hooks'
import { DashboardCharts, KpiGrid } from '@/features/admin/components/DashboardCharts'
import { AlertMap } from '@/features/alerts/components/AlertMap'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { AlertStatus } from '@/types/enums/alert-status'
import { AlertType } from '@/types/enums/alert-type'
import { useSignalRStore } from '@/stores'
import { Activity, MapPinned, Radar } from 'lucide-react'
import {
  formatDateTime,
  getAlertStatusLabel,
  getAlertStatusVariant,
  getAlertTypeLabel,
} from '@/utils/alert-theme'

export function AdminDashboardPage() {
  const { data: dashboard, isLoading, error } = useDashboardQuery()
  const connectionState = useSignalRStore((s) => s.connectionState)

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading dashboard...</p>
  if (error || !dashboard) {
    return <p className="text-sm text-destructive">Failed to load dashboard.</p>
  }

  const liveAlerts = dashboard.recentAlerts.filter(
    (a) => a.alertStatus !== AlertStatus.Resolved && a.alertStatus !== AlertStatus.Closed,
  )

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/70 bg-gradient-to-br from-white to-slate-50 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-200/70 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="space-y-1">
            <CardTitle className="text-3xl">Overview</CardTitle>
            <CardDescription>
              Live incident intelligence, recent broadcasts, and campus-wide status.
            </CardDescription>
          </div>
          {/* <Badge variant={connectionState === HubConnectionState.Connected ? 'success' : 'warning'}>
            <Radar className="mr-1 h-3 w-3" />
            SignalR {connectionState}
          </Badge> */}
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3 xl:grid-cols-4">
          <SummaryChip label="Active alerts" value={String(dashboard.activeAlerts)} icon={Activity} />
          <SummaryChip label="Live incidents" value={String(liveAlerts.length)} icon={MapPinned} />
          <SummaryChip label="Resolved today" value={String(dashboard.resolvedAlerts)} icon={Activity} />
          <SummaryChip label="Total alerts" value={String(dashboard.totalAlerts)} icon={Activity} />
        </CardContent>
      </Card>

      <KpiGrid dashboard={dashboard} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardCharts dashboard={dashboard} />

        <Card>
          <CardHeader>
            <CardTitle>Campus Alert Map</CardTitle>
            <CardDescription>Realtime markers for the latest incidents.</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertMap alerts={dashboard.recentAlerts} height="380px" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <CardDescription>Latest incidents pulled from the realtime feed.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <ScrollArea className="h-[420px]">
            <div className="overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <table className="min-w-[720px] w-full table-fixed text-left text-sm sm:min-w-0">
                <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                  <tr className="border-b border-slate-200/70 text-[10px] uppercase tracking-[0.12em] text-muted-foreground dark:border-slate-800 sm:text-xs sm:tracking-[0.14em]">
                    <th className="w-[40%] px-3 py-3 sm:w-[32%] sm:px-4">Student</th>
                    <th className="w-[20%] px-3 py-3 sm:w-[16%] sm:px-4">Type</th>
                    <th className="w-[20%] px-3 py-3 sm:w-[16%] sm:px-4">Status</th>
                    <th className="hidden px-4 py-3 md:table-cell md:w-[18%]">Time</th>
                    <th className="hidden px-4 py-3 lg:table-cell lg:w-[14%]">Confidence</th>
                    <th className="hidden px-4 py-3 xl:table-cell xl:w-[10%]">Reporters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {dashboard.recentAlerts.map((alert) => {
                    const typeVariant =
                      alert.alertType === AlertType.Fire
                        ? 'fire'
                        : alert.alertType === AlertType.Medical
                          ? 'medical'
                          : 'security'

                    return (
                      <tr key={alert.id} className="align-top transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/50">
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
                        <td className="hidden px-4 py-3 text-sm text-muted-foreground xl:table-cell">
                          {alert.reporterCount}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {liveAlerts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Active Alerts ({liveAlerts.length})</CardTitle>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}

function SummaryChip({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm sm:gap-4 sm:p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white sm:size-12 sm:rounded-2xl dark:bg-slate-100 dark:text-slate-950">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0">
        <p className="break-words text-[10px] uppercase tracking-[0.08em] text-slate-500 sm:text-xs sm:tracking-[0.14em] dark:text-slate-400">
          {label}
        </p>
        <p className="mt-1 break-words text-lg font-semibold leading-none text-slate-900 sm:text-2xl dark:text-white">{value}</p>
      </div>
    </div>
  )
}
