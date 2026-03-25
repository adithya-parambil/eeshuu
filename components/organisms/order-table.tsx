'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Package, User, Truck } from 'lucide-react'
import { StatusBadge } from '@/components/atoms/status-badge'
import { SkeletonRow } from '@/components/atoms/skeleton-card'
import { formatDistanceToNow, format } from 'date-fns'
import type { Order } from '@/types'

// ── helpers ──────────────────────────────────────────────────────────────────

function getCustomerName(customerId: Order['customerId']): string {
  if (customerId && typeof customerId === 'object' && 'name' in customerId) return customerId.name
  return `…${String(customerId).slice(-6)}`
}

function getCustomerEmail(customerId: Order['customerId']): string | null {
  if (customerId && typeof customerId === 'object' && 'email' in customerId) return customerId.email
  return null
}

function getPartnerName(p: Order['deliveryPartnerId']): string | null {
  if (!p) return null
  if (typeof p === 'object' && 'name' in p) return p.name
  return `…${String(p).slice(-6)}`
}

function getPartnerPhone(p: Order['deliveryPartnerId']): string | null {
  if (p && typeof p === 'object' && 'phone' in p) return p.phone ?? null
  return null
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  PICKED_UP: 'Picked Up',
  ON_THE_WAY: 'On the Way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

// ── Order Detail Modal ────────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const customerName = getCustomerName(order.customerId)
  const customerEmail = getCustomerEmail(order.customerId)
  const partnerName = getPartnerName(order.deliveryPartnerId)
  const partnerPhone = getPartnerPhone(order.deliveryPartnerId)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="w-full max-w-lg bg-[#111] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <p className="text-white font-semibold">Order #{order.orderId ?? String(order._id).slice(-8).toUpperCase()}</p>
            <p className="text-white/30 text-xs mt-0.5">
              {format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/40 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Customer */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-3.5 h-3.5 text-white/30" />
              <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Customer</span>
            </div>
            <p className="text-white/90 text-sm font-medium">{customerName}</p>
            {customerEmail && <p className="text-white/40 text-xs mt-0.5">{customerEmail}</p>}
          </div>

          {/* Delivery Partner */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-3.5 h-3.5 text-white/30" />
              <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Delivery Partner</span>
            </div>
            {partnerName ? (
              <>
                <p className="text-white/90 text-sm font-medium">{partnerName}</p>
                {partnerPhone && <p className="text-white/40 text-xs mt-0.5">{partnerPhone}</p>}
              </>
            ) : (
              <p className="text-white/30 text-sm italic">Not yet assigned</p>
            )}
          </div>

          {/* Delivery Address */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3.5 h-3.5 text-white/30" />
              <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Delivery Address</span>
            </div>
            <p className="text-white/80 text-sm">{order.deliveryAddress.line1}</p>
            <p className="text-white/50 text-xs mt-0.5">{order.deliveryAddress.city} — {order.deliveryAddress.pincode}</p>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-3.5 h-3.5 text-white/30" />
              <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Items</span>
            </div>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-white/80 text-sm">{item.name}</p>
                    <p className="text-white/30 text-xs">×{item.quantity} @ ₹{item.price.toFixed(2)}</p>
                  </div>
                  <span className="text-white/60 text-sm font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2">
                <span className="text-white/50 text-sm font-medium">Total</span>
                <span className="text-white font-bold">₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status History */}
          {order.statusHistory?.length > 0 && (
            <div>
              <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Status Timeline</span>
              <div className="mt-3 space-y-2">
                {order.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-white/70 text-xs font-medium">{STATUS_LABEL[h.status] ?? h.status}</p>
                      <p className="text-white/25 text-[11px]">
                        {format(new Date(h.timestamp), 'dd MMM, hh:mm a')}
                        {h.note && <span className="ml-2 text-white/20">— {h.note}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancellation reason */}
          {order.status === 'CANCELLED' && order.cancelReason && (
            <div className="rounded-xl bg-red-500/5 border border-red-500/15 px-4 py-3">
              <p className="text-red-400/70 text-[10px] font-medium uppercase tracking-wider mb-1">Cancellation Reason</p>
              <p className="text-white/70 text-sm">{order.cancelReason}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── OrderTable ────────────────────────────────────────────────────────────────

interface OrderTableProps {
  orders: Order[]
  loading?: boolean
}

export function OrderTable({ orders, loading }: OrderTableProps) {
  const [selected, setSelected] = useState<Order | null>(null)

  if (loading) {
    return (
      <div className="surface-card rounded-2xl overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    )
  }

  return (
    <>
      <div className="surface-card rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.06]">
          {['Order', 'Customer', 'Amount', 'Status', 'Time'].map((h) => (
            <span key={h} className="text-white/25 text-xs font-medium uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/[0.03]">
          {orders.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-white/20 text-sm">No orders found</div>
          ) : (
            orders.map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelected(order)}
                className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors items-center cursor-pointer"
              >
                <span className="text-white/70 text-xs font-mono">#{order.orderId ?? String(order._id).slice(-8).toUpperCase()}</span>
                <span className="text-white/70 text-xs truncate">{getCustomerName(order.customerId)}</span>
                <span className="text-white/70 text-xs font-medium">₹{order.totalAmount.toFixed(2)}</span>
                <StatusBadge status={order.status} />
                <span className="text-white/25 text-xs">
                  {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </>
  )
}
