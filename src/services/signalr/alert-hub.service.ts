import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'
import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/api/query-keys'
import { env } from '@/lib/env'
import { getAlertTypeLabel } from '@/utils/alert-theme'
import { useAuthStore } from '@/stores/auth.store'
import { useKioskStore } from '@/stores/kiosk.store'
import { useSignalRStore } from '@/stores/signalr.store'
import { useStudentStore } from '@/stores/student.store'
import { UserRole } from '@/types/enums/user-role'
import { AlertType, parseAlertType } from '@/types/enums/alert-type'
import type {
  AlertAcknowledgedPayload,
  AlertClosedPayload,
  AlertResolvedPayload,
  EmergencyBroadcastPayload,
  NewEmergencyAlertPayload,
} from '@/types/signalr/hub-payloads'
import { HubEvents } from '@/types/signalr/hub-payloads'
import { AlertStatus } from '@/types/enums/alert-status'

class AlertHubService {
  private connection: HubConnection | null = null
  private queryClient: QueryClient | null = null
  private connectPromise: Promise<void> | null = null
  private reconnectTimer: number | null = null

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      window.clearInterval(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private scheduleInfiniteRecovery(): void {
    if (this.reconnectTimer !== null) return
    this.reconnectTimer = window.setInterval(() => {
      if (this.connection?.state === HubConnectionState.Connected || this.connectPromise) {
        this.clearReconnectTimer()
        return
      }
      const token = useAuthStore.getState().token
      if (!token) {
        this.clearReconnectTimer()
        return
      }
      void this.connect(token).catch(() => {
        // Will continue retrying on the next interval
      })
    }, 15000)
  }

  bindQueryClient(queryClient: QueryClient): void {
    this.queryClient = queryClient
  }

  async connect(accessToken: string): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      this.clearReconnectTimer()
      return
    }
    if (this.connectPromise) return this.connectPromise

    this.connectPromise = this.startConnection(accessToken)
    try {
      await this.connectPromise
      this.clearReconnectTimer()
    } catch (error) {
      if (useAuthStore.getState().token) {
        this.scheduleInfiniteRecovery()
      }
      throw error
    } finally {
      this.connectPromise = null
    }
  }

  async disconnect(): Promise<void> {
    this.clearReconnectTimer()
    if (!this.connection) return

    this.connection.off(HubEvents.NewEmergencyAlert)
    this.connection.off(HubEvents.AlertAcknowledged)
    this.connection.off(HubEvents.AlertResolved)
    this.connection.off(HubEvents.AlertClosed)
    this.connection.off(HubEvents.FireEmergency)
    this.connection.off(HubEvents.SecurityEmergency)
    this.connection.off(HubEvents.MedicalEmergency)

    await this.connection.stop()
    this.connection = null
    useSignalRStore.getState().setConnectionState('Disconnected')
    useKioskStore.getState().reset()
    useStudentStore.getState().clearEmergency()
  }

  getConnectionState(): HubConnectionState | 'Disconnected' {
    return this.connection?.state ?? 'Disconnected'
  }

  private async startConnection(accessToken: string): Promise<void> {
    if (this.connection) {
      await this.disconnect()
    }

    const connection = new HubConnectionBuilder()
      .withUrl(env.signalRHubUrl, {
        accessTokenFactory: () => accessToken,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
      .build()

    this.registerHandlers(connection)
    this.registerLifecycleHandlers(connection)

    this.connection = connection
    useSignalRStore.getState().setConnectionState(HubConnectionState.Connecting)

    await connection.start()
    useSignalRStore.getState().setConnectionState(connection.state)
  }

  private registerLifecycleHandlers(connection: HubConnection): void {
    connection.onreconnecting(() => {
      useSignalRStore.getState().setConnectionState(HubConnectionState.Reconnecting)
    })

    connection.onreconnected(() => {
      this.clearReconnectTimer()
      useSignalRStore.getState().setConnectionState(HubConnectionState.Connected)
      useSignalRStore.getState().setError(null)
    })

    connection.onclose((error) => {
      useSignalRStore.getState().setConnectionState('Disconnected')
      if (error) {
        useSignalRStore.getState().setError(error.message)
      }
      if (useAuthStore.getState().token) {
        this.scheduleInfiniteRecovery()
      }
    })
  }

  private registerHandlers(connection: HubConnection): void {
    connection.on(HubEvents.NewEmergencyAlert, (payload: NewEmergencyAlertPayload) => {
      useSignalRStore.getState().setLastNewEmergencyAlert(payload)
      void this.invalidateAdminQueries()
    })

    connection.on(HubEvents.AlertAcknowledged, (payload: AlertAcknowledgedPayload) => {
      void this.patchAlertStatus(payload.alertId, AlertStatus.Acknowledged)
    })

    connection.on(HubEvents.AlertResolved, (payload: AlertResolvedPayload) => {
      const raw = (payload || {}) as unknown as Record<string, unknown>
      const resolvedId = String(raw.alertId ?? raw.id ?? raw.AlertId ?? raw.Id ?? (typeof payload === 'string' ? payload : '')).trim().toLowerCase()
      if (resolvedId) {
        void this.patchAlertStatus(resolvedId, AlertStatus.Resolved)
      }
      const active = useKioskStore.getState().activeEmergency
      const rawActive = (active || {}) as unknown as Record<string, unknown>
      const activeId = String(rawActive.alertId ?? rawActive.id ?? rawActive.AlertId ?? rawActive.Id ?? '').trim().toLowerCase()
      if (!active || !activeId || !resolvedId || activeId === resolvedId) {
        useKioskStore.getState().clearDisplay()
      }
      useStudentStore.getState().clearEmergency()
    })

    connection.on(HubEvents.AlertClosed, (payload: AlertClosedPayload) => {
      const raw = (payload || {}) as unknown as Record<string, unknown>
      const closedId = String(raw.alertId ?? raw.id ?? raw.AlertId ?? raw.Id ?? (typeof payload === 'string' ? payload : '')).trim().toLowerCase()
      if (closedId) {
        void this.patchAlertStatus(closedId, AlertStatus.Closed)
      }
      const active = useKioskStore.getState().activeEmergency
      const rawActive = (active || {}) as unknown as Record<string, unknown>
      const activeId = String(rawActive.alertId ?? rawActive.id ?? rawActive.AlertId ?? rawActive.Id ?? '').trim().toLowerCase()
      if (!active || !activeId || !closedId || activeId === closedId) {
        useKioskStore.getState().clearDisplay()
      }
      useStudentStore.getState().clearEmergency()
    })

    connection.on(HubEvents.FireEmergency, (payload: EmergencyBroadcastPayload) => {
      this.routeEmergency(payload)
    })

    connection.on(HubEvents.SecurityEmergency, (payload: EmergencyBroadcastPayload) => {
      this.routeEmergency(payload)
    })

    connection.on(HubEvents.MedicalEmergency, (payload: EmergencyBroadcastPayload) => {
      this.routeEmergency(payload)
    })
  }

  private routeEmergency(payload: EmergencyBroadcastPayload): void {
    const role = useAuthStore.getState().role
    if (!role) return

    const raw = (payload || {}) as unknown as Record<string, unknown>
    const normalizedId = String(raw.alertId ?? raw.id ?? raw.AlertId ?? raw.Id ?? '')
    const bestTimestamp = String(
      raw.createdAt ??
        raw.CreatedAt ??
        raw.timestamp ??
        raw.Timestamp ??
        raw.reportedAt ??
        raw.ReportedAt ??
        raw.lastReportedAt ??
        raw.LastReportedAt ??
        raw.broadcastedAt ??
        raw.BroadcastedAt ??
        '',
    )
    const rawBroadcasted = String(raw.broadcastedAt ?? raw.BroadcastedAt ?? '')
    const validTimestamp =
      !rawBroadcasted || rawBroadcasted.startsWith('0001-01-01')
        ? bestTimestamp && !bestTimestamp.startsWith('0001-01-01')
          ? bestTimestamp
          : new Date().toISOString()
        : rawBroadcasted

    const normalizedType = parseAlertType(payload.alertType) ?? payload.alertType
    const normalizedPayload: EmergencyBroadcastPayload = {
      ...payload,
      alertId: normalizedId || payload.alertId,
      alertType: normalizedType,
      broadcastedAt: validTimestamp || payload.broadcastedAt,
    }

    if (role === UserRole.Student) {
      if (normalizedPayload.alertType === AlertType.Fire || normalizedPayload.alertType === AlertType.Security) {
        useStudentStore.getState().setActiveEmergency(normalizedPayload)
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(`EMERGENCY: ${getAlertTypeLabel(normalizedPayload.alertType)}`, {
            body: 'An emergency has been reported on campus. Please follow safety protocols immediately.',
            icon: '/favicon.svg',
          })
        }
      }
      return
    }

    useKioskStore.getState().evaluateEmergency(normalizedPayload, role)
  }

  private async patchAlertStatus(alertId: string, alertStatus: AlertStatus): Promise<void> {
    await this.invalidateAdminQueries()

    this.queryClient?.setQueryData(queryKeys.alerts.detail(alertId), (existing) => {
      if (!existing || typeof existing !== 'object') return existing
      return { ...existing, alertStatus }
    })
  }

  private async invalidateAdminQueries(): Promise<void> {
    if (!this.queryClient) return

    await Promise.all([
      this.queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all }),
      this.queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats }),
    ])
  }
}

export const alertHubService = new AlertHubService()
