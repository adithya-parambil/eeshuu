'use client'
import type { OrderStatus } from '@/types'

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; color: string; border: string; dot: string; pulse?: boolean }> = {
  PENDING:    { label: 'Pending',    bg: 'rgba(255,77,0,0.08)',   color: '#ff6b3d', border: 'rgba(255,77,0,0.20)',   dot: '#ff6b3d' },
  ACCEPTED:   { label: 'Accepted',   bg: 'rgba(200,255,0,0.08)',  color: '#c8ff00', border: 'rgba(200,255,0,0.20)',  dot: '#c8ff00' },
  PICKED_UP:  { label: 'Picked Up',  bg: 'rgba(124,58,255,0.10)', color: '#a78bfa', border: 'rgba(124,58,255,0.22)', dot: '#a78bfa' },
  ON_THE_WAY: { label: 'On the Way', bg: 'rgba(200,255,0,0.10)',  color: '#c8ff00', border: 'rgba(200,255,0,0.25)',  dot: '#c8ff00', pulse: true },
  DELIVERED:  { label: 'Delivered',  bg: 'rgba(200,255,0,0.10)',  color: '#c8ff00', border: 'rgba(200,255,0,0.22)',  dot: '#c8ff00' },
  CANCELLED:  { label: 'Cancelled',  bg: 'rgba(255,77,0,0.08)',   color: '#ff6b3d', border: 'rgba(255,77,0,0.18)',   dot: '#ff6b3d' },
}

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${className ?? ''}`}
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.06em',
      }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.pulse ? 'pulse-dot' : ''}`}
        style={{ background: cfg.dot }}
      />
      {cfg.label}
    </span>
  )
}
