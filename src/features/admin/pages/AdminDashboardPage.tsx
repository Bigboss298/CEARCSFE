import type { ComponentType } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import { useDashboardQuery } from '@/api/hooks'
import { DashboardCharts, KpiGrid } from '@/features/admin/components/DashboardCharts'
import { AlertMap } from '@/features/alerts/components/AlertMap'
import { AlertCard } from '@/features/alerts/components/AlertCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { AlertStatus } from '@/types/enums/alert-status'
import { useSignalRStore } from '@/stores'
import { Activity, MapPinned, Radar } from 'lucide-react'

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
          <Badge variant={connectionState === HubConnectionState.Connected ? 'success' : 'warning'}>
            <Radar className="mr-1 h-3 w-3" />
            SignalR {connectionState}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-3 xl:grid-cols-4">
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
        <CardContent>
          <ScrollArea className="h-[420px] pr-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {dashboard.recentAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
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
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  )
}
