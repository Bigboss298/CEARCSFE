import type { AlertResponse } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  formatDateTime,
  getAlertStatusLabel,
  getAlertStatusVariant,
  getAlertTypeLabel,
  getCountdownSeconds,
} from '@/utils/alert-theme'
import { AlertType } from '@/types/enums/alert-type'
import { useEffect, useState } from 'react'
import { AlertStatus } from '@/types/enums/alert-status'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'

interface AlertCardProps {
  alert: AlertResponse
  onSelect?: (alert: AlertResponse) => void
}

export function AlertCard({ alert, onSelect }: AlertCardProps) {
  const [countdown, setCountdown] = useState(() =>
    alert.alertStatus === AlertStatus.Pending
      ? getCountdownSeconds(alert.adminResponseDeadline)
      : null,
  )

  useEffect(() => {
    if (alert.alertStatus !== AlertStatus.Pending) {
      setCountdown(null)
      return
    }

    const timer = window.setInterval(() => {
      setCountdown(getCountdownSeconds(alert.adminResponseDeadline))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [alert.adminResponseDeadline, alert.alertStatus])

  const typeVariant =
    alert.alertType === AlertType.Fire
      ? 'fire'
      : alert.alertType === AlertType.Medical
        ? 'medical'
        : 'security'

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => onSelect?.(alert)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{alert.studentFullName}</CardTitle>
          <Badge variant={typeVariant}>{getAlertTypeLabel(alert.alertType)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <Badge variant={getAlertStatusVariant(alert.alertStatus)}>{getAlertStatusLabel(alert.alertStatus)}</Badge>
          <span className="text-muted-foreground">{formatDateTime(alert.createdAt)}</span>
        </div>
        <p>
          Confidence: {alert.confidenceScore.toFixed(1)} · Reporters: {alert.reporterCount}
        </p>
        {countdown !== null && (
          <p className="font-medium text-amber-600">
            Escalation in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
          </p>
        )}
        {onSelect && (
          <Button variant="outline" size="sm" className="w-full" onClick={() => onSelect(alert)}>
            <MapPin className="mr-2 h-4 w-4" />
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
