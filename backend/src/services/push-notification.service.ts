import admin from 'firebase-admin'
import { log } from '../utils/logger'

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, any>
  clickAction?: string
}

/**
 * Send push notification to a single device token
 */
export async function sendPushNotification(
  deviceToken: string,
  notification: NotificationPayload,
): Promise<boolean> {
  try {
    const message: admin.messaging.Message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      token: deviceToken,
      webpush: {
        fcmOptions: {
          link: notification.clickAction || '/',
        },
      },
      ...(notification.data && { data: notification.data }),
    }

    const response = await admin.messaging().send(message)
    log.info({ response }, 'Push notification sent successfully')
    return true
  } catch (error: any) {
    log.error({ error, deviceToken }, 'Failed to send push notification')
    
    // Handle invalid tokens
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      log.info({ deviceToken }, 'Invalid token - should be removed from database')
    }
    
    return false
  }
}

/**
 * Send push notification to multiple device tokens (batch)
 */
export async function sendBatchPushNotifications(
  deviceTokens: string[],
  notification: NotificationPayload,
): Promise<{ successCount: number; failureCount: number }> {
  try {
    // FCM supports max 500 tokens per batch
    const batchSize = 500
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < deviceTokens.length; i += batchSize) {
      const batch = deviceTokens.slice(i, i + batchSize)
      
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        tokens: batch,
        webpush: {
          fcmOptions: {
            link: notification.clickAction || '/',
          },
        },
        ...(notification.data && { data: notification.data }),
      }

      const response = await admin.messaging().sendEachForMulticast(message)
      successCount += response.successCount
      failureCount += response.failureCount

      // Log failed tokens for cleanup
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error
          log.error({ token: batch[idx], error }, 'Failed to send notification in batch')
        }
      })
    }

    log.info({ successCount, failureCount }, 'Batch push notifications completed')
    return { successCount, failureCount }
  } catch (error: any) {
    log.error({ error }, 'Batch push notification failed')
    return { successCount: 0, failureCount: deviceTokens.length }
  }
}

/**
 * Send order notification
 */
export async function sendOrderNotification(
  deviceToken: string,
  orderId: string,
  status: string,
  additionalData?: Record<string, any>,
): Promise<boolean> {
  const titles: Record<string, string> = {
    PENDING: 'Order Received',
    ACCEPTED: 'Order Accepted!',
    PICKED_UP: 'Order Picked Up',
    ON_THE_WAY: 'Out for Delivery',
    DELIVERED: 'Order Delivered! 🎉',
    CANCELLED: 'Order Cancelled',
  }

  const bodies: Record<string, string> = {
    PENDING: 'Your order is being processed',
    ACCEPTED: 'A delivery partner has accepted your order',
    PICKED_UP: 'Your order has been picked up',
    ON_THE_WAY: 'Your order is on the way to you',
    DELIVERED: 'Your order has been delivered successfully',
    CANCELLED: 'Your order has been cancelled',
  }

  return sendPushNotification(deviceToken, {
    title: titles[status] || 'Order Update',
    body: bodies[status] || 'Your order status has been updated',
    icon: '/icon-192.png',
    badge: '/badge.png',
    clickAction: `/orders/${orderId}`,
    data: {
      type: 'ORDER_UPDATE',
      orderId,
      status,
      ...additionalData,
    },
  })
}

/**
 * Send new order alert to delivery partners
 */
export async function sendNewOrderAlertToPartners(
  partnerTokens: string[],
  orderId: string,
  totalAmount: number,
  distance?: string,
): Promise<{ successCount: number; failureCount: number }> {
  return sendBatchPushNotifications(partnerTokens, {
    title: '📦 New Order Available!',
    body: `Earn ₹${(totalAmount * 0.10).toFixed(2)} - Tap to accept`,
    icon: '/icon-192.png',
    badge: '/badge.png',
    clickAction: '/delivery/orders',
    data: {
      type: 'NEW_ORDER_ALERT',
      orderId,
      totalAmount,
      distance,
    },
  })
}

/**
 * Send product update notification
 */
export async function sendProductNotification(
  deviceToken: string,
  productId: string,
  action: 'CREATED' | 'UPDATED' | 'DELETED',
  productName: string,
): Promise<boolean> {
  const notifications = {
    CREATED: {
      title: 'New Product Added! 🆕',
      body: `${productName} is now available`,
    },
    UPDATED: {
      title: 'Product Updated',
      body: `${productName} has been updated`,
    },
    DELETED: {
      title: 'Product Unavailable',
      body: `${productName} is no longer available`,
    },
  }

  return sendPushNotification(deviceToken, {
    title: notifications[action].title,
    body: notifications[action].body,
    icon: '/icon-192.png',
    badge: '/badge.png',
    clickAction: action === 'DELETED' ? '/' : `/products/${productId}`,
    data: {
      type: 'PRODUCT_UPDATE',
      productId,
      action,
    },
  })
}
