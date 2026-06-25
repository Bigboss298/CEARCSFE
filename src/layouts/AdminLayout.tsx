import { NavLink, Outlet } from 'react-router-dom'
import { useAuthStore, selectAdminProfile } from '@/stores'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

const navItems = [
  { to: paths.admin.root, label: 'Overview', end: true },
  { to: paths.admin.alerts, label: 'Live Alerts' },
  { to: paths.admin.history, label: 'History' },
  { to: paths.admin.matric, label: 'Matric Upload' },
  { to: paths.admin.settings, label: 'Settings' },
]

export function AdminLayout() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const profile = selectAdminProfile(user)

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-6 p-4">
          <div>
            <p className="text-sm text-muted-foreground">CEARCS Admin</p>
            <p className="font-semibold">{profile?.username ?? 'Administrator'}</p>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
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
          <Button variant="outline" className="mt-auto" onClick={() => void logout()}>
            Logout
          </Button>
        </div>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="border-b px-6 py-4">
          <h1 className="text-lg font-semibold">Command Center</h1>
        </header>
        <main className="flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
