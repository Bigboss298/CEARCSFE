import { Navigate } from 'react-router-dom'
import { roleAllowsRoute } from '@/auth/role-utils'
import { useAuthStore } from '@/stores'
import type { UserRole } from '@/types'
import { paths } from './paths'

interface RoleRouteProps {
  allowedRoles: readonly UserRole[]
  children: React.ReactNode
}

export function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const role = useAuthStore((state) => state.role)

  if (!role || !roleAllowsRoute(role, allowedRoles)) {
    return <Navigate to={paths.unauthorized} replace />
  }

  return children
}
