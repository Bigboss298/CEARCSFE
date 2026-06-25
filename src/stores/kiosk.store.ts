import { create } from 'zustand'
import type { EmergencyBroadcastPayload } from '@/types/signalr/hub-payloads'
import { AlertType } from '@/types/enums/alert-type'
import { UserRole } from '@/types/enums/user-role'

export type KioskDisplayMode = 'idle' | 'fire' | 'medical' | 'security'

interface KioskState {
  activeEmergency: EmergencyBroadcastPayload | null
  displayMode: KioskDisplayMode
  audioPlaying: boolean
}

interface KioskActions {
  evaluateEmergency: (payload: EmergencyBroadcastPayload, role: UserRole) => void
  clearDisplay: () => void
  setAudioPlaying: (playing: boolean) => void
  reset: () => void
}

function resolveDisplayMode(alertType: AlertType): KioskDisplayMode {
  switch (alertType) {
    case AlertType.Fire:
      return 'fire'
    case AlertType.Medical:
      return 'medical'
    case AlertType.Security:
      return 'security'
    default:
      return 'idle'
  }
}

function shouldDisplayForRole(payload: EmergencyBroadcastPayload, role: UserRole): boolean {
  switch (role) {
    case UserRole.Faculty:
    case UserRole.Kiosk:
      return payload.alertType === AlertType.Fire || payload.alertType === AlertType.Security
    case UserRole.FireKiosk:
      return payload.alertType === AlertType.Fire
    case UserRole.ClinicKiosk:
      return payload.alertType === AlertType.Medical
    default:
      return false
  }
}

export const useKioskStore = create<KioskState & KioskActions>((set) => ({
  activeEmergency: null,
  displayMode: 'idle',
  audioPlaying: false,

  evaluateEmergency: (payload, role) => {
    if (!shouldDisplayForRole(payload, role)) return

    set({
      activeEmergency: payload,
      displayMode: resolveDisplayMode(payload.alertType),
      audioPlaying: true,
    })
  },

  clearDisplay: () =>
    set({
      activeEmergency: null,
      displayMode: 'idle',
      audioPlaying: false,
    }),

  setAudioPlaying: (audioPlaying) => set({ audioPlaying }),

  reset: () =>
    set({
      activeEmergency: null,
      displayMode: 'idle',
      audioPlaying: false,
    }),
}))
