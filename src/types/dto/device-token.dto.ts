import type { DevicePlatform } from './common.dto'

export interface RegisterDeviceTokenRequest {
  token: string
  platform: DevicePlatform
}

export interface DeviceTokenInfo {
  token?: string | null
  platform?: string | null
  createdAt?: string | null
  registrationDate?: string | null
  updatedAt?: string | null
  isRegistered?: boolean
}
