// Firebase Web Push configuration
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ''

interface NotificationPermission {
  granted: boolean
  denied: boolean
  default: boolean
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null
  private permissionState: NotificationPermission = {
    granted: false,
    denied: false,
    default: true,
  }

  constructor() {
    this.checkInitialPermission()
  }

  /**
   * Check current permission state
   */
  checkInitialPermission() {
    if (!('Notification' in window)) {
      this.permissionState = { granted: false, denied: false, default: false }
      return
    }

    this.permissionState = {
      granted: Notification.permission === 'granted',
      denied: Notification.permission === 'denied',
      default: Notification.permission === 'default',
    }
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): 'granted' | 'denied' | 'default' {
    if (!('Notification' in window)) return 'denied'
    
    switch (Notification.permission) {
      case 'granted':
        return 'granted'
      case 'denied':
        return 'denied'
      default:
        return 'default'
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    const permission = await Notification.requestPermission()
    
    this.permissionState = {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default',
    }

    if (permission === 'granted') {
      await this.registerServiceWorker()
      await this.subscribeToPush()
    }

    return permission === 'granted'
  }

  /**
   * Register service worker for push notifications
   */
  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported')
      return null
    }

    try {
      this.registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      })
      console.log('Service Worker registered successfully')
      return this.registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToPush(): Promise<void> {
    if (!this.registration) {
      console.warn('Service Worker not registered')
      return
    }

    try {
      // Check for existing subscription
      let subscription = await this.registration.pushManager.getSubscription()
      
      if (subscription) {
        console.log('Already subscribed to push notifications')
        await this.sendSubscriptionToBackend(subscription)
        return
      }

      // Request new subscription
      subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      console.log('Successfully subscribed to push notifications')
      await this.sendSubscriptionToBackend(subscription)
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
    }
  }

  /**
   * Send subscription to backend
   */
  private async sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    try {
      const token = subscription.toJSON().endpoint?.split('/').pop()
      
      if (!token) {
        console.warn('Could not extract token from subscription')
        return
      }

      const response = await fetch('/api/v1/device/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          platform: 'web',
        }),
      })

      if (response.ok) {
        console.log('Device token saved to backend')
      } else {
        console.error('Failed to save device token')
      }
    } catch (error) {
      console.error('Error sending subscription to backend:', error)
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      console.warn('Service Worker not registered')
      return false
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription()
      
      if (!subscription) {
        console.log('Not subscribed to push notifications')
        return false
      }

      const successful = await subscription.unsubscribe()
      
      if (successful) {
        console.log('Successfully unsubscribed from push notifications')
        
        // Remove token from backend
        const token = subscription.toJSON().endpoint?.split('/').pop()
        if (token) {
          await fetch('/api/v1/device/token', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          })
        }
      }

      return successful
    } catch (error) {
      console.error('Error unsubscribing:', error)
      return false
    }
  }

  /**
   * Show a local notification
   */
  showNotification(title: string, options?: NotificationOptions): void {
    if (this.permissionState.granted && 'Notification' in window) {
      new Notification(title, {
        ...options,
        icon: options?.icon || '/icon-192.png',
        badge: options?.badge || '/badge.png',
      })
    }
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  }
}

export const pushNotificationService = new PushNotificationService()
