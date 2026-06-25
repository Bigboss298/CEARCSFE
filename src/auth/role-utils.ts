import { UserRole, isKioskRole } from '@/types/enums/user-role'

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case UserRole.Student:
      return '/student'
    case UserRole.Admin:
      return '/admin'
    case UserRole.Faculty:
    case UserRole.Kiosk:
    case UserRole.FireKiosk:
    case UserRole.ClinicKiosk:
      return '/kiosk'
    default:
      return '/login'
  }
}

export function getLoginPathForRole(_role: UserRole | null): string {
  return '/login'
}

export function isStudentRole(role: UserRole): boolean {
  return role === UserRole.Student
}

export function isAdminRole(role: UserRole): boolean {
  return role === UserRole.Admin
}

export { isKioskRole }

export function roleAllowsRoute(role: UserRole, allowedRoles: readonly UserRole[]): boolean {
  return allowedRoles.includes(role)
}
