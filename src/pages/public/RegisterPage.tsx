import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      telegramUsername: values.telegramUsername?.trim() || undefined,
    }
    await registerStudent(payload)
    navigate(paths.login, { replace: true, state: { registered: true } })
  })

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Student Registration</CardTitle>
        <CardDescription>Register using your approved matric number.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          {(
            [
              ['matricNumber', 'Matric Number', 'text'],
              ['fullName', 'Full Name', 'text'],
              ['email', 'Email', 'email'],
              ['phoneNumber', 'Phone Number', 'tel'],
              ['telegramUsername', 'Telegram Username (optional)', 'text'],
              ['password', 'Password', 'password'],
            ] as const
          ).map(([name, label, type]) => (
            <div className="space-y-2" key={name}>
              <Label htmlFor={name}>{label}</Label>
              <Input id={name} type={type} {...form.register(name)} />
              {form.formState.errors[name] && (
                <p className="text-sm text-destructive">{form.formState.errors[name]?.message}</p>
              )}
            </div>
          ))}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Register'}
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground">
          Already registered?{' '}
          <Link className="text-foreground underline" to={paths.login}>
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
