import type { AlertResponse } from '../dto/alert.dto'
import type { AlertType } from '../enums/alert-type'

export const HubEvents = {
  NewEmergencyAlert: 'NewEmergencyAlert',
  AlertAcknowledged: 'AlertAcknowledged',
  AlertResolved: 'AlertResolved',
  AlertClosed: 'AlertClosed',
  FireEmergency: 'FireEmergency',
  SecurityEmergency: 'SecurityEmergency',
  MedicalEmergency: 'MedicalEmergency',
} as const

export type HubEventName = (typeof HubEvents)[keyof typeof HubEvents]

export type NewEmergencyAlertPayload = AlertResponse

export interface AlertAcknowledgedPayload {
  alertId: string
  adminId: string
  acknowledgedAt: string
}

export interface AlertResolvedPayload {
  alertId: string
  adminId: string
  resolvedAt: string
}

export interface AlertClosedPayload {
  alertId: string
  adminId: string
  closedAt: string
}

export interface EmergencyBroadcastPayload {
  alertId: string
  alertType: AlertType
  latitude: number
  longitude: number
  broadcastedAt: string
  autoEscalated?: boolean
}

export type FireEmergencyPayload = EmergencyBroadcastPayload
export type SecurityEmergencyPayload = EmergencyBroadcastPayload
export type MedicalEmergencyPayload = EmergencyBroadcastPayload
