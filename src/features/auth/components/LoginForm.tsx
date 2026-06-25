import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores'

export type LoginType = 'student' | 'staff'

const studentSchema = z.object({
  matricNumber: z.string().min(1, 'Matric number is required'),
  password: z.string().min(1, 'Password is required'),
})

const staffSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type StudentFormValues = z.infer<typeof studentSchema>
type StaffFormValues = z.infer<typeof staffSchema>

export function LoginForm() {
  const navigate = useNavigate()
  const [loginType, setLoginType] = useState<LoginType>('student')
  const loginStudent = useAuthStore((state) => state.loginStudent)
  const loginAdmin = useAuthStore((state) => state.loginAdmin)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)

  const studentForm = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { matricNumber: '', password: '' },
  })

  const staffForm = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: { username: '', password: '' },
  })

  const handleStudentSubmit = studentForm.handleSubmit(async (values) => {
    clearError()
    const redirectPath = await loginStudent(values)
    navigate(redirectPath, { replace: true })
  })

  const handleStaffSubmit = staffForm.handleSubmit(async (values) => {
    clearError()
    const redirectPath = await loginAdmin(values)
    navigate(redirectPath, { replace: true })
  })

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>CEARCS Login</CardTitle>
        <CardDescription>
          Campus Emergency Alert and Response Communication System
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={loginType}
          onValueChange={(value) => {
            setLoginType(value as LoginType)
            clearError()
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="staff">Admin / Faculty / Kiosk</TabsTrigger>
          </TabsList>

          <TabsContent value="student" className="mt-4">
            <form className="space-y-4" onSubmit={handleStudentSubmit}>
              <div className="space-y-2">
                <Label htmlFor="matricNumber">Matric Number</Label>
                <Input
                  id="matricNumber"
                  autoComplete="username"
                  {...studentForm.register('matricNumber')}
                />
                {studentForm.formState.errors.matricNumber && (
                  <p className="text-sm text-destructive">
                    {studentForm.formState.errors.matricNumber.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentPassword">Password</Label>
                <Input
                  id="studentPassword"
                  type="password"
                  autoComplete="current-password"
                  {...studentForm.register('password')}
                />
                {studentForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {studentForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              {error && loginType === 'student' && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In as Student'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="staff" className="mt-4">
            <form className="space-y-4" onSubmit={handleStaffSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" autoComplete="username" {...staffForm.register('username')} />
                {staffForm.formState.errors.username && (
                  <p className="text-sm text-destructive">
                    {staffForm.formState.errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffPassword">Password</Label>
                <Input
                  id="staffPassword"
                  type="password"
                  autoComplete="current-password"
                  {...staffForm.register('password')}
                />
                {staffForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {staffForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              {error && loginType === 'staff' && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-sm text-muted-foreground">
          New student?{' '}
          <Link className="text-foreground underline" to={paths.register}>
            Register here
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
