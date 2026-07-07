import { useEffect, useState } from 'react'
import { KIOSK_IDLE_TIMEOUT_MS } from '@/lib/constants'
import { playFireSiren, playMedicalChime, stopAllAudio, initializeAudioContext } from '@/features/kiosk/utils/audio'
import { SingleAlertMap } from '@/features/alerts/components/AlertMap'
import { useAuthStore, selectAdminProfile, useKioskStore, useSignalRStore } from '@/stores'
import { AlertType, parseAlertType } from '@/types/enums/alert-type'
import { formatDateTime, getUserRoleLabel, getAlertTypeLabel } from '@/utils/alert-theme'
import { buildGoogleMapsUrl } from '@/utils/maps'
import { cn } from '@/lib/utils'
import type { EmergencyBroadcastPayload } from '@/types/signalr/hub-payloads'
import { Button } from '@/components/ui/button'

function KioskConnectionStatus({ connectionState }: { connectionState: string }) {
  let statusText = 'Offline'
  let dotColor = 'bg-red-500'

  if (connectionState === 'Connected') {
    statusText = 'Connected'
    dotColor = 'bg-green-500'
  } else if (connectionState === 'Connecting') {
    statusText = 'Connecting'
    dotColor = 'bg-yellow-500 animate-pulse'
  } else if (connectionState === 'Reconnecting') {
    statusText = 'Reconnecting'
    dotColor = 'bg-amber-500 animate-pulse'
  }

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-full bg-black/60 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md border border-white/10 shadow-lg">
      <span className={cn('h-2 w-2 rounded-full', dotColor)} />
      <span>{statusText}</span>
    </div>
  )
}

export function KioskDashboardPage() {
  const profile = selectAdminProfile(useAuthStore((s) => s.user))
  const role = profile?.role
  const activeEmergency = useKioskStore((s) => s.activeEmergency)
  const displayMode = useKioskStore((s) => s.displayMode)
  const audioPlaying = useKioskStore((s) => s.audioPlaying)
  const audioUnlocked = useKioskStore((s) => s.audioUnlocked)
  const clearDisplay = useKioskStore((s) => s.clearDisplay)
  const setAudioPlaying = useKioskStore((s) => s.setAudioPlaying)
  const setAudioUnlocked = useKioskStore((s) => s.setAudioUnlocked)
  const connectionState = useSignalRStore((s) => s.connectionState)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    useKioskStore.getState().restoreEmergency(role)
  }, [role])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        Boolean(
          document.fullscreenElement ||
            (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement,
        ),
      )
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [])

  useEffect(() => {
    if (!activeEmergency || !audioPlaying) {
      stopAllAudio()
      return
    }

    const type = parseAlertType(activeEmergency.alertType)
    if (type === AlertType.Fire) {
      playFireSiren()
    } else if (type === AlertType.Medical) {
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

  async function handleInitializeAudio() {
    const success = await initializeAudioContext()
    if (success) {
      setAudioUnlocked(true)
    }
  }

  function toggleFullscreen() {
    if (!isFullscreen) {
      const elem = document.documentElement as unknown as {
        requestFullscreen?: () => Promise<void>
        webkitRequestFullscreen?: () => Promise<void>
      }
      if (elem.requestFullscreen) {
        void elem.requestFullscreen()
      } else if (elem.webkitRequestFullscreen) {
        void elem.webkitRequestFullscreen()
      }
    } else {
      const doc = document as unknown as {
        exitFullscreen?: () => Promise<void>
        webkitExitFullscreen?: () => Promise<void>
      }
      if (doc.exitFullscreen) {
        void doc.exitFullscreen()
      } else if (doc.webkitExitFullscreen) {
        void doc.webkitExitFullscreen()
      }
    }
  }

  if (!activeEmergency || displayMode === 'idle') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <KioskConnectionStatus connectionState={connectionState} />
        <p className="text-sm uppercase tracking-[0.4em] text-white/50">CEARCS</p>
        <h1 className="mt-6 text-5xl font-bold">{role ? getUserRoleLabel(role) : 'Kiosk'}</h1>
        <p className="mt-4 max-w-xl text-xl text-white/60">Standby — monitoring for campus emergencies</p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {!audioUnlocked ? (
            <Button
              onClick={handleInitializeAudio}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/20 text-base px-6 py-5 rounded-full font-medium transition-all shadow-md"
            >
              Initialize Kiosk Audio
            </Button>
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-green-500/20 px-4 py-2.5 text-sm font-medium text-green-300 border border-green-500/30">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              <span>Audio Initialized (Ready)</span>
            </div>
          )}

          <Button
            onClick={toggleFullscreen}
            variant="outline"
            className="bg-transparent hover:bg-white/10 text-white/80 border-white/20 text-base px-6 py-5 rounded-full transition-all"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          </Button>
        </div>
      </div>
    )
  }

  const roleStr = typeof role === 'string' ? role.toLowerCase() : ''
  const isFacultyOrKiosk = roleStr === 'faculty' || roleStr === 'kiosk'
  const isFireKiosk = roleStr === 'firekiosk'
  const isClinicKiosk = roleStr === 'clinickiosk'
  const currentAlertType = activeEmergency ? parseAlertType(activeEmergency.alertType) : null

  if (isFacultyOrKiosk && currentAlertType === AlertType.Fire) {
    return (
      <div className="flex min-h-screen flex-col bg-red-950 px-6 py-10 text-white">
        <KioskConnectionStatus connectionState={connectionState} />
        <h1 className="text-4xl font-black uppercase sm:text-6xl text-center">
          Fire Evacuation In Progress
        </h1>
        <p className="mt-4 text-2xl text-center font-semibold text-red-200">
          Instruction: Follow evacuation routes immediately
        </p>
        <KioskDetails emergency={activeEmergency} showMap />
      </div>
    )
  }

  if (isFacultyOrKiosk && currentAlertType === AlertType.Security) {
    return (
      <div className="flex min-h-screen flex-col bg-black px-6 py-10 text-white animate-pulse">
        <KioskConnectionStatus connectionState={connectionState} />
        <h1 className="text-4xl font-black uppercase text-orange-500 sm:text-6xl text-center">
          Campus Lockdown
        </h1>
        <p className="mt-4 text-2xl text-center font-semibold text-orange-200">
          Instruction: Security emergency — shelter in place and lock all doors
        </p>
        <KioskDetails emergency={activeEmergency} showMap />
      </div>
    )
  }

  if (isFireKiosk && currentAlertType === AlertType.Fire) {
    return (
      <div className="flex min-h-screen flex-col bg-red-950 px-6 py-10 text-white">
        <KioskConnectionStatus connectionState={connectionState} />
        <h1 className="text-4xl font-black uppercase sm:text-6xl text-center">Fire Emergency</h1>
        <p className="mt-4 text-2xl text-center font-semibold text-red-200">
          Instruction: Dispatch emergency firefighting units immediately
        </p>
        <KioskDetails emergency={activeEmergency} showMap />
      </div>
    )
  }

  if (isClinicKiosk && currentAlertType === AlertType.Medical) {
    return (
      <div className="flex min-h-screen flex-col bg-blue-950 px-6 py-10 text-white">
        <KioskConnectionStatus connectionState={connectionState} />
        <h1 className="text-4xl font-black uppercase sm:text-6xl text-center">Medical Emergency</h1>
        <p className="mt-4 text-2xl text-center font-semibold text-blue-200">
          Instruction: Dispatch medical emergency response personnel immediately
        </p>
        <KioskDetails emergency={activeEmergency} showMap />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <KioskConnectionStatus connectionState={connectionState} />
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
    <div className="mt-8 space-y-6 text-left max-w-4xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
        <div>
          <span className="text-sm uppercase tracking-wider text-white/70">Emergency Type</span>
          <p className="text-2xl font-bold uppercase tracking-wide text-amber-300">
            {getAlertTypeLabel(emergency.alertType)}
          </p>
        </div>
        <div>
          <span className="text-sm uppercase tracking-wider text-white/70">Timestamp</span>
          <p className="text-lg font-medium text-white/90">
            {formatDateTime(
              emergency.broadcastedAt ||
                (emergency as unknown as Record<string, unknown>).createdAt ||
                (emergency as unknown as Record<string, unknown>).timestamp ||
                (emergency as unknown as Record<string, unknown>).reportedAt,
            )}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm uppercase tracking-wider text-white/70">Location Coordinates</p>
        <p className="text-2xl font-mono font-semibold text-white">
          {emergency.latitude.toFixed(6)}, {emergency.longitude.toFixed(6)}
        </p>
      </div>

      {emergency.autoEscalated && (
        <div className="rounded-md bg-amber-500/20 px-4 py-2 border border-amber-500/40 text-amber-300 font-semibold inline-block">
          Auto-escalated alert
        </div>
      )}

      <div>
        <a
          className="inline-block text-lg font-medium underline hover:text-amber-300 transition-colors"
          href={buildGoogleMapsUrl(emergency.latitude, emergency.longitude)}
          target="_blank"
          rel="noreferrer"
        >
          Open location in Google Maps →
        </a>
      </div>

      {showMap && (
        <div className="overflow-hidden rounded-xl border border-white/20 shadow-2xl">
          <SingleAlertMap
            latitude={emergency.latitude}
            longitude={emergency.longitude}
            alertType={parseAlertType(emergency.alertType) ?? AlertType.Fire}
            height="320px"
          />
        </div>
      )}
    </div>
  )
}
