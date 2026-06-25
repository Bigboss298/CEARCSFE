import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore, selectAdminProfile } from '@/stores'
import { useSignalRStore } from '@/stores'
import { HubConnectionState } from '@microsoft/signalr'
import { Badge } from '@/components/ui/badge'

export function AdminSettingsPage() {
  const user = useAuthStore((s) => s.user)
  const profile = selectAdminProfile(user)
  const connectionState = useSignalRStore((s) => s.connectionState)
  const signalRError = useSignalRStore((s) => s.error)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Administrator session information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Username:</span> {profile?.username}
          </p>
          <p>
            <span className="text-muted-foreground">Role:</span> {profile?.role}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Real-Time Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Badge variant={connectionState === HubConnectionState.Connected ? 'success' : 'warning'}>
            {connectionState}
          </Badge>
          {signalRError && <p className="text-destructive">{signalRError}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
