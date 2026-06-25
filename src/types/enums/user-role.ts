export const UserRole = {
  Student: 'Student',
  Admin: 'Admin',
  Faculty: 'Faculty',
  Kiosk: 'Kiosk',
  FireKiosk: 'FireKiosk',
  ClinicKiosk: 'ClinicKiosk',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const ADMIN_ROLES = [UserRole.Admin] as const

export const KIOSK_ROLES = [
  UserRole.Faculty,
  UserRole.Kiosk,
  UserRole.FireKiosk,
  UserRole.ClinicKiosk,
] as const

export type KioskRole = (typeof KIOSK_ROLES)[number]

export function isKioskRole(role: UserRole): role is KioskRole {
  return (KIOSK_ROLES as readonly UserRole[]).includes(role)
}

export function parseUserRole(value: string): UserRole | null {
  return Object.values(UserRole).includes(value as UserRole) ? (value as UserRole) : null
}
