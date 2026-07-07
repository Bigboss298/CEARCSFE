import { apiClient, createFormData } from '@/api/client'
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  AlertDetailsResponse,
  AlertResponse,
  BroadcastAlertRequest,
  CreateAlertRequest,
  DashboardResponse,
  DeviceTokenInfo,
  LinkTelegramRequest,
  LoginRequest,
  LoginResponse,
  MatricRecordResponse,
  MatricUploadResult,
  RegisterDeviceTokenRequest,
  RegisterStudentRequest,
  StudentProfile,
} from '@/types'

export const AuthApi = {
  register: (payload: RegisterStudentRequest) => apiClient.post<void>('/api/auth/register', payload),

  loginStudent: (payload: LoginRequest) =>
    apiClient.post<LoginResponse>('/api/auth/login', payload),

  loginAdmin: (payload: AdminLoginRequest) =>
    apiClient.post<AdminLoginResponse>('/api/auth/admin/login', payload),

  linkTelegram: (payload: LinkTelegramRequest) => {
    console.log('[Telegram Audit] Submitting /LinkTelegram request payload:', JSON.stringify(payload))
    return apiClient.post<void>('/api/auth/link-telegram', payload)
  },

  getTelegramLinkUrl: () =>
    apiClient.get<{ url: string; message?: string }>('/api/auth/telegram-link-url'),

  getMe: () => apiClient.get<StudentProfile>('/api/auth/me'),
}

export const AlertApi = {
  create: (payload: CreateAlertRequest) =>
    apiClient.post<AlertResponse>('/api/alerts', payload),

  getAll: () => apiClient.get<AlertResponse[]>('/api/alerts'),

  getById: (id: string) => apiClient.get<AlertDetailsResponse>(`/api/alerts/${id}`),

  acknowledge: (id: string) => apiClient.post<void>(`/api/alerts/${id}/acknowledge`),

  resolve: (id: string) => apiClient.post<void>(`/api/alerts/${id}/resolve`),

  close: (id: string) => apiClient.post<void>(`/api/alerts/${id}/close`),
}

export const AdminApi = {
  broadcast: (payload: BroadcastAlertRequest) =>
    apiClient.post<void>('/api/admin/broadcast', payload),

  getDashboard: () => apiClient.get<DashboardResponse>('/api/admin/dashboard'),
}

export const MatricApi = {
  upload: (file: File) =>
    apiClient.post<MatricUploadResult>('/api/matric-records/upload', createFormData(file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getAll: () => apiClient.get<MatricRecordResponse[]>('/api/matric-records'),

  getById: (id: string) => apiClient.get<MatricRecordResponse>(`/api/matric-records/${id}`),
}

export const DeviceTokenApi = {
  register: (payload: RegisterDeviceTokenRequest) =>
    apiClient.post<void>('/api/device-tokens', payload),

  remove: (token: string) =>
    apiClient.delete<void>(`/api/device-tokens/${encodeURIComponent(token)}`),

  getMe: () => apiClient.get<DeviceTokenInfo | null>('/api/device-tokens/me'),
}
