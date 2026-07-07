import { UserRole, isKioskRole } from '@/types/enums/user-role'
import { paths } from '@/routes/paths'

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case UserRole.Student:
      return paths.student.root
    case UserRole.Admin:
      return paths.admin.root
    case UserRole.Faculty:
      return paths.faculty
    case UserRole.Kiosk:
      return paths.faculty
    case UserRole.FireKiosk:
      return paths.fireKiosk
    case UserRole.ClinicKiosk:
      return paths.clinicKiosk
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
