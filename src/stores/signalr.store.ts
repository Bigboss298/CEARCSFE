import { create } from 'zustand'
import type { HubConnectionState } from '@microsoft/signalr'
import type { AlertResponse } from '@/types'

interface SignalRState {
  connectionState: HubConnectionState | 'Disconnected'
  lastNewEmergencyAlert: AlertResponse | null
  lastEventAt: string | null
  error: string | null
}

interface SignalRActions {
  setConnectionState: (state: HubConnectionState | 'Disconnected') => void
  setLastNewEmergencyAlert: (alert: AlertResponse) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState: SignalRState = {
  connectionState: 'Disconnected',
  lastNewEmergencyAlert: null,
  lastEventAt: null,
  error: null,
}

export const useSignalRStore = create<SignalRState & SignalRActions>((set) => ({
  ...initialState,

  setConnectionState: (connectionState) => set({ connectionState }),

  setLastNewEmergencyAlert: (alert) =>
    set({ lastNewEmergencyAlert: alert, lastEventAt: new Date().toISOString() }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}))
