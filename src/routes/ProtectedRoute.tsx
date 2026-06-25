import { Navigate, useLocation } from 'react-router-dom'
import { isTokenExpired } from '@/auth/jwt-decode'
import { getRoleHomePath } from '@/auth/role-utils'
import { useAuthStore } from '@/stores'
import { paths } from './paths'

interface RouteGuardProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: RouteGuardProps) {
  const location = useLocation()
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const expiresAt = useAuthStore((state) => state.expiresAt)
  const role = useAuthStore((state) => state.role)

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Restoring session...</p>
      </div>
    )
  }

  if (!isAuthenticated || !role || isTokenExpired(expiresAt)) {
    return <Navigate to={paths.login} replace state={{ from: location.pathname }} />
  }

  return children
}

export function GuestRoute({ children }: RouteGuardProps) {
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const role = useAuthStore((state) => state.role)
  const expiresAt = useAuthStore((state) => state.expiresAt)

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (isAuthenticated && role && !isTokenExpired(expiresAt)) {
    return <Navigate to={getRoleHomePath(role)} replace />
  }

  return children
}

export function RootRedirect() {
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const role = useAuthStore((state) => state.role)
  const expiresAt = useAuthStore((state) => state.expiresAt)

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (isAuthenticated && role && !isTokenExpired(expiresAt)) {
    return <Navigate to={getRoleHomePath(role)} replace />
  }

  return <Navigate to={paths.login} replace />
}

// Backward-compatible exports
export const GuestStudentRoute = GuestRoute
export const GuestAdminRoute = GuestRoute
