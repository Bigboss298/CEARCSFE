import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { paths } from '@/routes/paths'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Page Not Found</h1>
      <p className="text-sm text-muted-foreground">The page you requested does not exist.</p>
      <Button asChild>
        <Link to={paths.login}>Go to Login</Link>
      </Button>
    </div>
  )
}
