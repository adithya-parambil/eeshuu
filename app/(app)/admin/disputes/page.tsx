'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, Loader2, ChevronDown } from 'lucide-react'
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

const ALL_STATUSES: DisputeStatus[] = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED']

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

function getRaisedByName(raisedBy: Dispute['raisedBy']): string {
  if (raisedBy && typeof raisedBy === 'object' && 'name' in raisedBy) return raisedBy.name
  return `…${String(raisedBy).slice(-6)}`
}

function getRaisedByEmail(raisedBy: Dispute['raisedBy']): string | null {
  if (raisedBy && typeof raisedBy === 'object' && 'email' in raisedBy) return raisedBy.email
  return null
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

// ── Respond Modal ─────────────────────────────────────────────────────────────

function RespondModal({
  dispute,
  onClose,
  onSaved,
}: {
  dispute: Dispute
  onClose: () => void
  onSaved: (updated: Dispute) => void
}) {
  const [adminResponse, setAdminResponse] = useState(dispute.adminResponse ?? '')
  const [status, setStatus] = useState<'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'>(
    dispute.status === 'OPEN' ? 'UNDER_REVIEW' : (dispute.status as 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'),
  )
  const [saving, setSaving] = useState(false)
  const orderId = getOrderId(dispute.orderId)
  const orderAmount = getOrderAmount(dispute.orderId)
  const raisedByName = getRaisedByName(dispute.raisedBy)
  const raisedByEmail = getRaisedByEmail(dispute.raisedBy)

  const handleSave = async () => {
    if (!adminResponse.trim()) { toast.error('Response cannot be empty'); return }
    setSaving(true)
    try {
      const r = await disputesApi.respond(dispute._id, { adminResponse: adminResponse.trim(), status })
      toast.success('Dispute updated')
      onSaved(r.data.data)
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update dispute')
    } finally {
      setSaving(false)
    }
  }

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

        <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-1">Raised By</p>
              <p className="text-white/80 text-sm font-medium">{raisedByName}</p>
              {raisedByEmail && <p className="text-white/35 text-xs">{raisedByEmail}</p>}
              <p className="text-white/25 text-xs capitalize mt-0.5">{dispute.raisedByRole}</p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-1">Order</p>
              <p className="text-white/80 text-sm font-mono">#{orderId.slice(-8).toUpperCase()}</p>
              {orderAmount && <p className="text-white/35 text-xs">{orderAmount}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-1">Customer Description</p>
            <p className="text-white/70 text-sm leading-relaxed">{dispute.description}</p>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          {/* Status selector */}
          <div>
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-2">Set Status</p>
            <div className="flex gap-2 flex-wrap">
              {(['UNDER_REVIEW', 'RESOLVED', 'REJECTED'] as const).map((s) => {
                const style = STATUS_STYLE[s]
                const active = status === s
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={
                      active
                        ? { background: style.bg, color: style.text, border: `1px solid ${style.border}` }
                        : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.07)' }
                    }
                  >
                    {style.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Response textarea */}
          <div>
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-2">Admin Response</p>
            <textarea
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              rows={4}
              placeholder="Write your response to the customer…"
              className="w-full rounded-xl px-4 py-3 text-sm text-white/80 resize-none outline-none transition-all placeholder:text-white/20"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(200,255,0,0.35)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Save */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving || !adminResponse.trim()}
            className="w-full h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
            style={{ background: 'var(--acid)', color: '#050505', fontFamily: 'var(--font-head)' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Response'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<DisputeStatus | 'ALL'>('ALL')
  const [selected, setSelected] = useState<Dispute | null>(null)

  const fetchDisputes = (status?: DisputeStatus | 'ALL') => {
    setLoading(true)
    const params = status && status !== 'ALL' ? { status } : undefined
    disputesApi.list(params)
      .then((r) => setDisputes(r.data.data))
      .catch(() => toast.error('Failed to load disputes'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDisputes() }, [])

  const handleFilterChange = (s: DisputeStatus | 'ALL') => {
    setFilterStatus(s)
    fetchDisputes(s)
  }

  const handleSaved = (updated: Dispute) => {
    setDisputes((prev) => prev.map((d) => (d._id === updated._id ? updated : d)))
  }

  const filtered = disputes // already filtered server-side

  return (
    <AppShell allowedRoles={['admin']}>
      <div className="px-6 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-white">Disputes</h1>
          <p className="text-white/30 text-sm mt-0.5">Review and respond to customer disputes</p>
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.05 }}
          className="flex gap-2 flex-wrap mb-6"
        >
          {(['ALL', ...ALL_STATUSES] as const).map((s) => {
            const active = filterStatus === s
            const style = s !== 'ALL' ? STATUS_STYLE[s] : null
            return (
              <button
                key={s}
                onClick={() => handleFilterChange(s)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={
                  active && style
                    ? { background: style.bg, color: style.text, border: `1px solid ${style.border}` }
                    : active
                    ? { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.15)' }
                    : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' }
                }
              >
                {s === 'ALL' ? 'All' : STATUS_STYLE[s].label}
              </button>
            )
          })}
        </motion.div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-white/20"
          >
            <AlertCircle className="w-12 h-12 mb-3" />
            <p className="text-sm">No disputes found</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Table header */}
            <div
              className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              {['Subject', 'Raised By', 'Order', 'Status', 'Time'].map((h) => (
                <span key={h} className="text-white/25 text-xs font-medium uppercase tracking-wider">{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
              {filtered.map((d, i) => {
                const orderId = getOrderId(d.orderId)
                const name = getRaisedByName(d.raisedBy)
                const isClosed = d.status === 'RESOLVED' || d.status === 'REJECTED'
                return (
                  <motion.div
                    key={d._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setSelected(d)}
                    className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center cursor-pointer transition-colors"
                    style={{ background: 'transparent' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <div className="min-w-0">
                      <p className="text-white/80 text-xs font-medium truncate">{d.subject}</p>
                      <p className="text-white/25 text-[10px] truncate mt-0.5">{d.description.slice(0, 60)}…</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white/70 text-xs truncate">{name}</p>
                      <p className="text-white/25 text-[10px] capitalize">{d.raisedByRole}</p>
                    </div>
                    <span className="text-white/50 text-xs font-mono">#{orderId.slice(-8).toUpperCase()}</span>
                    <StatusBadge status={d.status} />
                    <span className="text-white/25 text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <RespondModal
            dispute={selected}
            onClose={() => setSelected(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </AppShell>
  )
}
