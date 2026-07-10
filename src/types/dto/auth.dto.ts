import type { UserRole } from '../enums/user-role'

export interface RegisterStudentRequest {
  matricNumber: string
  fullName: string
  email: string
  phoneNumber: string
  telegramUsername: string | null
  telegramChatId: number | null
  password: string
}

export interface LoginRequest {
  matricNumber: string
  password: string
}

export interface AdminLoginRequest {
  username: string
  password: string
}

export interface LinkTelegramRequest {
  chatId: number
}

export interface LoginResponse {
  token: string
  fullName: string
  matricNumber: string
  expiresAt: string
}

export interface AdminLoginResponse {
  token: string
  username: string
  role: UserRole
  expiresAt: string
}

export interface StudentProfile {
  fullName: string
  matricNumber: string
  email: string
  phoneNumber?: string | null
  telegramUsername?: string | null
  telegramChatId?: number | null
  isTelegramLinked?: boolean
  faculty?: string | null
  department?: string | null
  level?: string | null
  id?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AdminProfile {
  username: string
  role: UserRole
}

export interface JwtClaims {
  sub: string
  role: UserRole
  jti: string
  email?: string
  matricNumber?: string
  fullName?: string
  username?: string
  exp: number
  iss?: string
  aud?: string
}

export type AuthUser =
  | { kind: 'student'; profile: StudentProfile }
  | { kind: 'admin'; profile: AdminProfile }
