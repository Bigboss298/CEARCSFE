import { HubConnectionState } from '@microsoft/signalr'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore, selectAdminProfile, useSignalRStore } from '@/stores'
import { CircleUserRound, Radio } from 'lucide-react'
import { getUserRoleLabel } from '@/utils/enum-mappings'

export function AdminSettingsPage() {
  const user = useAuthStore((s) => s.user)
  const profile = selectAdminProfile(user)
  const connectionState = useSignalRStore((s) => s.connectionState)
  const signalRError = useSignalRStore((s) => s.error)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Session details and realtime connectivity status.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleUserRound className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>Administrator session information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingRow label="Username" value={profile?.username ?? '—'} />
            <SettingRow label="Role" value={profile?.role ? getUserRoleLabel(profile.role) : '—'} />
            <SettingRow label="Access" value="Command center" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Connection
            </CardTitle>
            <CardDescription>Realtime transport status for SignalR and admin feed updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingRow label="SignalR" value={connectionState} />
            <Badge variant={connectionState === HubConnectionState.Connected ? 'success' : 'warning'}>
              {connectionState}
            </Badge>
            {signalRError && (
              <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {signalRError}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  )
}
