import { NavLink, Outlet } from 'react-router-dom'
import { useAuthStore, selectStudentProfile } from '@/stores'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

export function StudentLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const profile = selectStudentProfile(user)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">CEARCS Student</p>
            <p className="font-medium">{profile?.fullName ?? 'Student'}</p>
          </div>
          <Button variant="outline" onClick={() => void logout()}>
            Logout
          </Button>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 px-4 pb-3">
          {[
            { to: paths.student.root, label: 'Emergency', end: true },
            { to: paths.student.profile, label: 'Profile' },
            { to: paths.student.settings, label: 'Settings' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
                  isActive && 'bg-accent font-medium',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
