import { create } from 'zustand'
import { AuthApi } from '@/api/services'
import { unwrapApiError } from '@/api/client'
import { isTokenExpired } from '@/auth/jwt-decode'
import { getRoleHomePath } from '@/auth/role-utils'
import {
  clearPersistedAuth,
  readPersistedAuth,
  writePersistedAuth,
  type PersistedAuthState,
} from '@/auth/token-storage'
import type {
  AdminLoginRequest,
  AdminProfile,
  AuthUser,
  LoginRequest,
  RegisterStudentRequest,
  StudentProfile,
  UserRole,
} from '@/types'
import { alertHubService } from '@/services/signalr/alert-hub.service'
import { useNotificationStore } from './notification.store'

interface AuthState {
  token: string | null
  expiresAt: string | null
  role: UserRole | null
  user: AuthUser | null
  isAuthenticated: boolean
  isHydrated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  loginStudent: (credentials: LoginRequest) => Promise<string>
  registerStudent: (payload: RegisterStudentRequest) => Promise<void>
  loginAdmin: (credentials: AdminLoginRequest) => Promise<string>
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
  clearError: () => void
  setHydrated: () => void
}

function persistAuth(state: PersistedAuthState): void {
  writePersistedAuth(state)
}

function applyAuthState(
  set: (partial: Partial<AuthState>) => void,
  persisted: PersistedAuthState,
): void {
  set({
    token: persisted.token,
    expiresAt: persisted.expiresAt,
    role: persisted.role,
    user: persisted.user,
    isAuthenticated: true,
    error: null,
  })
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  token: null,
  expiresAt: null,
  role: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,
  error: null,

  setHydrated: () => set({ isHydrated: true }),

  clearError: () => set({ error: null }),

  restoreSession: async () => {
    const persisted = readPersistedAuth()
    if (!persisted || isTokenExpired(persisted.expiresAt)) {
      clearPersistedAuth()
      set({
        token: null,
        expiresAt: null,
        role: null,
        user: null,
        isAuthenticated: false,
        isHydrated: true,
      })
      return
    }

    applyAuthState(set, persisted)
    set({ isHydrated: true })

    try {
      await alertHubService.connect(persisted.token)
    } catch {
      // Hub connection failures should not clear a valid REST session.
    }

    if (persisted.role === 'Student') {
      void useNotificationStore.getState().registerDeviceTokenIfNeeded()
    }
  },

  loginStudent: async (credentials) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await AuthApi.loginStudent(credentials)
      const user: AuthUser = {
        kind: 'student',
        profile: {
          fullName: data.fullName,
          matricNumber: data.matricNumber,
        },
      }

      const persisted: PersistedAuthState = {
        token: data.token,
        expiresAt: data.expiresAt,
        role: 'Student',
        user,
      }

      persistAuth(persisted)
      applyAuthState(set, persisted)
      set({ isLoading: false })

      await alertHubService.connect(data.token)
      void useNotificationStore.getState().registerDeviceTokenIfNeeded()

      return getRoleHomePath('Student')
    } catch (error) {
      const message = unwrapApiError(error)
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },

  registerStudent: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      await AuthApi.register(payload)
      set({ isLoading: false })
    } catch (error) {
      const message = unwrapApiError(error)
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },

  loginAdmin: async (credentials) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await AuthApi.loginAdmin(credentials)
      const user: AuthUser = {
        kind: 'admin',
        profile: {
          username: data.username,
          role: data.role,
        } satisfies AdminProfile,
      }

      const persisted: PersistedAuthState = {
        token: data.token,
        expiresAt: data.expiresAt,
        role: data.role,
        user,
      }

      persistAuth(persisted)
      applyAuthState(set, persisted)
      set({ isLoading: false })

      await alertHubService.connect(data.token)

      return getRoleHomePath(data.role)
    } catch (error) {
      const message = unwrapApiError(error)
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },

  logout: async () => {
    const { role } = get()

    if (role === 'Student') {
      await useNotificationStore.getState().unregisterDeviceTokenIfRegistered()
    }

    await alertHubService.disconnect()
    clearPersistedAuth()

    set({
      token: null,
      expiresAt: null,
      role: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  },
}))

export function selectStudentProfile(user: AuthUser | null): StudentProfile | null {
  return user?.kind === 'student' ? user.profile : null
}

export function selectAdminProfile(user: AuthUser | null): AdminProfile | null {
  return user?.kind === 'admin' ? user.profile : null
}
