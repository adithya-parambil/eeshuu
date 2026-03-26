'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Package, Clock } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { StatusBadge } from '@/components/atoms/status-badge'
import { SkeletonOrderCard } from '@/components/atoms/skeleton-card'
import { ordersApi } from '@/lib/api/orders'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Order, ApiMeta } from '@/types'
import { connectSocket, disconnectSocket, isDuplicate } from '@/lib/socket/socket-client'

const EVENTS = {
  ORDER_STATUS_UPDATED: 'v1:ORDER:STATUS_UPDATED',
}

export default function DeliveryHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [meta, setMeta] = useState<ApiMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ordersApi.getMyHistory({ page, limit: 20, status: 'DELIVERED' })
      setOrders(res.data.data)
      setMeta(res.data.meta!)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { fetch() }, [fetch])

  // Real-time delivery updates
  useEffect(() => {
    const socket = connectSocket('/order')

    socket.off(EVENTS.ORDER_STATUS_UPDATED)

    socket.on(EVENTS.ORDER_STATUS_UPDATED, (payload: { orderId: string; status: string; eventId: string }) => {
      if (isDuplicate(payload.eventId)) return
      // If an order was delivered, refetch the history
      if (payload.status === 'DELIVERED') {
        fetch()
      }
    })

    return () => {
      disconnectSocket('/order')
    }
  }, [fetch])

  return (
    <AppShell allowedRoles={['delivery']}>
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-white">Delivery History</h1>
          <p className="text-white/30 text-sm mt-0.5">
            {meta ? `${meta.total} completed deliveries` : 'Your delivered orders'}
          </p>
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonOrderCard key={i} />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/20">
            <Package className="w-12 h-12 mb-3" />
            <p className="text-sm">No deliveries yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const customer = order.customerId && typeof order.customerId === 'object'
                ? order.customerId as { _id: string; name: string }
                : null
              const commission = ((order.pricing?.subtotal ?? order.totalAmount) * 0.10).toFixed(2)
              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="surface-card rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white/80 text-sm font-medium">#{order.orderId ?? String(order._id).slice(-8).toUpperCase()}</p>
                      {customer && <p className="text-white/40 text-xs mt-0.5">{customer.name}</p>}
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5 text-white/30 text-xs">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </div>
                    <div className="text-right">
                      <p className="text-white/50 text-xs">Order ₹{order.totalAmount.toFixed(2)}</p>
                      <p className="text-xs font-medium" style={{ color: 'var(--acid)' }}>+₹{commission} earned</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-medium transition-all',
                  page === p ? 'text-[#050505]' : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08]',
                )}
                style={page === p ? { background: 'var(--acid)' } : undefined}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
