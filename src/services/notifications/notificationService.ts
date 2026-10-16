export type NotificationPermission = 'granted' | 'denied' | 'default' | 'unsupported'

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission as NotificationPermission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  const result = await Notification.requestPermission()
  return result as NotificationPermission
}

export function sendNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!('Notification' in window) || Notification.permission !== 'granted') return null
  try {
    return new Notification(title, {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      ...options,
    })
  } catch {
    return null
  }
}

export function isNotificationsSupported(): boolean {
  return 'Notification' in window
}
