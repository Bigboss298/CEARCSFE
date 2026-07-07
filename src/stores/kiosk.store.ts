import { create } from 'zustand'
import type { EmergencyBroadcastPayload } from '@/types/signalr/hub-payloads'
import { AlertType, parseAlertType } from '@/types/enums/alert-type'
import { UserRole } from '@/types/enums/user-role'

export type KioskDisplayMode = 'idle' | 'fire' | 'medical' | 'security'

interface KioskState {
  activeEmergency: EmergencyBroadcastPayload | null
  displayMode: KioskDisplayMode
  audioPlaying: boolean
  audioUnlocked: boolean
}

interface KioskActions {
  restoreEmergency: (role?: unknown) => void
  evaluateEmergency: (payload: EmergencyBroadcastPayload, role: UserRole) => void
  clearDisplay: () => void
  setAudioPlaying: (playing: boolean) => void
  setAudioUnlocked: (unlocked: boolean) => void
  reset: () => void
}

function resolveDisplayMode(alertType: unknown): KioskDisplayMode {
  const type = parseAlertType(alertType)
  switch (type) {
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

function shouldDisplayForRole(payload: EmergencyBroadcastPayload, role: unknown): boolean {
  const type = parseAlertType(payload.alertType)
  const roleStr = typeof role === 'string' ? role.toLowerCase() : ''
  switch (roleStr) {
    case 'faculty':
    case 'kiosk':
      return type === AlertType.Fire || type === AlertType.Security
    case 'firekiosk':
      return type === AlertType.Fire
    case 'clinickiosk':
      return type === AlertType.Medical
    default:
      return false
  }
}

const KIOSK_EMERGENCY_STORAGE_KEY = 'cearcs_kiosk_active_emergency'

function readPersistedEmergency(): EmergencyBroadcastPayload | null {
  try {
    const item = localStorage.getItem(KIOSK_EMERGENCY_STORAGE_KEY)
    if (!item) return null
    return JSON.parse(item) as EmergencyBroadcastPayload
  } catch {
    return null
  }
}

function writePersistedEmergency(payload: EmergencyBroadcastPayload): void {
  try {
    localStorage.setItem(KIOSK_EMERGENCY_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage write errors
  }
}

function clearPersistedEmergency(): void {
  try {
    localStorage.removeItem(KIOSK_EMERGENCY_STORAGE_KEY)
  } catch {
    // Ignore storage removal errors
  }
}

const initialEmergency = readPersistedEmergency()
const initialMode = initialEmergency ? resolveDisplayMode(initialEmergency.alertType) : 'idle'

export const useKioskStore = create<KioskState & KioskActions>((set, get) => ({
  activeEmergency: initialEmergency,
  displayMode: initialMode,
  audioPlaying: false,
  audioUnlocked: false,

  restoreEmergency: (role) => {
    const persisted = readPersistedEmergency()
    if (!persisted) {
      if (get().activeEmergency) {
        set({ activeEmergency: null, displayMode: 'idle', audioPlaying: false })
      }
      return
    }
    const normalizedType = parseAlertType(persisted.alertType) ?? persisted.alertType
    const normalizedPayload = { ...persisted, alertType: normalizedType }
    if (role && !shouldDisplayForRole(normalizedPayload, role)) {
      clearPersistedEmergency()
      set({ activeEmergency: null, displayMode: 'idle', audioPlaying: false })
      return
    }
    set({
      activeEmergency: normalizedPayload,
      displayMode: resolveDisplayMode(normalizedPayload.alertType),
    })
  },

  evaluateEmergency: (payload, role) => {
    const normalizedType = parseAlertType(payload.alertType) ?? payload.alertType
    const normalizedPayload = { ...payload, alertType: normalizedType }
    if (!shouldDisplayForRole(normalizedPayload, role)) return

    writePersistedEmergency(normalizedPayload)

    set({
      activeEmergency: normalizedPayload,
      displayMode: resolveDisplayMode(normalizedPayload.alertType),
      audioPlaying: true,
    })
  },

  clearDisplay: () => {
    clearPersistedEmergency()
    set({
      activeEmergency: null,
      displayMode: 'idle',
      audioPlaying: false,
    })
  },

  setAudioPlaying: (audioPlaying) => set({ audioPlaying }),

  setAudioUnlocked: (audioUnlocked) => set({ audioUnlocked }),

  reset: () => {
    clearPersistedEmergency()
    set({
      activeEmergency: null,
      displayMode: 'idle',
      audioPlaying: false,
    })
  },
}))
