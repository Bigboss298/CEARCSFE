import type { AlertStatus } from '../enums/alert-status'
import type { AlertType } from '../enums/alert-type'

export interface CreateAlertRequest {
  alertType: AlertType
  latitude: number
  longitude: number
}

export interface AlertResponse {
  id: string
  studentId: string
  studentFullName: string
  alertType: AlertType
  latitude: number
  longitude: number
  alertStatus: AlertStatus
  confidenceScore: number
  reporterCount: number
  adminResponseDeadline: string
  lastReportedAt: string
  createdAt: string
}

export interface AlertReporterDto {
  studentId: string
  studentFullName: string
  reportedAt: string
}

export interface AlertDetailsResponse {
  id: string
  studentId: string
  studentFullName: string
  alertType: AlertType
  latitude: number
  longitude: number
  alertStatus: AlertStatus
  confidenceScore: number
  adminResponseDeadline: string
  lastReportedAt: string
  createdAt: string
  reporters: AlertReporterDto[]
}

export interface BroadcastAlertRequest {
  alertId: string
  alertType: AlertType
}

export interface AlertStatusChangePayload {
  alertId: string
  adminId: string
  acknowledgedAt?: string
  resolvedAt?: string
  closedAt?: string
}
