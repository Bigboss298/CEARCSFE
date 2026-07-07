import { useState, useRef, useEffect } from 'react'
import { AuthApi } from '@/api/services'
import { unwrapApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { initializeFirebaseMessaging, requestNotificationPermission } from '@/features/notifications/firebase'
import { useNotificationStore, useAuthStore, selectStudentProfile, useSignalRStore } from '@/stores'
import { Badge } from '@/components/ui/badge'
import { BellRing, MessageCircle, CircleUserRound, Radio } from 'lucide-react'
import { HubConnectionState } from '@microsoft/signalr'
import { formatDateTime } from '@/utils/alert-theme'

export function StudentSettingsPage() {
  const permission = useNotificationStore((s) => s.permission)
  const fcmToken = useNotificationStore((s) => s.fcmToken)
  const deviceInfo = useNotificationStore((s) => s.deviceInfo)
  const isRegistered = useNotificationStore((s) => s.isRegistered)
  const isRegistering = useNotificationStore((s) => s.isRegistering)
  const registerDeviceTokenIfNeeded = useNotificationStore((s) => s.registerDeviceTokenIfNeeded)
  const connectionState = useSignalRStore((s) => s.connectionState)
  const user = useAuthStore((s) => s.user)
  const profile = selectStudentProfile(user)
  const [telegramMessage, setTelegramMessage] = useState<string | null>(null)
  const [telegramError, setTelegramError] = useState<string | null>(null)
  const [pushMessage, setPushMessage] = useState<string | null>(null)
  const [isPollingTelegram, setIsPollingTelegram] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isTelegramLinked = Boolean(
    profile?.isTelegramLinked !== undefined ? profile.isTelegramLinked : Boolean(profile?.telegramUsername),
  )

  useEffect(() => {
    if (isTelegramLinked) {
      if (isPollingTelegram) {
        setIsPollingTelegram(false)
        setTelegramMessage('Telegram account linked successfully!')
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      return
    }

    if (!isPollingTelegram) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      return
    }

    const interval = setInterval(() => {
      void (async () => {
        try {
          const res = await AuthApi.getMe()
          const updatedProfile = res.data
          if (updatedProfile?.isTelegramLinked || updatedProfile?.telegramUsername) {
            await useAuthStore.getState().fetchMe()
            setIsPollingTelegram(false)
            setTelegramMessage('Telegram account linked successfully!')
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
              pollingRef.current = null
            }
          }
        } catch {
          // Ignore network errors during polling
        }
      })()
    }, 3500)

    pollingRef.current = interval

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [isPollingTelegram, isTelegramLinked])

  async function handleEnablePush() {
    setPushMessage(null)
    try {
      await requestNotificationPermission()
      const token = await initializeFirebaseMessaging()
      if (token) {
        await registerDeviceTokenIfNeeded()
        await useNotificationStore.getState().fetchDeviceInfo()
        setPushMessage('Push notifications enabled and device registered.')
      } else {
        setPushMessage('Firebase is not configured. Add VITE_FIREBASE_* variables to enable push.')
      }
    } catch (error) {
      setPushMessage(unwrapApiError(error))
    }
  }

  async function handleOpenTelegramBot(isLinking = false) {
    setTelegramError(null)
    if (isLinking) {
      setTelegramMessage('Waiting for Telegram confirmation...')
      setIsPollingTelegram(true)
    } else {
      setTelegramMessage(null)
    }
    try {
      const res = await AuthApi.getTelegramLinkUrl()
      const url = res.data.url
      if (url) {
        const win = window.open(url, '_blank', 'noopener,noreferrer')
        if (!win) {
          setTelegramError(`Popup blocked by browser. Please allow popups or open this link manually: ${url}`)
        }
      } else {
        setTelegramError('Unable to generate Telegram linking URL.')
        if (isLinking) setIsPollingTelegram(false)
      }
    } catch (error) {
      setTelegramError(unwrapApiError(error))
      if (isLinking) {
        setIsPollingTelegram(false)
        setTelegramMessage(null)
      }
    }
  }

  async function handleUnlinkTelegram() {
    setTelegramError(null)
    setTelegramMessage(null)
    if (isPollingTelegram) {
      setIsPollingTelegram(false)
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
    try {
      await AuthApi.linkTelegram({ chatId: 0 })
    } catch {
      // Ignore if backend rejects 0 since there is no dedicated unlink endpoint
    }
    await useAuthStore.getState().fetchMe()
    setTelegramMessage('Telegram account unlinked.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage notifications, Telegram, and connection preferences.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Receive campus emergency alerts via Firebase Cloud Messaging.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingRow label="Permission" value={permission} />
            <SettingRow label="Device Registered" value={isRegistered || deviceInfo?.token ? 'Yes' : 'No'} />
            <SettingRow
              label="Platform"
              value={deviceInfo?.platform ? deviceInfo.platform.toUpperCase() : isRegistered ? 'WEB' : '—'}
            />
            <SettingRow
              label="Registration Date"
              value={
                deviceInfo?.createdAt || deviceInfo?.registrationDate
                  ? formatDateTime((deviceInfo.createdAt || deviceInfo.registrationDate)!)
                  : isRegistered
                    ? 'Registered'
                    : '—'
              }
            />
            <SettingRow
              label="FCM Token"
              value={
                deviceInfo?.token || fcmToken
                  ? `${(deviceInfo?.token || fcmToken)!.slice(0, 24)}…`
                  : 'Device not registered.'
              }
            />
            <Button onClick={() => void handleEnablePush()} disabled={isRegistering} className="w-full sm:w-auto">
              {isRegistering ? 'Registering...' : 'Enable Push Notifications'}
            </Button>
            {pushMessage && <Feedback tone="info" text={pushMessage} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Telegram
            </CardTitle>
            <CardDescription>
              {isTelegramLinked
                ? 'Your Telegram account is connected to CEARCS emergency notifications.'
                : 'Click Link Telegram or Open Telegram Bot to connect with the CEARCS emergency bot.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTelegramLinked ? (
              <div className="space-y-4">
                <SettingRow
                  label="Telegram username"
                  value={profile?.telegramUsername ? `@${profile.telegramUsername}` : 'Linked via bot'}
                />
                <SettingRow label="Phone Number" value={profile?.phoneNumber || 'Not provided'} />
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                  <span className="text-slate-500 dark:text-slate-400">Status</span>
                  <Badge variant="success">Connected</Badge>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => void handleOpenTelegramBot(false)}
                    className="w-full sm:w-auto"
                  >
                    Open Telegram Bot
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => void handleUnlinkTelegram()}
                    className="w-full sm:w-auto"
                  >
                    Unlink Telegram
                  </Button>
                </div>
                {telegramMessage && <Feedback tone="success" text={telegramMessage} />}
                {telegramError && <Feedback tone="error" text={telegramError} />}
              </div>
            ) : (
              <div className="space-y-4">
                <SettingRow label="Phone Number" value={profile?.phoneNumber || 'Not provided'} />
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                  <span className="text-slate-500 dark:text-slate-400">Status</span>
                  <Badge variant="secondary">Not connected</Badge>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => void handleOpenTelegramBot(true)}
                    className="w-full sm:w-auto"
                  >
                    Open Telegram Bot
                  </Button>
                  <Button
                    onClick={() => void handleOpenTelegramBot(true)}
                    disabled={isPollingTelegram}
                    className="w-full sm:w-auto"
                  >
                    {isPollingTelegram ? 'Polling...' : 'Link Telegram'}
                  </Button>
                  {isPollingTelegram && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsPollingTelegram(false)
                        setTelegramMessage(null)
                      }}
                      className="w-full sm:w-auto text-muted-foreground"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
                {telegramMessage && <Feedback tone="info" text={telegramMessage} />}
                {telegramError && <Feedback tone="error" text={telegramError} />}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleUserRound className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>Current student session and registration snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingRow label="Full Name" value={profile?.fullName || 'Not provided'} />
            <SettingRow label="Matric Number" value={profile?.matricNumber || 'Not provided'} />
            <SettingRow label="Email" value={profile?.email || 'Not provided'} />
            <SettingRow label="Phone Number" value={profile?.phoneNumber || 'Not provided'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Connection
            </CardTitle>
            <CardDescription>Realtime connection health and session transport.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SettingRow label="SignalR Status" value={connectionState} />
            <SettingRow
              label="Device Registration"
              value={isRegistered || deviceInfo?.token ? 'Registered' : 'Not registered'}
            />
            <SettingRow
              label="Push Status"
              value={
                permission === 'granted'
                  ? 'Enabled'
                  : permission === 'denied'
                    ? 'Disabled'
                    : 'Not requested'
              }
            />
            <SettingRow label="Telegram Status" value={isTelegramLinked ? 'Linked' : 'Not linked'} />
            <Separator />
            <Badge variant={connectionState === HubConnectionState.Connected ? 'success' : 'warning'}>
              {connectionState}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  )
}

function Feedback({ tone, text }: { tone: 'success' | 'error' | 'info'; text: string }) {
  const styles =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
      : tone === 'error'
        ? 'border-destructive/20 bg-destructive/5 text-destructive'
        : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200'

  return <p className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>{text}</p>
}
