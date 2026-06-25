import { decodeJwt } from '@/auth/jwt-decode'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore, selectStudentProfile } from '@/stores'

export function StudentProfilePage() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const profile = selectStudentProfile(user)
  const claims = token ? decodeJwt(token) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="text-muted-foreground">Full Name</p>
          <p className="font-medium">{profile?.fullName ?? '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Matric Number</p>
          <p className="font-medium">{profile?.matricNumber ?? '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Email</p>
          <p className="font-medium">{claims?.email ?? '—'}</p>
        </div>
      </CardContent>
    </Card>
  )
}
