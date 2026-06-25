import { AlertStatus } from '@/types/enums/alert-status'
import { AlertType } from '@/types/enums/alert-type'
import type { AlertStatus as AlertStatusType } from '@/types/enums/alert-status'
import type { AlertType as AlertTypeType } from '@/types/enums/alert-type'

export function getAlertTypeColor(type: AlertTypeType): string {
  switch (type) {
    case AlertType.Fire:
      return 'bg-fire'
    case AlertType.Medical:
      return 'bg-medical'
    case AlertType.Security:
      return 'bg-security'
    default:
      return 'bg-muted'
  }
}

export function getAlertTypeLabel(type: AlertTypeType): string {
  return type
}

export function getAlertStatusVariant(
  status: AlertStatusType,
): 'default' | 'secondary' | 'destructive' | 'warning' | 'success' | 'fire' | 'medical' | 'security' {
  switch (status) {
    case AlertStatus.Pending:
      return 'warning'
    case AlertStatus.Acknowledged:
      return 'medical'
    case AlertStatus.Broadcasted:
    case AlertStatus.AutoEscalated:
      return 'fire'
    case AlertStatus.Resolved:
      return 'success'
    case AlertStatus.Closed:
      return 'secondary'
    default:
      return 'default'
  }
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function getCountdownSeconds(deadline: string): number {
  return Math.max(0, Math.floor((Date.parse(deadline) - Date.now()) / 1000))
}
