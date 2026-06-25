import { useRef, useState } from 'react'
import { useMatricRecordsQuery, useMatricUploadMutation, getMutationErrorMessage } from '@/api/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { MatricUploadResult } from '@/types'

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
      const { data } = await uploadMutation.mutateAsync(file)
      setResult(data)
    } catch (err) {
      setError(getMutationErrorMessage(err, 'Upload failed.'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Matric Records</h2>
        <p className="text-sm text-muted-foreground">Upload student whitelist CSV files</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
          <CardDescription>
            Required columns: MatricNumber, FullName, Faculty, Department, Level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files[0]
              if (file) void handleUpload(file)
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="font-medium">Drag and drop a .csv file here</p>
            <p className="text-sm text-muted-foreground">or click to browse (max 10 MB)</p>
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
          <Button
            type="button"
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Select CSV File'}
          </Button>

          {result && (
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-md border p-3 text-sm">
                <p className="text-muted-foreground">Inserted</p>
                <p className="text-2xl font-bold">{result.inserted}</p>
              </div>
              <div className="rounded-md border p-3 text-sm">
                <p className="text-muted-foreground">Skipped</p>
                <p className="text-2xl font-bold">{result.skipped}</p>
              </div>
              <div className="rounded-md border p-3 text-sm">
                <p className="text-muted-foreground">Invalid</p>
                <p className="text-2xl font-bold">{result.invalid}</p>
              </div>
            </div>
          )}

          {result?.errors?.length ? (
            <ScrollArea className="h-32 rounded-md border p-3">
              <ul className="space-y-1 text-sm text-destructive">
                {result.errors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </ScrollArea>
          ) : null}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Records ({records.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading records...</p>
          ) : (
            <ScrollArea className="h-[420px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Matric</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Faculty</th>
                    <th className="p-2">Level</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b">
                      <td className="p-2">{record.matricNumber}</td>
                      <td className="p-2">{record.fullName}</td>
                      <td className="p-2">{record.faculty}</td>
                      <td className="p-2">{record.level}</td>
                      <td className="p-2">
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
  )
}
