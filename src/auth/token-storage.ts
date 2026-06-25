import { AUTH_STORAGE_KEY } from '@/lib/constants'
import type { AuthUser, UserRole } from '@/types'

export interface PersistedAuthState {
  token: string
  expiresAt: string
  role: UserRole
  user: AuthUser
}

export function readPersistedAuth(): PersistedAuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedAuthState
  } catch {
    return null
  }
}

export function writePersistedAuth(state: PersistedAuthState): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
}

export function clearPersistedAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function getStoredToken(): string | null {
  return readPersistedAuth()?.token ?? null
}
