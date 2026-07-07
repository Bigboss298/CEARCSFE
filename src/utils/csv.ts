export interface CsvValidationResult {
  valid: boolean
  errors: string[]
}

const EXPECTED_MATRIC_COLUMNS = ['MatricNumber', 'FullName', 'Faculty', 'Department', 'Level']

export function downloadMatricTemplate(): void {
  const content = '\uFEFFMatricNumber,FullName,Faculty,Department,Level\nCSC/2021/001,John Doe,Science,Computer Science,300\n'
  downloadCsvFile('students_matric_template.csv', content)
}

export function downloadCsvFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePhone(phone: string): boolean {
  return /^\+?[0-9\s\-()]{7,15}$/.test(phone)
}

export function validateCoordinates(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

export function validateMatricCsv(csvContent: string): CsvValidationResult {
  const errors: string[] = []
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length === 0) {
    return { valid: false, errors: ['CSV file is empty. Please check your file and try again.'] }
  }

  // Parse headers and strip UTF-8 BOM if present
  const rawHeader = lines[0].replace(/^\uFEFF/, '')
  const headers = rawHeader.split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''))

  const missingColumns = EXPECTED_MATRIC_COLUMNS.filter((col) => !headers.includes(col))
  const unknownColumns = headers.filter((col) => !EXPECTED_MATRIC_COLUMNS.includes(col))

  if (missingColumns.length > 0) {
    errors.push(`Missing required column(s): ${missingColumns.join(', ')}`)
  }
  if (unknownColumns.length > 0) {
    errors.push(`Unknown column(s) detected: ${unknownColumns.join(', ')}. Expected only: ${EXPECTED_MATRIC_COLUMNS.join(', ')}`)
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  if (lines.length === 1) {
    errors.push('CSV file contains only headers with no data rows.')
    return { valid: false, errors }
  }

  const seenMatricNumbers = new Set<string>()

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1
    const line = lines[i]
    const cells = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''))

    EXPECTED_MATRIC_COLUMNS.forEach((colName, idx) => {
      const cellValue = cells[idx] ?? ''
      if (cellValue === '') {
        errors.push(`Row ${rowNum}: Required cell '${colName}' cannot be empty.`)
      }
    })

    const matricNo = cells[0] ?? ''
    if (matricNo !== '') {
      const normalizedMatric = matricNo.toLowerCase()
      if (seenMatricNumbers.has(normalizedMatric)) {
        errors.push(`Row ${rowNum}: Duplicate identifier '${matricNo}'.`)
      } else {
        seenMatricNumbers.add(normalizedMatric)
      }
    }

    const level = cells[4] ?? ''
    if (level !== '' && !/^[A-Za-z0-9\s/]+$/.test(level)) {
      errors.push(`Row ${rowNum}: Invalid level enum value '${level}'.`)
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.slice(0, 50), // Cap displayed errors to prevent UI freeze
  }
}
