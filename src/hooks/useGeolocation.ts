import { useCallback, useEffect, useRef, useState } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  isLoading: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isLoading: false,
  })

  const requestLocation = useCallback(async (): Promise<{ latitude: number; longitude: number }> => {
    if (!navigator.geolocation) {
      const error = 'Geolocation is not supported on this device.'
      setState((prev) => ({ ...prev, error, isLoading: false }))
      throw new Error(error)
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          setState({ latitude, longitude, accuracy, error: null, isLoading: false })
          resolve({ latitude, longitude })
        },
        (err) => {
          const message =
            err.code === err.PERMISSION_DENIED
              ? 'Location permission denied. Enable GPS to report emergencies.'
              : 'Unable to acquire GPS location. Please try again.'
          setState((prev) => ({ ...prev, error: message, isLoading: false }))
          reject(new Error(message))
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      )
    })
  }, [])

  return { ...state, requestLocation }
}

export function useLongPress(onLongPress: () => void, delayMs: number) {
  const timerRef = useRef<number | null>(null)
  const [isPressing, setIsPressing] = useState(false)
  const [progress, setProgress] = useState(0)

  const clear = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsPressing(false)
    setProgress(0)
  }, [])

  const start = useCallback(() => {
    clear()
    setIsPressing(true)
    const startedAt = Date.now()
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      setProgress(Math.min(100, (elapsed / delayMs) * 100))
      if (elapsed >= delayMs) {
        clear()
        onLongPress()
      }
    }, 50)
  }, [clear, delayMs, onLongPress])

  useEffect(() => clear, [clear])

  return {
    isPressing,
    progress,
    bind: {
      onPointerDown: start,
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
    },
  }
}
