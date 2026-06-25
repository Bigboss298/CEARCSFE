importScripts('/firebase-config.js')
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js')

if (self.FIREBASE_CONFIG?.apiKey) {
  firebase.initializeApp(self.FIREBASE_CONFIG)
  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? 'Campus Emergency'
    const body =
      payload.notification?.body ??
      'An emergency has been reported on campus. Follow safety protocols immediately.'

    self.registration.showNotification(title, {
      body,
      icon: '/favicon.svg',
    })
  })
}
