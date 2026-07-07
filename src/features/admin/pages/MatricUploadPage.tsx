import { useRef, useState } from 'react'
import { useMatricRecordsQuery, useMatricUploadMutation, getMutationErrorMessage } from '@/api/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { MatricUploadResult } from '@/types'
import { UploadCloud, FileSpreadsheet, Table2 } from 'lucide-react'
import { downloadMatricTemplate, validateMatricCsv } from '@/utils/csv'

export function MatricUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: records = [], isLoading } = useMatricRecordsQuery()
  const uploadMutation = useMatricUploadMutation()
  const [result, setResult] = useState<MatricUploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(file: File) {
    setError(null)
    setResult(null)
    try {
      const content = await file.text()
      const validation = validateMatricCsv(content)
      if (!validation.valid) {
        setError('CSV validation failed. Please review the errors below.')
        setResult({
          inserted: 0,
          skipped: 0,
          invalid: validation.errors.length,
          errors: validation.errors,
        })
        return
      }

      const { data } = await uploadMutation.mutateAsync(file)
      setResult(data)
    } catch (err) {
      setError(getMutationErrorMessage(err, 'Upload failed.'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Matric Records</h2>
        <p className="mt-1 text-sm text-muted-foreground">Upload student whitelist CSV files and review imported records.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5" />
              Upload CSV
            </CardTitle>
            <CardDescription>
              Required columns: MatricNumber, FullName, Faculty, Department, Level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition-colors hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-slate-500 dark:hover:bg-slate-900"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file) void handleUpload(file)
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-10 w-10 text-slate-400" />
              <p className="mt-4 text-sm font-medium">Drag and drop a .csv file here</p>
              <p className="mt-1 text-sm text-muted-foreground">or click to browse (max 10 MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleUpload(file)
              }}
            />
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={uploadMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Select CSV File'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadMatricTemplate()}
                className="w-full sm:w-auto"
              >
                Download Template
              </Button>
            </div>

            {result && (
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Inserted" value={result.inserted} />
                <Metric label="Skipped" value={result.skipped} />
                <Metric label="Invalid" value={result.invalid} />
              </div>
            )}

            {result?.errors?.length ? (
              <ScrollArea className="h-32 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                <ul className="space-y-1 text-sm text-destructive">
                  {result.errors.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </ScrollArea>
            ) : null}

            {error && <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table2 className="h-5 w-5" />
              Records ({records.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading records...</p>
            ) : (
              <ScrollArea className="h-[520px] pr-4">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-3 font-medium">Matric</th>
                      <th className="p-3 font-medium">Name</th>
                      <th className="p-3 font-medium">Faculty</th>
                      <th className="p-3 font-medium">Level</th>
                      <th className="p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b last:border-b-0">
                        <td className="p-3">{record.matricNumber}</td>
                        <td className="p-3">{record.fullName}</td>
                        <td className="p-3">{record.faculty}</td>
                        <td className="p-3">{record.level}</td>
                        <td className="p-3">
                          <Badge variant={record.isUsed ? 'secondary' : 'success'}>
                            {record.isUsed ? 'Used' : 'Available'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}
