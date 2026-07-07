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
    if (response?.data && typeof response.data === 'object') {
      const dataObj = response.data as Record<string, unknown>
      if (typeof dataObj.message === 'string' && dataObj.message.trim().length > 0) return dataObj.message
      if (typeof dataObj.error === 'string' && dataObj.error.trim().length > 0) return dataObj.error
      if (typeof dataObj.title === 'string' && dataObj.title.trim().length > 0) return dataObj.title
    }
    if (typeof response?.data === 'string' && response.data.trim().length > 0) {
      return response.data
    }
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as { message?: unknown }).message
    if (typeof msg === 'string' && msg.trim().length > 0) return msg
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
