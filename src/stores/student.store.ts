import { create } from 'zustand'
import type { AlertResponse } from '@/types'
import type { EmergencyBroadcastPayload } from '@/types/signalr/hub-payloads'

export type AlertSubmissionState = 'idle' | 'locating' | 'submitting' | 'success' | 'error'

interface StudentState {
  lastSubmittedAlert: AlertResponse | null
  submissionState: AlertSubmissionState
  submissionError: string | null
  activeEmergency: EmergencyBroadcastPayload | null
}

interface StudentActions {
  setSubmissionState: (state: AlertSubmissionState, error?: string | null) => void
  setLastSubmittedAlert: (alert: AlertResponse | null) => void
  setActiveEmergency: (payload: EmergencyBroadcastPayload | null) => void
  clearEmergency: () => void
  reset: () => void
}

export const useStudentStore = create<StudentState & StudentActions>((set) => ({
  lastSubmittedAlert: null,
  submissionState: 'idle',
  submissionError: null,
  activeEmergency: null,

  setSubmissionState: (submissionState, submissionError = null) =>
    set({ submissionState, submissionError }),

  setLastSubmittedAlert: (lastSubmittedAlert) => set({ lastSubmittedAlert }),

  setActiveEmergency: (activeEmergency) => set({ activeEmergency }),

  clearEmergency: () => set({ activeEmergency: null }),

  reset: () =>
    set({
      lastSubmittedAlert: null,
      submissionState: 'idle',
      submissionError: null,
      activeEmergency: null,
    }),
}))
