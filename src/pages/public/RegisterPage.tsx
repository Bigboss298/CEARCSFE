import { zodResolver } from '@hookform/resolvers/zod'
import type { UseFormReturn } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ArrowRight, BadgeCheck, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores'

const registerSchema = z.object({
  matricNumber: z.string().min(1, 'Matric number is required').max(20),
  fullName: z.string().min(1, 'Full name is required').max(150),
  email: z.email('Enter a valid email address').max(200),
  phoneNumber: z.string().min(1, 'Phone number is required').max(20),
  telegramUsername: z.string().max(100).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const registerStudent = useAuthStore((state) => state.registerStudent)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      matricNumber: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      telegramUsername: '',
      password: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    clearError()
    const payload = {
      ...values,
      telegramUsername: values.telegramUsername?.trim() || null,
    }
    await registerStudent(payload)
    navigate(paths.login, { replace: true, state: { registered: true } })
  })

  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <CardHeader className="space-y-4 border-b border-slate-200/70 bg-gradient-to-br from-slate-50 to-slate-100/80 p-6 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Student access
            </p>
            <CardTitle className="text-2xl">Student Registration</CardTitle>
          </div>
        </div>
        <CardDescription className="max-w-prose text-sm leading-6 text-slate-600 dark:text-slate-300">
          Register with your approved matric number to activate your emergency reporting account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="matricNumber" label="Matric Number" type="text" form={form} />
            <Field name="fullName" label="Full Name" type="text" form={form} />
            <Field name="email" label="Email" type="email" form={form} />
            <Field name="phoneNumber" label="Phone Number" type="tel" form={form} />
            <Field
              name="telegramUsername"
              label="Telegram Username"
              type="text"
              form={form}
              placeholder="Optional"
            />
            <Field name="password" label="Password" type="password" form={form} />
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
            <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
              <BadgeCheck className="h-4 w-4 text-emerald-500" />
              Before you register
            </div>
            <Separator className="my-3" />
            <ul className="space-y-2">
              <li>Use the exact matric number provided by your institution.</li>
              <li>Keep your Telegram handle current if you want emergency notifications.</li>
              <li>You will be redirected to the login page after successful registration.</li>
            </ul>
          </div>

          {error && <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}

          <Button type="submit" className="h-11 w-full shadow-md" disabled={isLoading}>
            <span>{isLoading ? 'Creating account...' : 'Register'}</span>
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground">
          Already registered?{' '}
          <Link className="font-medium text-foreground underline underline-offset-4" to={paths.login}>
            Sign in
          </Link>
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild variant="outline" className="h-11 justify-start">
            <Link to={paths.login}>Student Login</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 justify-start">
            <Link to={paths.adminLogin}>Administrator Login</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Field({
  form,
  name,
  label,
  type,
  placeholder,
}: {
  form: UseFormReturn<RegisterFormValues>
  name: keyof RegisterFormValues
  label: string
  type: string
  placeholder?: string
}) {
  return (
    <div className={name === 'password' ? 'sm:col-span-2' : ''}>
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input id={name} type={type} placeholder={placeholder} className="h-11" {...form.register(name)} />
        {form.formState.errors[name] && (
          <p className="text-sm text-destructive">{form.formState.errors[name]?.message}</p>
        )}
      </div>
    </div>
  )
}
