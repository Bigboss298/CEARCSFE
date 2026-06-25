import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { setUnauthorizedHandler } from '@/api/client'
import { getLoginPathForRole } from '@/auth/role-utils'
import { useSignalR } from '@/hooks/useSignalR'
import { router } from '@/routes'
import { alertHubService } from '@/services/signalr'
import { setupBackgroundMessaging } from '@/features/notifications/firebase'
import { useAuthStore } from '@/stores'
import { useNotificationStore } from '@/stores/notification.store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

alertHubService.bindQueryClient(queryClient)

function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuthStore((state) => state.restoreSession)
  const initializePermission = useNotificationStore((state) => state.initializePermission)

  useEffect(() => {
    initializePermission()
    void restoreSession()
  }, [initializePermission, restoreSession])

  return children
}

function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useSignalR()
  return children
}

function AppShell() {
  useEffect(() => {
    void setupBackgroundMessaging()
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      const { logout, role } = useAuthStore.getState()
      void logout().finally(() => {
        window.location.assign(getLoginPathForRole(role))
      })
    })
  }, [])

  return (
    <SessionBootstrap>
      <RealtimeProvider>
        <RouterProvider router={router} />
      </RealtimeProvider>
    </SessionBootstrap>
  )
}

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  )
}

export { queryClient }
