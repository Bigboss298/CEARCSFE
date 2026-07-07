import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuthStore, selectStudentProfile, useNotificationStore } from '@/stores'
import { CreditCard, UserRound, ShieldCheck } from 'lucide-react'

export function StudentProfilePage() {
  const user = useAuthStore((s) => s.user)
  const profile = selectStudentProfile(user)
  const isRegistered = useNotificationStore((s) => s.isRegistered)
  const deviceInfo = useNotificationStore((s) => s.deviceInfo)
  const notificationStatus = isRegistered || deviceInfo?.token ? 'Registered' : 'Not registered'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your identity and registration details in one place.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ProfileField label="Full Name" value={profile?.fullName || 'Not provided'} />
            <ProfileField label="Email" value={profile?.email || 'Not provided'} />
            <ProfileField label="Phone Number" value={profile?.phoneNumber || 'Not provided'} />
            <ProfileField label="Matric Number" value={profile?.matricNumber || 'Not provided'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Account Status</p>
              <Badge variant="success" className="mt-2">
                Active
              </Badge>
            </div>
            <Separator />
            <ProfileField label="Notification Status" value={notificationStatus} />
            <ProfileField
              label="Telegram Linked"
              value={profile?.isTelegramLinked || profile?.telegramUsername ? 'Yes' : 'No'}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Registration Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <ProfileField label="Faculty" value={profile?.faculty || 'Not provided'} />
          <ProfileField label="Department" value={profile?.department || 'Not provided'} />
          <ProfileField label="Level" value={profile?.level || 'Not provided'} />
        </CardContent>
      </Card>
    </div>
  )
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}
