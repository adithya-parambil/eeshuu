'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, CheckCircle, Truck, X, Wifi, WifiOff, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { ActivityEvent } from '@/store/admin.store'

const EVENT_CONFIG: Record<ActivityEvent['type'], { icon: React.ElementType; color: string; bg: string }> = {
  ORDER_NEW:            { icon: Package,      color: 'text-[#c8ff00]',   bg: 'bg-[rgba(200,255,0,0.08)]' },
  ORDER_ACCEPTED:       { icon: CheckCircle,  color: 'text-violet-400',  bg: 'bg-violet-400/10' },
  ORDER_STATUS_UPDATED: { icon: Truck,        color: 'text-amber-400',   bg: 'bg-amber-400/10' },
  ORDER_CANCELLED:      { icon: X,            color: 'text-red-400',     bg: 'bg-red-400/10' },
  PARTNER_ONLINE:       { icon: Wifi,         color: 'text-[#c8ff00]',   bg: 'bg-[rgba(200,255,0,0.08)]' },
  PARTNER_OFFLINE:      { icon: WifiOff,      color: 'text-white/30',    bg: 'bg-white/[0.04]' },
}

interface LiveFeedProps {
  events: ActivityEvent[]
}

export function LiveFeed({ events }: LiveFeedProps) {
  return (
    <div className="surface-card rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
        <Activity className="w-4 h-4 text-white/40" />
        <h3 className="text-white/70 text-sm font-medium">Activity Log</h3>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/15">
            <Activity className="w-8 h-8 mb-2" />
            <p className="text-xs">No activity yet</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {events.map((event) => {
              const cfg = EVENT_CONFIG[event.type]
              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
                    <cfg.icon className={cn('w-3.5 h-3.5', cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-xs truncate">{event.message}</p>
                  </div>
                  <span className="text-white/20 text-[10px] flex-shrink-0">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
