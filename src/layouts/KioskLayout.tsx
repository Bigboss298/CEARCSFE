import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { paths } from '@/routes/paths'
import { useAuthStore } from '@/stores'
import { Outlet } from 'react-router-dom'

export function KioskLayout() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
      navigate(paths.login, { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed left-4 top-4 z-50">
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
          className="border-white/20 bg-black/40 text-white hover:bg-white/10"
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
      <Outlet />
    </div>
  )
}
