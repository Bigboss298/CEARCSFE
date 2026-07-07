import { useCallback, useEffect, useState } from 'react'
import { AlertApi } from '@/api/services'
import { unwrapApiError } from '@/api/client'
import { EmergencyButton } from '@/features/student/components/EmergencyButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useGeolocation } from '@/hooks/useGeolocation'
import {
  selectStudentProfile,
  useAuthStore,
  useNotificationStore,
  useSignalRStore,
  useStudentStore,
} from '@/stores'
import { AlertType } from '@/types/enums/alert-type'

import {
  formatDateTime,
  getAlertStatusLabel,
  getAlertStatusVariant,
  getAlertTypeLabel,
} from '@/utils/alert-theme'
import { buildGoogleMapsUrl } from '@/utils/maps'
import { HubConnectionState } from '@microsoft/signalr'
import { MapPinned, Radio, Send } from 'lucide-react'

export function StudentDashboardPage() {
  const { requestLocation, isLoading: isLocating, error: geoError, latitude, longitude, accuracy } =
    useGeolocation()
  const connectionState = useSignalRStore((s) => s.connectionState)
  const notificationRegistered = useNotificationStore((s) => s.isRegistered)
  const lastSubmittedAlert = useStudentStore((s) => s.lastSubmittedAlert)
  const submissionState = useStudentStore((s) => s.submissionState)
  const submissionError = useStudentStore((s) => s.submissionError)
  const activeEmergency = useStudentStore((s) => s.activeEmergency)
  const setSubmissionState = useStudentStore((s) => s.setSubmissionState)
  const setLastSubmittedAlert = useStudentStore((s) => s.setLastSubmittedAlert)
  const clearEmergency = useStudentStore((s) => s.clearEmergency)
  const [showToast, setShowToast] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (activeEmergency) {
      setShowToast(true)
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 8000)
      return () => clearTimeout(timer)
    } else {
      setShowToast(false)
      setShowDetailsModal(false)
    }
  }, [activeEmergency])

  const submitAlert = useCallback(
    async (alertType: AlertType) => {
      setSubmissionState('locating')
      try {
        const currentLocation = await requestLocation()

        setSubmissionState('submitting')
        const { data } = await AlertApi.create({ alertType, latitude: currentLocation.latitude, longitude: currentLocation.longitude })
        setLastSubmittedAlert(data)
        setSubmissionState('success')
      } catch (error) {
        setSubmissionState('error', unwrapApiError(error))
      }
    },
    [requestLocation, setLastSubmittedAlert, setSubmissionState],
  )

  const hasCoordinates = latitude !== null && longitude !== null
  const gpsStatus = hasCoordinates
    ? accuracy
      ? `Locked (${Math.round(accuracy)}m)`
      : 'Locked'
    : isLocating
      ? 'Acquiring...'
      : 'Not locked'
  const signalrStatus =
    connectionState === HubConnectionState.Connected
      ? 'Connected'
      : connectionState === HubConnectionState.Connecting
        ? 'Connecting'
        : connectionState === HubConnectionState.Reconnecting
          ? 'Reconnecting'
          : 'Disconnected'
  const notificationToken = useNotificationStore((s) => s.fcmToken)
  const deviceInfo = useNotificationStore((s) => s.deviceInfo)
  const pushStatus = notificationRegistered || deviceInfo?.token || notificationToken ? 'Registered' : 'Not registered'
  const user = useAuthStore((s) => s.user)
  const profile = selectStudentProfile(user)
  const telegramStatus =
    profile?.isTelegramLinked || profile?.telegramUsername ? 'Linked' : 'Not linked'

  const isBusy =
    submissionState === 'locating' || submissionState === 'submitting' || isLocating

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {activeEmergency && showToast && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="rounded-lg border border-destructive/40 bg-background/95 p-4 shadow-lg backdrop-blur-md dark:bg-zinc-900/95">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-red-600 animate-ping" />
                <h4 className="font-semibold text-destructive text-sm uppercase">
                  {getAlertTypeLabel(activeEmergency.alertType)} Emergency Broadcast
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowToast(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-medium"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Campus emergency reported. Follow safety protocols immediately.
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  setShowToast(false)
                  setShowDetailsModal(true)
                }}
              >
                View Details
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs"
                onClick={() => {
                  setShowToast(false)
                  clearEmergency()
                }}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Radio className="h-5 w-5 animate-pulse text-destructive" />
              Campus Emergency Broadcast Details
            </DialogTitle>
          </DialogHeader>
          {activeEmergency && (
            <div className="space-y-4 pt-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <StatItem label="Type" value={getAlertTypeLabel(activeEmergency.alertType)} />
                <StatItem
                  label="Location"
                  value={`${activeEmergency.latitude.toFixed(4)}, ${activeEmergency.longitude.toFixed(4)}`}
                />
                <StatItem
                  label="Broadcasted"
                  value={formatDateTime(
                    activeEmergency.broadcastedAt ||
                      (activeEmergency as unknown as Record<string, unknown>).createdAt ||
                      (activeEmergency as unknown as Record<string, unknown>).timestamp ||
                      (activeEmergency as unknown as Record<string, unknown>).reportedAt,
                  )}
                />
                <StatItem label="Mode" value={activeEmergency.autoEscalated ? 'Escalated' : 'Live'} />
              </div>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md border">
                <strong>Safety Instruction:</strong> A {getAlertTypeLabel(activeEmergency.alertType)} emergency is active on campus. Please follow all evacuation routes and security directives immediately.
              </p>
              <div className="flex flex-wrap gap-3 pt-2 justify-end">
                <Button asChild variant="outline">
                  <a
                    href={buildGoogleMapsUrl(activeEmergency.latitude, activeEmergency.longitude)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MapPinned className="mr-2 h-4 w-4" />
                    View on Google Maps
                  </a>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDetailsModal(false)
                    clearEmergency()
                  }}
                >
                  Dismiss Emergency
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-slate-200/70 shadow-sm dark:border-slate-800">
          <CardHeader className="space-y-2 border-b border-slate-200/70 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
            <CardTitle className="text-2xl">Emergency Reporting</CardTitle>
            <CardDescription>
              Press and hold a button for 1.5 seconds to report an emergency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-4 sm:p-6">
            <div className="grid gap-4">
              <EmergencyButton
                alertType={AlertType.Fire}
                label="FIRE"
                disabled={isBusy}
                onActivate={() => void submitAlert(AlertType.Fire)}
              />
              <EmergencyButton
                alertType={AlertType.Medical}
                label="MEDICAL"
                disabled={isBusy}
                onActivate={() => void submitAlert(AlertType.Medical)}
              />
              <EmergencyButton
                alertType={AlertType.Security}
                label="SECURITY"
                disabled={isBusy}
                onActivate={() => void submitAlert(AlertType.Security)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <StatusPill
                label="GPS"
                value={hasCoordinates ? 'Locked' : 'Idle'}
                tone={hasCoordinates ? 'success' : 'secondary'}
              />
              <StatusPill
                label="SignalR"
                value={connectionState}
                tone={connectionState === HubConnectionState.Connected ? 'success' : 'warning'}
              />
              <StatusPill
                label="Submission"
                value={submissionState}
                tone={submissionState === 'success' ? 'success' : submissionState === 'error' ? 'destructive' : 'secondary'}
              />
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 sm:grid-cols-3">
              <Metric label="Latitude" value={latitude?.toFixed(6) ?? '—'} />
              <Metric label="Longitude" value={longitude?.toFixed(6) ?? '—'} />
              <Metric label="Accuracy" value={accuracy ? `${Math.round(accuracy)}m` : '—'} />
            </div>

            {(submissionState === 'locating' || submissionState === 'submitting') && (
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                <Radio className="h-4 w-4 animate-pulse" />
                {submissionState === 'locating' ? 'Acquiring GPS location...' : 'Sending alert...'}
              </div>
            )}

            {submissionState === 'success' && (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                <Send className="h-4 w-4" />
                Alert sent successfully.
              </div>
            )}

            {(submissionError || geoError) && submissionState === 'error' && (
              <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {submissionError ?? geoError}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <CompactStatusCard label="SignalR" value={signalrStatus} tone={signalrTone(signalrStatus)} />
          <CompactStatusCard label="Push Registration" value={pushStatus} tone={pushTone(pushStatus)} />
          <CompactStatusCard label="Telegram" value={telegramStatus} tone={telegramTone(telegramStatus)} />
          <CompactStatusCard label="GPS" value={gpsStatus} tone={gpsTone(gpsStatus)} />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Last Emergency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {lastSubmittedAlert ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        lastSubmittedAlert.alertType === AlertType.Fire
                          ? 'fire'
                          : lastSubmittedAlert.alertType === AlertType.Medical
                            ? 'medical'
                            : 'security'
                      }
                    >
                      {getAlertTypeLabel(lastSubmittedAlert.alertType)}
                    </Badge>
                    <Badge variant={getAlertStatusVariant(lastSubmittedAlert.alertStatus)}>
                      {getAlertStatusLabel(lastSubmittedAlert.alertStatus)}
                    </Badge>
                  </div>
                  <StatItem label="Confidence" value={lastSubmittedAlert.confidenceScore.toFixed(1)} />
                  <StatItem label="Reporters" value={String(lastSubmittedAlert.reporterCount)} />
                  <StatItem label="Submitted" value={formatDateTime(lastSubmittedAlert.createdAt)} />
                </>
              ) : (
                <p className="text-muted-foreground">No alert submitted yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function CompactStatusCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'success' | 'warning' | 'secondary' | 'destructive'
}) {
  return (
    <Card className="flex items-center justify-between p-3.5 shadow-sm transition-all hover:shadow">
      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <Badge variant={tone}>{value}</Badge>
    </Card>
  )
}

function StatusPill({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'success' | 'warning' | 'secondary' | 'destructive'
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p>
      <Badge variant={tone} className="mt-3">
        {value}
      </Badge>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 font-medium text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function gpsTone(value: string) {
  if (value.startsWith('Locked')) return 'success'
  if (value === 'Acquiring') return 'warning'
  return 'secondary'
}

function signalrTone(value: string) {
  if (value === 'Connected') return 'success'
  if (value === 'Connecting' || value === 'Reconnecting') return 'warning'
  return 'secondary'
}

function pushTone(value: string) {
  if (value === 'Registered') return 'success'
  return 'secondary'
}

function telegramTone(value: string) {
  if (value === 'Linked' || value.startsWith('Linked')) return 'success'
  return 'secondary'
}
