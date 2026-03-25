'use client'
import { motion } from 'framer-motion'
import { Check, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const STEPS: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'PENDING',    label: 'Order Placed',    description: 'Waiting for a delivery partner' },
  { status: 'ACCEPTED',   label: 'Accepted',        description: 'Partner is heading to pick up' },
  { status: 'PICKED_UP',  label: 'Picked Up',       description: 'Order collected from store' },
  { status: 'ON_THE_WAY', label: 'On the Way',      description: 'Partner is heading to you' },
  { status: 'DELIVERED',  label: 'Delivered',       description: 'Order delivered successfully' },
]

const STATUS_ORDER: Record<OrderStatus, number> = {
  PENDING: 0, ACCEPTED: 1, PICKED_UP: 2, ON_THE_WAY: 3, DELIVERED: 4, CANCELLED: -1,
}

interface StatusStepperProps {
  status: OrderStatus
  statusHistory?: { status: OrderStatus; timestamp: string }[]
}

export function StatusStepper({ status, statusHistory = [] }: StatusStepperProps) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/15">
        <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center">
          <X className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <p className="text-red-400 font-medium text-sm">Order Cancelled</p>
          <p className="text-white/30 text-xs">This order has been cancelled</p>
        </div>
      </div>
    )
  }

  const currentIdx = STATUS_ORDER[status]

  return (
    <div className="space-y-0">
      {STEPS.map((step, idx) => {
        const done = idx < currentIdx
        const active = idx === currentIdx
        const pending = idx > currentIdx

        const historyEntry = statusHistory.find((h) => h.status === step.status)

        return (
          <div key={step.status} className="flex gap-4">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: done ? '#c8ff00' : active ? '#c8ff00' : 'rgba(255,255,255,0.06)',
                  borderColor: done ? '#c8ff00' : active ? '#c8ff00' : 'rgba(255,255,255,0.1)',
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10',
                  active && 'ring-4 ring-[rgba(200,255,0,0.15)]',
                )}
              >
                {done ? (
                  <Check className="w-3.5 h-3.5" style={{ color: '#050505' }} />
                ) : active ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#050505' }}
                  />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                )}
              </motion.div>
              {idx < STEPS.length - 1 && (
                <motion.div
                  initial={false}
                  animate={{ backgroundColor: done ? '#c8ff00' : 'rgba(255,255,255,0.06)' }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="w-0.5 flex-1 my-1 min-h-[24px]"
                />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-6 flex-1', idx === STEPS.length - 1 && 'pb-0')}>
              <p className={cn(
                'text-sm font-medium',
                done ? 'text-[#c8ff00]' : active ? 'text-white' : 'text-white/25',
              )}>
                {step.label}
              </p>
              <p className={cn('text-xs mt-0.5', done || active ? 'text-white/40' : 'text-white/15')}>
                {step.description}
              </p>
              {historyEntry && (
                <p className="text-white/20 text-[10px] mt-1 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(historyEntry.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
