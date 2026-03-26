'use client'
import { useEffect, useState, useCallback } from 'react'
import { pushNotificationService } from '@/lib/notifications/push-notification-service'
import { toast } from 'sonner'
import { Bell, BellOff } from 'lucide-react'

export function usePushNotifications() {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default')
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    // Check if notifications are supported
    if (!pushNotificationService.isSupported()) {
      setIsSupported(false)
      return
    }

    // Initial permission check
    setPermission(pushNotificationService.getPermissionStatus())

    // Listen for permission changes
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName }).then((result) => {
        setPermission(result.state as 'granted' | 'denied' | 'default')
        
        result.onchange = () => {
          setPermission(result.state as 'granted' | 'denied' | 'default')
        }
      })
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser')
      return false
    }

    const granted = await pushNotificationService.requestPermission()
    
    if (granted) {
      setPermission('granted')
      toast.success('Notifications enabled! You will receive order updates.', {
        icon: '🔔',
      })
    } else {
      setPermission('denied')
      toast.error('Notifications permission denied', {
        description: 'You can enable them later in browser settings',
      })
    }

    return granted
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    const success = await pushNotificationService.unsubscribe()
    
    if (success) {
      setPermission('default')
      toast.info('Notifications disabled', {
        icon: '🔕',
      })
    }

    return success
  }, [])

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      pushNotificationService.showNotification(title, options)
    }
  }, [permission])

  return {
    permission,
    isSupported,
    requestPermission,
    unsubscribe,
    showNotification,
  }
}

// Notification button component
export function NotificationToggleButton() {
  const { permission, isSupported, requestPermission, unsubscribe } = usePushNotifications()

  if (!isSupported) {
    return null
  }

  const handleClick = async () => {
    if (permission === 'granted') {
      await unsubscribe()
    } else {
      await requestPermission()
    }
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      style={{
        background: permission === 'granted' 
          ? 'rgba(200,255,0,0.10)' 
          : 'rgba(247,244,239,0.05)',
        border: permission === 'granted'
          ? '1px solid rgba(200,255,0,0.25)'
          : '1px solid rgba(247,244,239,0.08)',
        color: permission === 'granted'
          ? 'var(--acid)'
          : 'rgba(247,244,239,0.55)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        if (permission === 'granted') {
          el.style.background = 'rgba(200,255,0,0.15)'
          el.style.borderColor = 'rgba(200,255,0,0.35)'
        } else {
          el.style.background = 'rgba(247,244,239,0.08)'
          el.style.borderColor = 'rgba(247,244,239,0.12)'
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        if (permission === 'granted') {
          el.style.background = 'rgba(200,255,0,0.10)'
          el.style.borderColor = 'rgba(200,255,0,0.25)'
        } else {
          el.style.background = 'rgba(247,244,239,0.05)'
          el.style.borderColor = 'rgba(247,244,239,0.08)'
        }
      }}
    >
      {permission === 'granted' ? (
        <>
          <Bell className="w-3.5 h-3.5" />
          <span>Enabled</span>
        </>
      ) : (
        <>
          <BellOff className="w-3.5 h-3.5" />
          <span>Enable Notifications</span>
        </>
      )}
    </button>
  )
}
