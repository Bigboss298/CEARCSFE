import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from 'firebase/messaging'
import { firebaseConfig, isFirebaseConfigured } from '@/lib/firebase-config'
import { useNotificationStore } from '@/stores/notification.store'

let app: FirebaseApp | null = null
let messaging: Messaging | null = null

async function getMessagingInstance(): Promise<Messaging | null> {
  if (!isFirebaseConfigured()) return null
  const supported = await isSupported()
  if (!supported) return null

  if (!app) app = initializeApp(firebaseConfig)
  if (!messaging) messaging = getMessaging(app)
  return messaging
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') {
    useNotificationStore.getState().initializePermission()
    return 'unsupported'
  }

  const permission = await Notification.requestPermission()
  useNotificationStore.setState({ permission })
  return permission
}

export async function initializeFirebaseMessaging(): Promise<string | null> {
  const messagingInstance = await getMessagingInstance()
  if (!messagingInstance) return null

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) return null

  const token = await getToken(messagingInstance, {
    vapidKey,
    serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
  })

  useNotificationStore.getState().setFcmToken(token)
  await useNotificationStore.getState().registerDeviceTokenIfNeeded()

  onMessage(messagingInstance, (payload) => {
    const title = payload.notification?.title ?? '🚨 Campus Emergency'
    const body =
      payload.notification?.body ??
      'An emergency has been reported on campus. Follow safety protocols immediately.'

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.svg' })
    }
  })

  return token
}

export async function setupBackgroundMessaging(): Promise<void> {
  if (!isFirebaseConfigured()) return
  await navigator.serviceWorker.register('/firebase-messaging-sw.js')
}
