import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'
import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/api/query-keys'
import { env } from '@/lib/env'
import { useAuthStore } from '@/stores/auth.store'
import { useKioskStore } from '@/stores/kiosk.store'
import { useSignalRStore } from '@/stores/signalr.store'
import { useStudentStore } from '@/stores/student.store'
import { UserRole } from '@/types/enums/user-role'
import { AlertType } from '@/types/enums/alert-type'
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

  bindQueryClient(queryClient: QueryClient): void {
    this.queryClient = queryClient
  }

  async connect(accessToken: string): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) return
    if (this.connectPromise) return this.connectPromise

    this.connectPromise = this.startConnection(accessToken)
    try {
      await this.connectPromise
    } finally {
      this.connectPromise = null
    }
  }

  async disconnect(): Promise<void> {
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
      useSignalRStore.getState().setConnectionState(HubConnectionState.Connected)
      useSignalRStore.getState().setError(null)
    })

    connection.onclose((error) => {
      useSignalRStore.getState().setConnectionState('Disconnected')
      if (error) {
        useSignalRStore.getState().setError(error.message)
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
      void this.patchAlertStatus(payload.alertId, AlertStatus.Resolved)
      useKioskStore.getState().clearDisplay()
      useStudentStore.getState().clearEmergency()
    })

    connection.on(HubEvents.AlertClosed, (payload: AlertClosedPayload) => {
      void this.patchAlertStatus(payload.alertId, AlertStatus.Closed)
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

    if (role === UserRole.Student) {
      if (payload.alertType === AlertType.Fire || payload.alertType === AlertType.Security) {
        useStudentStore.getState().setActiveEmergency(payload)
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(`🚨 EMERGENCY: ${payload.alertType}`, {
            body: 'An emergency has been reported on campus. Please follow safety protocols immediately.',
            icon: '/favicon.svg',
          })
        }
      }
      return
    }

    useKioskStore.getState().evaluateEmergency(payload, role)
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
