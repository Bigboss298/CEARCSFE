import { Outlet } from 'react-router-dom'
import { AppLayout, type AppNavItem } from '@/layouts/AppLayout'
import { paths } from '@/routes/paths'
import { BellRing, CircleUserRound, Settings2 } from 'lucide-react'

const navItems: readonly AppNavItem[] = [
  { to: paths.student.root, label: 'Emergency', icon: BellRing, end: true },
  { to: paths.student.profile, label: 'Profile', icon: CircleUserRound },
  { to: paths.student.settings, label: 'Settings', icon: Settings2 },
]

export function StudentLayout() {
  return (
    <AppLayout title="Student Portal" navItems={navItems}>
      <Outlet />
    </AppLayout>
  )
}
