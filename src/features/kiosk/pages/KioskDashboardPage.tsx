import { useEffect } from 'react'
import { KIOSK_IDLE_TIMEOUT_MS } from '@/lib/constants'
import { playFireSiren, playMedicalChime, stopAllAudio } from '@/features/kiosk/utils/audio'
import { SingleAlertMap } from '@/features/alerts/components/AlertMap'
import { useAuthStore, selectAdminProfile, useKioskStore } from '@/stores'
import { UserRole } from '@/types/enums/user-role'
import { AlertType } from '@/types/enums/alert-type'
import { formatDateTime } from '@/utils/alert-theme'
import { buildGoogleMapsUrl } from '@/utils/maps'
import { cn } from '@/lib/utils'
import type { EmergencyBroadcastPayload } from '@/types/signalr/hub-payloads'

export function KioskDashboardPage() {
  const profile = selectAdminProfile(useAuthStore((s) => s.user))
  const role = profile?.role
  const activeEmergency = useKioskStore((s) => s.activeEmergency)
  const displayMode = useKioskStore((s) => s.displayMode)
  const audioPlaying = useKioskStore((s) => s.audioPlaying)
  const clearDisplay = useKioskStore((s) => s.clearDisplay)
  const setAudioPlaying = useKioskStore((s) => s.setAudioPlaying)

  useEffect(() => {
    if (!activeEmergency || !audioPlaying) {
      stopAllAudio()
      return
    }

    if (activeEmergency.alertType === AlertType.Fire) {
      playFireSiren()
    } else if (activeEmergency.alertType === AlertType.Medical) {
      playMedicalChime()
    }

    return () => stopAllAudio()
  }, [activeEmergency, audioPlaying])

  useEffect(() => {
    if (!activeEmergency) return

    const timer = window.setTimeout(() => {
      stopAllAudio()
      setAudioPlaying(false)
      clearDisplay()
    }, KIOSK_IDLE_TIMEOUT_MS)

    return () => window.clearTimeout(timer)
  }, [activeEmergency, clearDisplay, setAudioPlaying])

  if (!activeEmergency || displayMode === 'idle') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-sm uppercase tracking-[0.4em] text-white/50">CEARCS</p>
        <h1 className="mt-6 text-5xl font-bold">{role ?? 'Kiosk'}</h1>
        <p className="mt-4 max-w-xl text-xl text-white/60">Standby — monitoring for campus emergencies</p>
      </div>
    )
  }

  const isFacultyOrKiosk = role === UserRole.Faculty || role === UserRole.Kiosk
  const isFireKiosk = role === UserRole.FireKiosk
  const isClinicKiosk = role === UserRole.ClinicKiosk

  if (isFacultyOrKiosk && activeEmergency.alertType === AlertType.Fire) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-red-700 px-6 text-center">
        <h1 className="text-5xl font-black uppercase tracking-wide sm:text-7xl">
          Fire Evacuation In Progress
        </h1>
        <p className="mt-6 text-2xl">Follow evacuation routes immediately</p>
      </div>
    )
  }

  if (isFacultyOrKiosk && activeEmergency.alertType === AlertType.Security) {
    return (
      <div className={cn('flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center animate-pulse')}>
        <h1 className="text-5xl font-black uppercase text-orange-500 sm:text-7xl">Campus Lockdown</h1>
        <p className="mt-6 text-2xl text-white">Security emergency — shelter in place</p>
      </div>
    )
  }

  if (isFireKiosk && activeEmergency.alertType === AlertType.Fire) {
    return (
      <div className="flex min-h-screen flex-col bg-red-950 px-6 py-10 text-white">
        <h1 className="text-4xl font-black uppercase sm:text-6xl">Fire Emergency</h1>
        <KioskDetails emergency={activeEmergency} showMap />
      </div>
    )
  }

  if (isClinicKiosk && activeEmergency.alertType === AlertType.Medical) {
    return (
      <div className="flex min-h-screen flex-col bg-blue-950 px-6 py-10 text-white">
        <h1 className="text-4xl font-black uppercase sm:text-6xl">Medical Emergency</h1>
        <KioskDetails emergency={activeEmergency} showMap />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="text-xl text-white/70">Standby</p>
    </div>
  )
}

function KioskDetails({
  emergency,
  showMap,
}: {
  emergency: EmergencyBroadcastPayload
  showMap: boolean
}) {
  return (
    <div className="mt-8 space-y-6">
      <p className="text-2xl">
        {emergency.latitude.toFixed(6)}, {emergency.longitude.toFixed(6)}
      </p>
      <p className="text-lg text-white/80">Broadcasted: {formatDateTime(emergency.broadcastedAt)}</p>
      {emergency.autoEscalated && <p className="text-lg font-semibold text-amber-300">Auto-escalated alert</p>}
      <a
        className="inline-block text-lg underline"
        href={buildGoogleMapsUrl(emergency.latitude, emergency.longitude)}
        target="_blank"
        rel="noreferrer"
      >
        Open in Google Maps
      </a>
      {showMap && (
        <SingleAlertMap
          latitude={emergency.latitude}
          longitude={emergency.longitude}
          alertType={emergency.alertType}
          height="320px"
        />
      )}
    </div>
  )
}
