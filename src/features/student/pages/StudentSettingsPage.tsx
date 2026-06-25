import { useState } from 'react'
import { AuthApi } from '@/api/services'
import { unwrapApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { initializeFirebaseMessaging, requestNotificationPermission } from '@/features/notifications/firebase'
import { useNotificationStore } from '@/stores'

export function StudentSettingsPage() {
  const permission = useNotificationStore((s) => s.permission)
  const fcmToken = useNotificationStore((s) => s.fcmToken)
  const isRegistered = useNotificationStore((s) => s.isRegistered)
  const isRegistering = useNotificationStore((s) => s.isRegistering)
  const registerDeviceTokenIfNeeded = useNotificationStore((s) => s.registerDeviceTokenIfNeeded)
  const [chatId, setChatId] = useState('')
  const [telegramMessage, setTelegramMessage] = useState<string | null>(null)
  const [telegramError, setTelegramError] = useState<string | null>(null)
  const [pushMessage, setPushMessage] = useState<string | null>(null)

  async function handleEnablePush() {
    setPushMessage(null)
    try {
      await requestNotificationPermission()
      const token = await initializeFirebaseMessaging()
      if (token) {
        await registerDeviceTokenIfNeeded()
        setPushMessage('Push notifications enabled and device registered.')
      } else {
        setPushMessage('Firebase is not configured. Add VITE_FIREBASE_* variables to enable push.')
      }
    } catch (error) {
      setPushMessage(unwrapApiError(error))
    }
  }

  async function handleLinkTelegram() {
    setTelegramError(null)
    setTelegramMessage(null)
    const parsed = Number(chatId)
    if (!parsed || parsed <= 0) {
      setTelegramError('Enter a valid Telegram chat ID greater than 0.')
      return
    }

    try {
      await AuthApi.linkTelegram({ chatId: parsed })
      setTelegramMessage('Telegram account linked successfully.')
    } catch (error) {
      setTelegramError(unwrapApiError(error))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Receive campus emergency alerts via Firebase Cloud Messaging.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Permission: <span className="font-medium text-foreground">{permission}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Device registered:{' '}
            <span className="font-medium text-foreground">{isRegistered ? 'Yes' : 'No'}</span>
          </p>
          {fcmToken && (
            <p className="break-all text-xs text-muted-foreground">Token: {fcmToken.slice(0, 24)}…</p>
          )}
          <Button onClick={() => void handleEnablePush()} disabled={isRegistering}>
            {isRegistering ? 'Registering...' : 'Enable Push Notifications'}
          </Button>
          {pushMessage && <p className="text-sm">{pushMessage}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Link Telegram</CardTitle>
          <CardDescription>
            Start a conversation with the CEARCS Telegram bot first, then enter your chat ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="chatId">Telegram Chat ID</Label>
            <Input
              id="chatId"
              type="number"
              inputMode="numeric"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="e.g. 123456789"
            />
          </div>
          <Button onClick={() => void handleLinkTelegram()}>Link Telegram</Button>
          {telegramMessage && <p className="text-sm text-emerald-600">{telegramMessage}</p>}
          {telegramError && <p className="text-sm text-destructive">{telegramError}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
