export interface MatricRecordResponse {
  id: string
  matricNumber: string
  fullName: string
  faculty: string
  department: string
  level: string
  isUsed: boolean
}

export interface MatricUploadResult {
  inserted: number
  skipped: number
  invalid: number
  errors: string[]
}
