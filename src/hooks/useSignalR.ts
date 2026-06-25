import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { alertHubService } from '@/services/signalr'
import { useAuthStore } from '@/stores'

export function useSignalR(): void {
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    alertHubService.bindQueryClient(queryClient)
  }, [queryClient])

  useEffect(() => {
    if (!isAuthenticated || !token) return

    void alertHubService.connect(token).catch(() => {
      // Connection errors are surfaced via signalr store lifecycle handlers.
    })
  }, [isAuthenticated, token])
}
