import { AlertStatus } from '@/types/enums/alert-status'
import { AlertType } from '@/types/enums/alert-type'
import type { AlertStatus as AlertStatusType } from '@/types/enums/alert-status'
import type { AlertType as AlertTypeType } from '@/types/enums/alert-type'
import {
  getAlertTypeLabel,
  getAlertStatusLabel,
  getUserRoleLabel,
  getBroadcastStatusLabel,
  getEscalationStatusLabel,
} from './enum-mappings'

export {
  getAlertTypeLabel,
  getAlertStatusLabel,
  getUserRoleLabel,
  getBroadcastStatusLabel,
  getEscalationStatusLabel,
}

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

export function formatDateTime(value: unknown): string {
  try {
    if (value === null || value === undefined || value === '') {
      return '—'
    }

    if (typeof value === 'string' && !value.trim()) {
      return '—'
    }

    let dateObj: Date
    if (value instanceof Date) {
      dateObj = value
    } else if (typeof value === 'string' || typeof value === 'number') {
      if (typeof value === 'string' && value.trim().startsWith('0001-01-01')) {
        return '—'
      }
      dateObj = new Date(value)
    } else {
      return '—'
    }

    const time = dateObj.getTime()
    if (isNaN(time) || !isFinite(time)) {
      return '—'
    }

    if (dateObj.getFullYear() <= 1) {
      return '—'
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(dateObj)
  } catch {
    return '—'
  }
}

export function getCountdownSeconds(deadline: unknown): number {
  try {
    if (!deadline || (typeof deadline !== 'string' && !(deadline instanceof Date) && typeof deadline !== 'number')) {
      return 0
    }
    if (typeof deadline === 'string' && (!deadline.trim() || deadline.trim().startsWith('0001-01-01'))) {
      return 0
    }
    const parsed = typeof deadline === 'number' ? deadline : deadline instanceof Date ? deadline.getTime() : Date.parse(deadline)
    if (isNaN(parsed) || !isFinite(parsed) || parsed < -62135596800000) {
      return 0
    }
    return Math.max(0, Math.floor((parsed - Date.now()) / 1000))
  } catch {
    return 0
  }
}
