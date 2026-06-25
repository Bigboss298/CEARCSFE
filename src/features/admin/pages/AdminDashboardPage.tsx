import { useDashboardQuery } from '@/api/hooks'
import { DashboardCharts, KpiGrid } from '@/features/admin/components/DashboardCharts'
import { AlertMap } from '@/features/alerts/components/AlertMap'
import { AlertCard } from '@/features/alerts/components/AlertCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSignalRStore } from '@/stores'
import { HubConnectionState } from '@microsoft/signalr'
import { Badge } from '@/components/ui/badge'

export function AdminDashboardPage() {
  const { data: dashboard, isLoading, error } = useDashboardQuery()
  const connectionState = useSignalRStore((s) => s.connectionState)

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading dashboard...</p>
  if (error || !dashboard) {
    return <p className="text-sm text-destructive">Failed to load dashboard.</p>
  }

  const liveAlerts = dashboard.recentAlerts.filter(
    (a) => a.alertStatus !== 'Resolved' && a.alertStatus !== 'Closed',
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Overview</h2>
        <Badge variant={connectionState === HubConnectionState.Connected ? 'success' : 'warning'}>
          SignalR: {connectionState}
        </Badge>
      </div>

      <KpiGrid dashboard={dashboard} />
      <DashboardCharts dashboard={dashboard} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campus Alert Map</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertMap alerts={dashboard.recentAlerts} height="360px" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[360px] pr-4">
              <div className="space-y-3">
                {dashboard.recentAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {liveAlerts.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Active Alerts ({liveAlerts.length})</CardTitle>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
