'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, ChevronRight, Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { disputesApi } from '@/lib/api/disputes'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import type { Dispute, DisputeStatus } from '@/types'

const spring = { type: 'spring' as const, stiffness: 280, damping: 28 }

const STATUS_STYLE: Record<DisputeStatus, { label: string; bg: string; text: string; border: string }> = {
  OPEN:         { label: 'Open',         bg: 'rgba(234,179,8,0.10)',   text: '#fbbf24', border: 'rgba(234,179,8,0.25)'   },
  UNDER_REVIEW: { label: 'Under Review', bg: 'rgba(59,130,246,0.10)',  text: '#60a5fa', border: 'rgba(59,130,246,0.25)'  },
  RESOLVED:     { label: 'Resolved',     bg: 'rgba(16,185,129,0.10)',  text: '#34d399', border: 'rgba(16,185,129,0.25)'  },
  REJECTED:     { label: 'Rejected',     bg: 'rgba(239,68,68,0.10)',   text: '#f87171', border: 'rgba(239,68,68,0.25)'   },
}

function StatusBadge({ status }: { status: DisputeStatus }) {
  const s = STATUS_STYLE[status]
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  )
}

function getOrderId(orderId: Dispute['orderId']): string {
  if (orderId && typeof orderId === 'object' && '_id' in orderId) return String(orderId._id)
  return String(orderId)
}

function getOrderAmount(orderId: Dispute['orderId']): string | null {
  if (orderId && typeof orderId === 'object' && 'totalAmount' in orderId)
    return `₹${orderId.totalAmount.toFixed(2)}`
  return null
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DisputeDetailModal({ dispute, onClose }: { dispute: Dispute; onClose: () => void }) {
  const orderId = getOrderId(dispute.orderId)
  const orderAmount = getOrderAmount(dispute.orderId)
  const s = STATUS_STYLE[dispute.status]

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
        transition={spring}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-white font-semibold text-sm">{dispute.subject}</p>
            <p className="text-white/30 text-xs mt-0.5">
              Raised {formatDistanceToNow(new Date(dispute.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={dispute.status} />
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Order ref */}
          <div>
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-1">Order Reference</p>
            <p className="text-white/80 text-sm font-mono">#{orderId.slice(-8).toUpperCase()}</p>
            {orderAmount && <p className="text-white/40 text-xs mt-0.5">{orderAmount}</p>}
          </div>

          {/* Description */}
          <div>
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-1">Description</p>
            <p className="text-white/70 text-sm leading-relaxed">{dispute.description}</p>
          </div>

          {/* Admin response */}
          {dispute.adminResponse ? (
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: `${s.bg}`, border: `1px solid ${s.border}` }}
            >
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: s.text }}>
                Admin Response
              </p>
              <p className="text-white/70 text-sm leading-relaxed">{dispute.adminResponse}</p>
              {dispute.resolvedAt && (
                <p className="text-white/25 text-[10px] mt-2">
                  {format(new Date(dispute.resolvedAt), 'dd MMM yyyy, hh:mm a')}
                </p>
              )}
            </div>
          ) : (
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <p className="text-white/25 text-sm italic">Awaiting admin response…</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Dispute | null>(null)

  useEffect(() => {
    disputesApi.list()
      .then((r) => setDisputes(r.data.data))
      .catch(() => toast.error('Failed to load disputes'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell allowedRoles={['customer']}>
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-head)' }}>My Disputes</h1>
          <p className="text-white/30 text-sm mt-0.5">Track the status of your raised disputes</p>
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        ) : disputes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-white/20"
          >
            <AlertCircle className="w-12 h-12 mb-3" />
            <p className="text-sm">No disputes raised yet</p>
            <p className="text-xs mt-1 text-white/15">You can raise a dispute from any order detail page</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {disputes.map((d, i) => {
              const orderId = getOrderId(d.orderId)
              const orderAmount = getOrderAmount(d.orderId)
              return (
                <motion.div
                  key={d._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: i * 0.04 }}
                  onClick={() => setSelected(d)}
                  className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer group transition-colors"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: STATUS_STYLE[d.status].bg }}
                  >
                    <AlertCircle className="w-4 h-4" style={{ color: STATUS_STYLE[d.status].text }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/85 text-sm font-medium truncate">{d.subject}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-white/30 text-xs font-mono">#{orderId.slice(-8).toUpperCase()}</span>
                      {orderAmount && <span className="text-white/20 text-xs">· {orderAmount}</span>}
                      <span className="text-white/20 text-xs">· {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={d.status} />
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && <DisputeDetailModal dispute={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </AppShell>
  )
}
