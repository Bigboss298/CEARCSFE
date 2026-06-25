export const AlertType = {
  Fire: 'Fire',
  Medical: 'Medical',
  Security: 'Security',
} as const

export type AlertType = (typeof AlertType)[keyof typeof AlertType]

export function parseAlertType(value: string): AlertType | null {
  return Object.values(AlertType).includes(value as AlertType) ? (value as AlertType) : null
}
