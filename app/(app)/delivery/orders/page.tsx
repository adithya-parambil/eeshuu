'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, MapPin, Clock, Loader2, Wifi, WifiOff } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { SkeletonDeliveryCard } from '@/components/atoms/skeleton-card'
import { useDeliveryStore } from '@/store/delivery.store'
import { useOrderSocket } from '@/hooks/use-order-socket'
import { ordersApi } from '@/lib/api/orders'
import { connectSocket } from '@/lib/socket/socket-client'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import type { Order } from '@/types'

const spring = { type: 'spring' as const, stiffness: 280, damping: 28 }

export default function DeliveryOrdersPage() {
  useOrderSocket()
  const { availableOrders, setAvailableOrders, removeAvailableOrder, setActiveOrder, isLoading, setLoading, isOnline, setOnline } = useDeliveryStore()
  const [accepting, setAccepting] = useState<string | null>(null)

  // ── Request location permission on mount for delivery partners ──────────────
  useEffect(() => {
    const requestLocationPermission = async () => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) return
      
      try {
        // Check current permission state
        if (navigator.permissions) {
          const status = await navigator.permissions.query({ name: 'geolocation' })
          if (status.state === 'granted') return // Already granted
          if (status.state === 'denied') return // User denied, don't ask again
        }
        
        // Request permission by attempting to get current position
        navigator.geolocation.getCurrentPosition(
          () => {
            // Permission granted
            console.log('Location permission granted')
          },
          (err) => {
            if (err.code === err.PERMISSION_DENIED) {
              console.log('Location permission denied by user')
            }
          },
          { enableHighAccuracy: true, timeout: 10000 }
        )
      } catch (err) {
        console.error('Error requesting location permission:', err)
      }
    }
    
    requestLocationPermission()
  }, [])

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await ordersApi.listAvailable()
        setAvailableOrders(res.data.data)
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    fetch()
    // Ensure we are in the delivery pool for ORDER_NEW broadcasts when page loads
    try {
      if (isOnline) {
        const socket = connectSocket('/order')
        socket.emit('v1:PARTNER:STATUS', { status: 'online', eventId: uuidv4() }, () => {})
      }
    } catch { /* ignore */ }
  }, [])

  const handleAccept = async (order: Order) => {
    setAccepting(order._id)
    try {
      // Try REST first
      const res = await ordersApi.accept(order._id)
      setActiveOrder(res.data.data)
      removeAvailableOrder(order._id)
      toast.success('Order accepted — head to pickup!')
      window.location.href = '/delivery/active'
    } catch (err: any) {
      const code = err?.response?.data?.code
      if (code === 'ORDER_ALREADY_TAKEN') {
        toast.error('Order already taken by another partner')
        removeAvailableOrder(order._id)
      } else if (code === 'PARTNER_HAS_ACTIVE_ORDER') {
        toast.error('You have an active order', {
          description: 'Complete your current delivery first',
          action: { label: 'View Active', onClick: () => { window.location.href = '/delivery/active' } },
        })
      } else {
        toast.error(err?.response?.data?.message ?? 'Failed to accept order')
      }
    } finally {
      setAccepting(null)
    }
  }

  const toggleOnline = () => {
    const socket = connectSocket('/order')
    const newStatus = !isOnline
    setOnline(newStatus)
    socket.emit('v1:PARTNER:STATUS', { status: newStatus ? 'online' : 'offline', eventId: uuidv4() }, () => {})
    toast(newStatus ? 'You are now online' : 'You are now offline')
  }

  return (
    <AppShell allowedRoles={['delivery']}>
      <div className="px-6 py-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-white">Available Orders</h1>
            <p className="text-white/30 text-sm mt-0.5">
              {availableOrders.length} order{availableOrders.length !== 1 ? 's' : ''} waiting
            </p>
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleOnline}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              isOnline
                ? 'border-[rgba(200,255,0,0.25)]'
                : 'bg-white/[0.04] text-white/40 border-white/[0.08]'
            }`}
            style={isOnline ? { background: 'rgba(200,255,0,0.10)', color: 'var(--acid)' } : undefined}
          >
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {isOnline ? 'Online' : 'Offline'}
          </motion.button>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: 'var(--acid)' }} />
          <span className="text-white/30 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>Live feed — updates in real time</span>
        </div>

        {/* Orders */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonDeliveryCard key={i} />)}
          </div>
        ) : availableOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-white/20"
          >
            <Package className="w-12 h-12 mb-3" />
            <p className="text-sm">No orders available right now</p>
            <p className="text-xs mt-1">New orders will appear here instantly</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {availableOrders.map((order) => (
                <motion.div
                  key={order._id}
                  layout
                  initial={{ opacity: 0, y: -16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.95 }}
                  transition={spring}
                  className="surface-card rounded-2xl p-5 hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-white font-medium text-sm">Order #{order.orderId ?? String(order._id).slice(-8).toUpperCase()}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-3 h-3 text-white/25" />
                        <span className="text-white/30 text-xs">
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">₹{order.totalAmount.toFixed(2)}</p>
                      <p className="text-white/30 text-xs">{order.items.length} items</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <MapPin className="w-3.5 h-3.5 text-white/30 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white/60 text-xs">{order.deliveryAddress.line1}</p>
                      <p className="text-white/30 text-xs">{order.deliveryAddress.city} — {order.deliveryAddress.pincode}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {order.items.slice(0, 3).map((item, j) => (
                      <span key={j} className="px-2 py-0.5 rounded-md bg-white/[0.03] text-white/40 text-xs border border-white/[0.05]">
                        {item.name} ×{item.quantity}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.03] text-white/30 text-xs border border-white/[0.05]">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAccept(order)}
                    disabled={accepting === order._id}
                    className="w-full h-10 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: 'var(--acid)', color: '#050505', fontFamily: 'var(--font-head)' }}
                  >
                    {accepting === order._id ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#050505' }} /> : 'Accept Order'}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </AppShell>
  )
}
