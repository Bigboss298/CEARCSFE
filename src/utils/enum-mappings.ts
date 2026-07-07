import { AlertStatus } from '@/types/enums/alert-status'
import { AlertType } from '@/types/enums/alert-type'
import { UserRole } from '@/types/enums/user-role'

/**
 * Converts any AlertStatus representation (number or string enum) to a human-readable label.
 */
export function getAlertStatusLabel(status: unknown): string {
  const numStatus = typeof status === 'string' && !isNaN(Number(status)) ? Number(status) : status

  switch (numStatus) {
    case AlertStatus.Pending:
    case 'Pending':
    case 'pending':
      return 'Pending'
    case AlertStatus.Acknowledged:
    case 'Acknowledged':
    case 'acknowledged':
      return 'Acknowledged'
    case AlertStatus.Broadcasted:
    case 'Broadcasted':
    case 'broadcasted':
      return 'Broadcasted'
    case AlertStatus.AutoEscalated:
    case 'AutoEscalated':
    case 'Auto Escalated':
    case 'autoescalated':
    case 'auto-escalated':
      return 'Auto Escalated'
    case AlertStatus.Resolved:
    case 'Resolved':
    case 'resolved':
      return 'Resolved'
    case AlertStatus.Closed:
    case 'Closed':
    case 'closed':
      return 'Closed'
    default:
      return 'Unknown'
  }
}

/**
 * Converts any AlertType representation (number or string enum) to a human-readable label.
 */
export function getAlertTypeLabel(type: unknown): string {
  const numType = typeof type === 'string' && !isNaN(Number(type)) ? Number(type) : type

  switch (numType) {
    case AlertType.Fire:
    case 'Fire':
    case 'fire':
      return 'Fire'
    case AlertType.Medical:
    case 'Medical':
    case 'medical':
      return 'Medical'
    case AlertType.Security:
    case 'Security':
    case 'security':
      return 'Security'
    default:
      return 'Unknown'
  }
}

/**
 * Converts any UserRole value to a human-readable display label.
 */
export function getUserRoleLabel(role: unknown): string {
  switch (role) {
    case UserRole.Student:
    case 'Student':
    case 'student':
      return 'Student'
    case UserRole.Admin:
    case 'Admin':
    case 'admin':
    case 'Administrator':
      return 'Administrator'
    case UserRole.Faculty:
    case 'Faculty':
    case 'faculty':
      return 'Faculty'
    case UserRole.Kiosk:
    case 'Kiosk':
    case 'kiosk':
      return 'Kiosk'
    case UserRole.FireKiosk:
    case 'FireKiosk':
    case 'firekiosk':
      return 'Fire Kiosk'
    case UserRole.ClinicKiosk:
    case 'ClinicKiosk':
    case 'clinickiosk':
      return 'Clinic Kiosk'
    default:
      return typeof role === 'string' ? role : 'Guest'
  }
}

/**
 * Converts broadcast status to a human-readable display label.
 */
export function getBroadcastStatusLabel(status: unknown): string {
  if (status === true || status === 'true' || status === 1 || status === '1' || status === AlertStatus.Broadcasted || status === 'Broadcasted') {
    return 'Broadcasted'
  }
  return 'Not Broadcasted'
}

/**
 * Converts escalation status to a human-readable display label.
 */
export function getEscalationStatusLabel(status: unknown): string {
  if (status === true || status === 'true' || status === 1 || status === '1' || status === AlertStatus.AutoEscalated || status === 'AutoEscalated' || status === 'Auto Escalated') {
    return 'Auto Escalated'
  }
  return 'Normal'
}
