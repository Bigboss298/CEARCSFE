import type { AlertResponse } from './alert.dto'

export interface DashboardResponse {
  totalAlerts: number
  pendingAlerts: number
  acknowledgedAlerts: number
  broadcastedAlerts: number
  autoEscalatedAlerts: number
  resolvedAlerts: number
  closedAlerts: number
  fireAlertsToday: number
  medicalAlertsToday: number
  securityAlertsToday: number
  activeAlerts: number
  recentAlerts: AlertResponse[]
}
