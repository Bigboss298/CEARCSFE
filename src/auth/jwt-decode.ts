import type { JwtClaims } from '@/types'
import { parseUserRole } from '@/types/enums/user-role'

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return atob(padded)
}

export function decodeJwt(token: string): JwtClaims | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    const parsed = JSON.parse(decodeBase64Url(payload)) as Record<string, unknown>
    const role = typeof parsed.role === 'string' ? parseUserRole(parsed.role) : null
    const sub = typeof parsed.sub === 'string' ? parsed.sub : null
    const jti = typeof parsed.jti === 'string' ? parsed.jti : ''
    const exp = typeof parsed.exp === 'number' ? parsed.exp : 0

    if (!role || !sub || !exp) return null

    return {
      sub,
      role,
      jti,
      exp,
      email: typeof parsed.email === 'string' ? parsed.email : undefined,
      matricNumber: typeof parsed.matricNumber === 'string' ? parsed.matricNumber : undefined,
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName : undefined,
      username: typeof parsed.username === 'string' ? parsed.username : undefined,
      iss: typeof parsed.iss === 'string' ? parsed.iss : undefined,
      aud: typeof parsed.aud === 'string' ? parsed.aud : undefined,
    }
  } catch {
    return null
  }
}

export function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true
  return Date.parse(expiresAt) <= Date.now()
}

export function isJwtExpired(token: string): boolean {
  const claims = decodeJwt(token)
  if (!claims) return true
  return claims.exp * 1000 <= Date.now()
}
