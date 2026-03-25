'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Package, ChevronRight, Clock } from 'lucide-react'
import { StatusBadge } from '@/components/atoms/status-badge'
import { formatDistanceToNow } from 'date-fns'
import type { Order } from '@/types'

interface OrderCardProps {
  order: Order
  index?: number
  href?: string
}

const spring = { type: 'spring' as const, stiffness: 280, damping: 28 }

export function OrderCard({ order, index = 0, href }: OrderCardProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: index * 0.05 }}
      whileHover={{ y: -1 }}
      className="rounded-xl p-5 group transition-colors"
      style={{
        background: '#111',
        border: '1px solid rgba(247,244,239,0.06)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(247,244,239,0.12)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(247,244,239,0.06)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(247,244,239,0.04)', border: '1px solid rgba(247,244,239,0.06)' }}
          >
            <Package className="w-4 h-4" style={{ color: 'rgba(247,244,239,0.30)' }} />
          </div>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ fontFamily: 'var(--font-head)', color: 'rgba(247,244,239,0.85)' }}
            >
              Order #{order.orderId ?? String(order._id).slice(-8).toUpperCase()}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(247,244,239,0.30)', fontFamily: 'var(--font-mono)' }}>
              {order.items.length} item{order.items.length !== 1 ? 's' : ''} · ₹{order.totalAmount.toFixed(2)}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <Clock className="w-3 h-3" style={{ color: 'rgba(247,244,239,0.18)' }} />
              <span className="text-xs" style={{ color: 'rgba(247,244,239,0.22)', fontFamily: 'var(--font-mono)' }}>
                {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          {href && (
            <ChevronRight
              className="w-4 h-4 transition-colors"
              style={{ color: 'rgba(247,244,239,0.18)' }}
            />
          )}
        </div>
      </div>

      {/* Items preview */}
      <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(247,244,239,0.04)' }}>
        <div className="flex flex-wrap gap-1.5">
          {order.items.slice(0, 3).map((item, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md text-xs"
              style={{
                background: 'rgba(247,244,239,0.03)',
                color: 'rgba(247,244,239,0.35)',
                border: '1px solid rgba(247,244,239,0.05)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {item.name} ×{item.quantity}
            </span>
          ))}
          {order.items.length > 3 && (
            <span
              className="px-2 py-0.5 rounded-md text-xs"
              style={{
                background: 'rgba(247,244,239,0.02)',
                color: 'rgba(247,244,239,0.25)',
                border: '1px solid rgba(247,244,239,0.04)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              +{order.items.length - 3} more
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )

  if (href) return <Link href={href}>{content}</Link>
  return content
}
