export const AlertStatus = {
  Pending: 'Pending',
  Acknowledged: 'Acknowledged',
  Broadcasted: 'Broadcasted',
  AutoEscalated: 'AutoEscalated',
  Resolved: 'Resolved',
  Closed: 'Closed',
} as const

export type AlertStatus = (typeof AlertStatus)[keyof typeof AlertStatus]

export function parseAlertStatus(value: string): AlertStatus | null {
  return Object.values(AlertStatus).includes(value as AlertStatus)
    ? (value as AlertStatus)
    : null
}

export function isTerminalAlertStatus(status: AlertStatus): boolean {
  return status === AlertStatus.Closed
}

export function isActiveAlertStatus(status: AlertStatus): boolean {
  return status !== AlertStatus.Resolved && status !== AlertStatus.Closed
}
