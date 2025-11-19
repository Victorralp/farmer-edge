importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js')
importScripts('/firebase-config-sw.js')

firebase.initializeApp(self.__FIREBASE_CONFIG)

const messaging = firebase.messaging()

messaging.onBackgroundMessage(function(payload) {
  const title = payload.notification?.title || 'Notification'
  const options = { body: payload.notification?.body || '' }
  self.registration.showNotification(title, options)
})