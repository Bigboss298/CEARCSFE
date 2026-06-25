import type { DevicePlatform } from './common.dto'

export interface RegisterDeviceTokenRequest {
  token: string
  platform: DevicePlatform
}
