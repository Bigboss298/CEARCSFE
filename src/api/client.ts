import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearPersistedAuth, getStoredToken } from '@/auth/token-storage'
import { isJwtExpired } from '@/auth/jwt-decode'
import { env } from '@/lib/env'
import { getErrorMessage } from './error-handler'

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken()
  if (token && !isJwtExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearPersistedAuth()
      const url = error.config?.url ?? ''
      const isAuthRequest =
        url.includes('/auth/login') ||
        url.includes('/auth/admin/login') ||
        url.includes('/login')
      if (!isAuthRequest) {
        unauthorizedHandler?.()
      }
    }

    return Promise.reject(error)
  },
)

export function unwrapApiError(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 401
  ) {
    return 'Invalid username or password.'
  }
  return getErrorMessage(error)
}

export function createFormData(file: File): FormData {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}
