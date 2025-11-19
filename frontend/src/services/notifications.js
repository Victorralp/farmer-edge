// Notifications are optional - can be enabled later with Firebase Cloud Messaging
export const setupNotifications = async () => {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {

      return
    }

    // Request permission
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {

      // FCM setup can be added here later if needed
    }
  } catch (error) {

  }
}

export default setupNotifications