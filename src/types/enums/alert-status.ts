export enum AlertStatus {
  Pending = 0,
  Acknowledged = 1,
  Broadcasted = 2,
  AutoEscalated = 3,
  Resolved = 4,
  Closed = 5,
}

export function parseAlertStatus(value: string | number): AlertStatus | null {
  const parsed = typeof value === 'string' ? Number(value) : value
  return Number.isInteger(parsed) && parsed in AlertStatus ? (parsed as AlertStatus) : null
}

export function isTerminalAlertStatus(status: AlertStatus): boolean {
  return status === AlertStatus.Closed
}

export function isActiveAlertStatus(status: AlertStatus): boolean {
  return status !== AlertStatus.Resolved && status !== AlertStatus.Closed
}
