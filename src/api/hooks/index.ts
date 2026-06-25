import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminApi, AlertApi, MatricApi } from '@/api/services'
import { queryKeys } from '@/api/query-keys'
import { unwrapApiError } from '@/api/client'

export function useAlertsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.alerts.all,
    queryFn: async () => {
      const { data } = await AlertApi.getAll()
      return data
    },
    enabled,
  })
}

export function useAlertDetailQuery(id: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.alerts.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Alert id is required')
      const { data } = await AlertApi.getById(id)
      return data
    },
    enabled: enabled && Boolean(id),
  })
}

export function useDashboardQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: async () => {
      const { data } = await AdminApi.getDashboard()
      return data
    },
    enabled,
  })
}

export function useMatricRecordsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.matric.all,
    queryFn: async () => {
      const { data } = await MatricApi.getAll()
      return data
    },
    enabled,
  })
}

export function useAcknowledgeAlertMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => AlertApi.acknowledge(id),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts.detail(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats }),
      ])
    },
    meta: { errorMessage: 'Failed to acknowledge alert.' },
  })
}

export function useResolveAlertMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => AlertApi.resolve(id),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts.detail(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats }),
      ])
    },
  })
}

export function useCloseAlertMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => AlertApi.close(id),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts.detail(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats }),
      ])
    },
  })
}

export function useBroadcastAlertMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: AdminApi.broadcast,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats }),
      ])
    },
  })
}

export function useMatricUploadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => MatricApi.upload(file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.matric.all })
    },
  })
}

export function getMutationErrorMessage(error: unknown, fallback: string): string {
  return unwrapApiError(error) || fallback
}
