import { ALERT_LONG_PRESS_MS } from '@/lib/constants'
import type { AlertType } from '@/types/enums/alert-type'
import { cn } from '@/lib/utils'
import { useLongPress } from '@/hooks/useGeolocation'

interface EmergencyButtonProps {
  alertType: AlertType
  label: string
  className?: string
  disabled?: boolean
  onActivate: () => void
}

const typeStyles: Record<AlertType, string> = {
  Fire: 'bg-fire hover:bg-fire/90 text-white',
  Medical: 'bg-medical hover:bg-medical/90 text-white',
  Security: 'bg-security hover:bg-security/90 text-white',
}

export function EmergencyButton({
  alertType,
  label,
  className,
  disabled,
  onActivate,
}: EmergencyButtonProps) {
  const { bind, isPressing, progress } = useLongPress(onActivate, ALERT_LONG_PRESS_MS)

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`Report ${label} emergency. Press and hold for 1.5 seconds.`}
      className={cn(
        'relative flex min-h-28 w-full select-none flex-col items-center justify-center rounded-2xl px-6 py-8 text-2xl font-bold shadow-lg transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-36 sm:text-3xl',
        typeStyles[alertType],
        className,
      )}
      {...bind}
    >
      <span>{label}</span>
      <span className="mt-2 text-sm font-normal opacity-90">Hold for 1.5s</span>
      {isPressing && (
        <span
          className="absolute bottom-0 left-0 h-1 rounded-b-2xl bg-white/80 transition-all"
          style={{ width: `${progress}%` }}
        />
      )}
    </button>
  )
}
