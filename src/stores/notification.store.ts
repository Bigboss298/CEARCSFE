import { create } from 'zustand'
import { DeviceTokenApi } from '@/api/services'
import type { DevicePlatform, DeviceTokenInfo } from '@/types'

interface NotificationState {
  permission: NotificationPermission | 'unsupported'
  fcmToken: string | null
  deviceInfo: DeviceTokenInfo | null
  isRegistered: boolean
  isRegistering: boolean
  error: string | null
}

interface NotificationActions {
  initializePermission: () => void
  setFcmToken: (token: string | null) => void
  registerDeviceTokenIfNeeded: () => Promise<void>
  unregisterDeviceTokenIfRegistered: () => Promise<void>
  fetchDeviceInfo: () => Promise<void>
  reset: () => void
}

function detectPlatform(): DevicePlatform {
  const ua = navigator.userAgent.toLowerCase()
  if (/android/.test(ua)) return 'android'
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  return 'web'
}

export const useNotificationStore = create<NotificationState & NotificationActions>((set, get) => ({
  permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  fcmToken: null,
  deviceInfo: null,
  isRegistered: false,
  isRegistering: false,
  error: null,

  initializePermission: () => {
    set({
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
    })
  },

  setFcmToken: (token) => set({ fcmToken: token }),

  registerDeviceTokenIfNeeded: async () => {
    const { fcmToken, isRegistered, isRegistering } = get()
    if (!fcmToken || isRegistered || isRegistering) return

    set({ isRegistering: true, error: null })
    try {
      await DeviceTokenApi.register({ token: fcmToken, platform: detectPlatform() })
      set({ isRegistered: true, isRegistering: false })
      await get().fetchDeviceInfo()
    } catch (error) {
      set({
        isRegistering: false,
        error: error instanceof Error ? error.message : 'Failed to register device token.',
      })
    }
  },

  unregisterDeviceTokenIfRegistered: async () => {
    const { fcmToken, isRegistered } = get()
    if (!fcmToken || !isRegistered) {
      set({ fcmToken: null, isRegistered: false })
      return
    }

    try {
      await DeviceTokenApi.remove(fcmToken)
    } catch {
      // Token may already be removed server-side.
    } finally {
      set({ fcmToken: null, deviceInfo: null, isRegistered: false })
    }
  },

  fetchDeviceInfo: async () => {
    try {
      const { data } = await DeviceTokenApi.getMe()
      if (data && (data.token || data.isRegistered !== undefined || data.platform || data.createdAt || data.registrationDate)) {
        set({
          deviceInfo: data,
          isRegistered: data.isRegistered ?? true,
          fcmToken: data.token ?? get().fcmToken,
        })
      } else {
        set({ deviceInfo: null, isRegistered: false })
      }
    } catch {
      set({ deviceInfo: null, isRegistered: false })
    }
  },

  reset: () =>
    set({
      fcmToken: null,
      deviceInfo: null,
      isRegistered: false,
      isRegistering: false,
      error: null,
    }),
}))
