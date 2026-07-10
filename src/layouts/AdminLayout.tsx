import { Outlet } from 'react-router-dom'
import { AppLayout, type AppNavItem } from '@/layouts/AppLayout'
import { paths } from '@/routes/paths'
import {
  LayoutDashboard,
  Radar,
  History,
  UploadCloud,
  // Settings2,
} from 'lucide-react'

const navItems: readonly AppNavItem[] = [
  { to: paths.admin.root, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: paths.admin.alerts, label: 'Live Alerts', icon: Radar },
  { to: paths.admin.history, label: 'Alert History', icon: History },
  { to: paths.admin.matric, label: 'Matric Records', icon: UploadCloud },
  // { to: paths.admin.settings, label: 'Settings', icon: Settings2 },
]

export function AdminLayout() {
  return (
    <AppLayout title="Command Center" navItems={navItems}>
      <Outlet />
    </AppLayout>
  )
}
