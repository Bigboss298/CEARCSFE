import { zodResolver } from '@hookform/resolvers/zod'
import type { ComponentType } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores'

const studentSchema = z.object({
  matricNumber: z.string().min(1, 'Matric number is required'),
  password: z.string().min(1, 'Password is required'),
})

const adminSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type StudentFormValues = z.infer<typeof studentSchema>
type AdminFormValues = z.infer<typeof adminSchema>

type LoginVariant = 'student' | 'admin'

interface LoginFormProps {
  variant: LoginVariant
}

const copy = {
  student: {
    eyebrow: 'Student access',
    title: 'Student Login',
    description: 'Sign in to report emergencies and manage your profile.',
    icon: GraduationCap,
    submitLabel: 'Sign In as Student',
  },
  admin: {
    eyebrow: 'Administrative access',
    title: 'Administrator Login',
    description: 'Use your staff credentials to access the command center.',
    icon: ShieldCheck,
    submitLabel: 'Sign In',
  },
} satisfies Record<
  LoginVariant,
  {
    eyebrow: string
    title: string
    description: string
    icon: ComponentType<{ className?: string }>
    submitLabel: string
  }
>

export function LoginForm({ variant }: LoginFormProps) {
  const navigate = useNavigate()
  const loginStudent = useAuthStore((state) => state.loginStudent)
  const loginAdmin = useAuthStore((state) => state.loginAdmin)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)
  const config = copy[variant]
  const Icon = config.icon

  const studentForm = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { matricNumber: '', password: '' },
  })

  const adminForm = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: { username: '', password: '' },
  })

  const handleStudentSubmit = studentForm.handleSubmit(async (values) => {
    clearError()
    try {
      const redirectPath = await loginStudent(values)
      navigate(redirectPath, { replace: true })
    } catch {
      // Error is stored in auth store and displayed in UI
    }
  })

  const handleAdminSubmit = adminForm.handleSubmit(async (values) => {
    clearError()
    try {
      const redirectPath = await loginAdmin(values)
      navigate(redirectPath, { replace: true })
    } catch {
      // Error is stored in auth store and displayed in UI
    }
  })

  const footerLinks =
    variant === 'student'
      ? [
          { label: 'Register', href: paths.register },
          { label: 'Administrator Login', href: paths.adminLogin },
        ]
      : [
          { label: 'Student Login', href: paths.login },
          { label: 'Student Registration', href: paths.register },
        ]

  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <CardHeader className="space-y-4 border-b border-slate-200/70 bg-gradient-to-br from-slate-50 to-slate-100/80 p-6 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              {config.eyebrow}
            </p>
            <CardTitle className="text-2xl">{config.title}</CardTitle>
          </div>
        </div>
        <CardDescription className="max-w-prose text-sm leading-6 text-slate-600 dark:text-slate-300">
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        <form
          className="space-y-4"
          onSubmit={variant === 'student' ? handleStudentSubmit : handleAdminSubmit}
        >
          {variant === 'student' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="matricNumber">Matric Number</Label>
                <Input
                  id="matricNumber"
                  autoComplete="username"
                  className="h-11"
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
                  className="h-11"
                  {...studentForm.register('password')}
                />
                {studentForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {studentForm.formState.errors.password.message}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  className="h-11"
                  {...adminForm.register('username')}
                />
                {adminForm.formState.errors.username && (
                  <p className="text-sm text-destructive">
                    {adminForm.formState.errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  autoComplete="current-password"
                  className="h-11"
                  {...adminForm.register('password')}
                />
                {adminForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {adminForm.formState.errors.password.message}
                  </p>
                )}
              </div>
            </>
          )}

          {error && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="h-11 w-full shadow-md" disabled={isLoading}>
            <span>{isLoading ? 'Signing in...' : config.submitLabel}</span>
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <div className="space-y-3">
          <Separator />
          <div className="grid gap-2 sm:grid-cols-2">
            {footerLinks.map((link) => (
              <Button
                key={link.href}
                asChild
                variant={link.href === paths.adminLogin && variant === 'admin' ? 'secondary' : 'outline'}
                className="h-11 justify-start"
              >
                <Link to={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
