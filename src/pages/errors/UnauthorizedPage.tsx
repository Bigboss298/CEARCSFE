import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { paths } from '@/routes/paths'

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Unauthorized</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Your account does not have permission to access this area.
      </p>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link to={paths.login}>Back to Login</Link>
        </Button>
      </div>
    </div>
  )
}
