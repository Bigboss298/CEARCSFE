export interface ErrorResponse {
  success: false
  message: string
  traceId: string
  errors?: string[]
}

export interface MessageResponse {
  message: string
}

export type DevicePlatform = 'android' | 'ios' | 'web'
