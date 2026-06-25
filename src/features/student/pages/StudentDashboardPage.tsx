import { useCallback } from 'react'
import { AlertApi } from '@/api/services'
import { unwrapApiError } from '@/api/client'
import { EmergencyButton } from '@/features/student/components/EmergencyButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useStudentStore } from '@/stores'
import { AlertType } from '@/types/enums/alert-type'
import { isWithinCampusBoundary } from '@/utils/geo'
import { formatDateTime, getAlertStatusVariant } from '@/utils/alert-theme'
import { buildGoogleMapsUrl } from '@/utils/maps'
import { Button } from '@/components/ui/button'

export function StudentDashboardPage() {
  const { requestLocation, isLoading: isLocating, error: geoError } = useGeolocation()
  const lastSubmittedAlert = useStudentStore((s) => s.lastSubmittedAlert)
  const submissionState = useStudentStore((s) => s.submissionState)
  const submissionError = useStudentStore((s) => s.submissionError)
  const activeEmergency = useStudentStore((s) => s.activeEmergency)
  const setSubmissionState = useStudentStore((s) => s.setSubmissionState)
  const setLastSubmittedAlert = useStudentStore((s) => s.setLastSubmittedAlert)
  const clearEmergency = useStudentStore((s) => s.clearEmergency)

  const submitAlert = useCallback(
    async (alertType: AlertType) => {
      setSubmissionState('locating')
      try {
        const { latitude, longitude } = await requestLocation()

        if (!isWithinCampusBoundary(latitude, longitude)) {
          throw new Error(
            'Your location is outside the campus boundary. Move within campus to report an emergency.',
          )
        }

        setSubmissionState('submitting')
        const { data } = await AlertApi.create({ alertType, latitude, longitude })
        setLastSubmittedAlert(data)
        setSubmissionState('success')
      } catch (error) {
        setSubmissionState('error', unwrapApiError(error))
      }
    },
    [requestLocation, setLastSubmittedAlert, setSubmissionState],
  )

  const isBusy =
    submissionState === 'locating' || submissionState === 'submitting' || isLocating

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      {activeEmergency && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Campus Emergency Broadcast</CardTitle>
            <CardDescription>
              A {activeEmergency.alertType} emergency has been broadcast. Follow safety protocols
              immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Location: {activeEmergency.latitude.toFixed(6)}, {activeEmergency.longitude.toFixed(6)}
            </p>
            <a
              className="text-sm text-blue-600 underline"
              href={buildGoogleMapsUrl(activeEmergency.latitude, activeEmergency.longitude)}
              target="_blank"
              rel="noreferrer"
            >
              View on Google Maps
            </a>
            {activeEmergency.autoEscalated && (
              <Badge variant="warning">Auto-escalated</Badge>
            )}
            <Button variant="outline" onClick={clearEmergency}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <h1 className="text-2xl font-bold">Emergency Reporting</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Press and hold a button for 1.5 seconds to report an emergency.
        </p>
      </div>

      <div className="flex flex-col gap-4">
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

      {(submissionState === 'locating' || submissionState === 'submitting') && (
        <p className="text-center text-sm font-medium">
          {submissionState === 'locating' ? 'Acquiring GPS location...' : 'Sending alert...'}
        </p>
      )}

      {submissionState === 'success' && (
        <p className="text-center text-sm font-medium text-emerald-600">Alert sent successfully.</p>
      )}

      {(submissionError || geoError) && submissionState === 'error' && (
        <p className="text-center text-sm text-destructive">{submissionError ?? geoError}</p>
      )}

      {lastSubmittedAlert && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Latest Alert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2">
              <Badge
                variant={
                  lastSubmittedAlert.alertType === AlertType.Fire
                    ? 'fire'
                    : lastSubmittedAlert.alertType === AlertType.Medical
                      ? 'medical'
                      : 'security'
                }
              >
                {lastSubmittedAlert.alertType}
              </Badge>
              <Badge variant={getAlertStatusVariant(lastSubmittedAlert.alertStatus)}>
                {lastSubmittedAlert.alertStatus}
              </Badge>
            </div>
            <p>Confidence: {lastSubmittedAlert.confidenceScore.toFixed(1)}</p>
            <p>Reporters: {lastSubmittedAlert.reporterCount}</p>
            <p>Submitted: {formatDateTime(lastSubmittedAlert.createdAt)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
