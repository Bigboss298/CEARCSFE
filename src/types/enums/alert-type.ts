export enum AlertType {
  Fire = 0,
  Medical = 1,
  Security = 2,
}

export function parseAlertType(value: unknown): AlertType | null {
  if (
    value === AlertType.Fire ||
    value === 0 ||
    value === '0' ||
    (typeof value === 'string' && value.toLowerCase() === 'fire')
  ) {
    return AlertType.Fire
  }
  if (
    value === AlertType.Medical ||
    value === 1 ||
    value === '1' ||
    (typeof value === 'string' && value.toLowerCase() === 'medical')
  ) {
    return AlertType.Medical
  }
  if (
    value === AlertType.Security ||
    value === 2 ||
    value === '2' ||
    (typeof value === 'string' && value.toLowerCase() === 'security')
  ) {
    return AlertType.Security
  }
  return null
}
