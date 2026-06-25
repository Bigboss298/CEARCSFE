import type { ErrorResponse } from '@/types'

export function isErrorResponse(value: unknown): value is ErrorResponse {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ErrorResponse>
  return candidate.success === false && typeof candidate.message === 'string'
}

export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred.'): string {
  if (isErrorResponse(error)) return error.message

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: unknown } }).response
    if (isErrorResponse(response?.data)) return response.data.message
  }

  if (error instanceof Error) return error.message
  return fallback
}

export function getValidationErrors(error: unknown): string[] {
  if (isErrorResponse(error) && error.errors?.length) return error.errors

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: unknown } }).response
    if (isErrorResponse(response?.data) && response.data.errors?.length) {
      return response.data.errors
    }
  }

  return []
}
