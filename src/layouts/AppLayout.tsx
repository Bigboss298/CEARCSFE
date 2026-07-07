import * as React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, PanelLeftClose, PanelLeftOpen, LogOut, Shield, CircleDot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuthStore, selectAdminProfile, selectStudentProfile } from '@/stores'
import { useSignalRStore } from '@/stores/signalr.store'
import { HubConnectionState } from '@microsoft/signalr'
import type { UserRole } from '@/types'
import { getUserRoleLabel } from '@/utils/enum-mappings'

export interface AppNavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
}

interface AppLayoutProps {
  title: string
  navItems: readonly AppNavItem[]
  children: React.ReactNode
}

function getRoleLabel(role: UserRole | null): string {
  if (!role) return 'Guest'
  return getUserRoleLabel(role)
}

function getUserDisplayName(
  role: UserRole | null,
  user: ReturnType<typeof useAuthStore.getState>['user'],
): string {
  if (role === 'Student') return selectStudentProfile(user)?.fullName ?? 'Student'
  if (role) return selectAdminProfile(user)?.username ?? 'Administrator'
  return 'Guest'
}

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'CE'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

export function AppLayout({ title, navItems, children }: AppLayoutProps) {
  const location = useLocation()
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.role)
  const logout = useAuthStore((state) => state.logout)
  const connectionState = useSignalRStore((state) => state.connectionState)
  const userName = getUserDisplayName(role, user)
  const roleLabel = getRoleLabel(role)
  const activeNav = navItems.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  )

  React.useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const renderSidebarContent = (isCollapsed: boolean) => (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <div className={cn('flex items-center gap-3 border-b border-white/10 px-4 py-4', isCollapsed && 'justify-center')}>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
          <Shield className="h-5 w-5" />
        </div>
        {!isCollapsed && (
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] text-white/60">CEARCS</p>
            <p className="text-sm text-white/80">Campus Emergency Response</p>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <nav className="space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white text-slate-950 shadow-lg shadow-black/20'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                  isCollapsed && 'justify-center px-0',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-white/10 p-3">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-white/70 hover:bg-white/10 hover:text-white',
            isCollapsed && 'justify-center px-0',
          )}
          onClick={() => setCollapsed((value) => !value)}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!isCollapsed && <span>Collapse sidebar</span>}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(2,132,199,0.10),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.08),_transparent_25%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] dark:text-slate-50">
      <div className="flex min-h-screen">
        <aside className={cn('hidden md:block md:sticky md:top-0 md:h-screen', collapsed ? 'md:w-[84px]' : 'md:w-[280px]')}>
          {renderSidebarContent(collapsed)}
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85">
            <div className="flex h-16 items-center gap-3 px-3 sm:px-6">
              <div className="md:hidden">
                <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent side="left" className="w-[300px] p-0 sm:w-[340px]">
                    <DrawerHeader className="sr-only">
                      <DrawerTitle>Navigation</DrawerTitle>
                    </DrawerHeader>
                    {renderSidebarContent(false)}
                  </DrawerContent>
                </Drawer>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  {title}
                </p>
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                    {activeNav?.label ?? title}
                  </h1>
                  <Badge
                    variant={connectionState === HubConnectionState.Connected ? 'success' : 'warning'}
                    className="hidden sm:inline-flex"
                  >
                    <CircleDot className="mr-1 h-3 w-3" />
                    {connectionState}
                  </Badge>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 text-left shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                        {getUserInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{userName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-64">
                  <DropdownMenuLabel>Session</DropdownMenuLabel>
                  <div className="px-2 pb-2">
                    <p className="text-sm font-semibold text-foreground">{userName}</p>
                    <p className="text-xs text-muted-foreground">{roleLabel}</p>
                    <Badge
                      variant={connectionState === HubConnectionState.Connected ? 'success' : 'warning'}
                      className="mt-2"
                    >
                      {connectionState}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void logout()}>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 lg:px-8 lg:py-6">
            <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
