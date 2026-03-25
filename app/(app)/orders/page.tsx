'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { OrderCard } from '@/components/molecules/order-card'
import { SkeletonOrderCard } from '@/components/atoms/skeleton-card'
import { useCustomerStore } from '@/store/customer.store'
import { useOrderSocket } from '@/hooks/use-order-socket'
import { ordersApi } from '@/lib/api/orders'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'

/* ─── Filter Config ──────────────────────────────────────── */
const STATUS_FILTERS = [
  { label: 'All Orders', value: '', icon: SlidersHorizontal, color: 'acid' },
  { label: 'Pending',    value: 'PENDING',   icon: Clock,         color: 'amber' },
  { label: 'Active',     value: 'ACCEPTED',  icon: Truck,         color: 'violet' },
  { label: 'Delivered',  value: 'DELIVERED', icon: CheckCircle2,  color: 'emerald' },
  { label: 'Cancelled',  value: 'CANCELLED', icon: XCircle,       color: 'rose' },
] as const

type FilterColor = 'acid' | 'amber' | 'violet' | 'emerald' | 'rose'

const COLOR_MAP: Record<FilterColor, { pill: string; glow: string; dot: string }> = {
  acid:    { pill: 'bg-[rgba(200,255,0,0.12)] text-[#c8ff00] border-[rgba(200,255,0,0.25)]', glow: 'shadow-[rgba(200,255,0,0.15)]', dot: 'bg-[#c8ff00]' },
  amber:   { pill: 'bg-amber-500/20 text-amber-300 border-amber-500/30', glow: 'shadow-amber-500/20',   dot: 'bg-amber-400' },
  violet:  { pill: 'bg-violet-500/20 text-violet-300 border-violet-500/30', glow: 'shadow-violet-500/20', dot: 'bg-violet-400' },
  emerald: { pill: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', glow: 'shadow-emerald-500/20', dot: 'bg-emerald-400' },
  rose:    { pill: 'bg-rose-500/20 text-rose-300 border-rose-500/30',    glow: 'shadow-rose-500/20',    dot: 'bg-rose-400' },
}

/* ─── Page ───────────────────────────────────────────────── */
export default function OrdersPage() {
  useOrderSocket()

  const { orders, ordersMeta, ordersLoading, setOrders, setOrdersLoading } =
    useCustomerStore()

  const [status, setStatus]         = useState('')
  const [page, setPage]             = useState(1)
  const [refreshing, setRefreshing] = useState(false)

  const activeFilter = STATUS_FILTERS.find((f) => f.value === status) ?? STATUS_FILTERS[0]
  const colors       = COLOR_MAP[activeFilter.color as FilterColor]

  /* fetch */
  const fetchOrders = useCallback(async (showSpin = false) => {
    if (showSpin) setRefreshing(true)
    setOrdersLoading(true)
    try {
      const res = await ordersApi.list({ page, limit: 10, status: status || undefined })
      setOrders(res.data.data, res.data.meta!)
    } catch { /* ignore */ } finally {
      setOrdersLoading(false)
      setRefreshing(false)
    }
  }, [page, status])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  /* pagination helpers */
  const totalPages  = ordersMeta?.totalPages ?? 1
  const hasPrev     = page > 1
  const hasNext     = page < totalPages

  /* skeleton count */
  const skeletons = ordersLoading ? Array.from({ length: 5 }) : []

  return (
    <AppShell allowedRoles={['customer']}>
      {/* ── Full-page background ── */}
      <div className="relative min-h-screen bg-[#080c14] text-white">

        {/* Ambient glow orbs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #c8ff00, transparent 70%)', filter: 'blur(120px)' }} />
          <div className="absolute top-1/3 -right-32 w-[380px] h-[380px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #7c3aff, transparent 70%)', filter: 'blur(100px)' }} />
        </div>

        {/* ── Content wrapper ── */}
        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 sm:py-12">

          {/* ═══ HEADER ══════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 flex items-start justify-between gap-4"
          >
            <div>
              {/* eyebrow */}
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(200,255,0,0.55)', fontFamily: 'var(--font-mono)' }}>
                <span className="inline-block w-4 h-px" style={{ background: 'rgba(200,255,0,0.50)' }} />
                Customer Portal
              </p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none" style={{ fontFamily: 'var(--font-head)' }}>
                My Orders
              </h1>
              <p className="mt-2 text-sm text-white/30 font-light">
                Real-time tracking for every purchase
              </p>
            </div>

            {/* Refresh button */}
            <button
              onClick={() => fetchOrders(true)}
              aria-label="Refresh orders"
              className="mt-1 flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/40 transition hover:border-white/20 hover:text-white/70 active:scale-95"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </motion.div>

          {/* ═══ FILTER PILLS ════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
            className="mb-7 flex gap-2 overflow-x-auto pb-1 scrollbar-none"
          >
            {STATUS_FILTERS.map((f) => {
              const active = status === f.value
              const c      = COLOR_MAP[f.color as FilterColor]
              const Icon   = f.icon
              return (
                <button
                  key={f.value}
                  onClick={() => { setStatus(f.value); setPage(1) }}
                  className={cn(
                    'relative flex-shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200',
                    active
                      ? cn(c.pill, 'shadow-lg', c.glow, 'scale-[1.04]')
                      : 'border-white/[0.07] bg-white/[0.03] text-white/35 hover:text-white/60 hover:border-white/15',
                  )}
                >
                  <Icon className="w-3 h-3 flex-shrink-0" />
                  {f.label}
                  {active && (
                    <motion.span
                      layoutId="pill-dot"
                      className={cn('ml-0.5 inline-block w-1.5 h-1.5 rounded-full', c.dot)}
                    />
                  )}
                </button>
              )
            })}
          </motion.div>

          {/* ═══ STATS ROW (only when data loaded) ═════════ */}
          {/* <AnimatePresence>
            {!ordersLoading && orders.length > 0 && ordersMeta && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6 overflow-hidden"
              >
                <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                  {[
                    { label: 'Total',   value: ordersMeta.total },
                    { label: 'Page',    value: `${page} / ${totalPages}` },
                    { label: 'Showing', value: orders.length },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="text-lg font-black text-white">{value}</p>
                      <p className="mt-0.5 text-[10px] text-white/30 uppercase tracking-widest">{label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence> */}

          {/* ═══ ORDER LIST ══════════════════════════════════ */}
          <AnimatePresence mode="wait">
            {ordersLoading ? (
              /* Skeletons */
              <motion.div
                key="skeletons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {skeletons.map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <SkeletonOrderCard />
                  </motion.div>
                ))}
              </motion.div>

            ) : orders.length === 0 ? (
              /* Empty state */
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] py-24 text-center"
              >
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                  <ShoppingBag className="w-7 h-7 text-white/20" />
                </div>
                <p className="text-base font-semibold text-white/20">No orders found</p>
                <p className="mt-1 text-xs text-white/15">
                  {status ? 'Try a different filter' : 'Your orders will appear here'}
                </p>
                {status && (
                  <button
                    onClick={() => { setStatus(''); setPage(1) }}
                    className="mt-4 rounded-full bg-white/[0.05] px-4 py-1.5 text-xs text-white/40 hover:text-white/60 transition"
                  >
                    Clear filter
                  </button>
                )}
              </motion.div>

            ) : (
              /* Order cards */
              <motion.div
                key={`list-${status}-${page}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                {orders.map((order, i) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: i * 0.055,
                      duration: 0.4,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <OrderCard order={order} index={i} href={`/orders/${order._id}`} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ PAGINATION ══════════════════════════════════ */}
          <AnimatePresence>
            {totalPages > 1 && !ordersLoading && (
              <motion.div
                key="pagination"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-10 flex items-center justify-center gap-1.5"
              >
                {/* Prev */}
                <button
                  disabled={!hasPrev}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/40 transition hover:border-white/20 hover:text-white/70 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // show first, last, current ±1
                    return (
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - page) <= 1
                    )
                  })
                  .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                    if (idx > 0) {
                      const prev = arr[idx - 1]
                      if (typeof prev === 'number' && p - prev > 1) acc.push('ellipsis')
                    }
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, idx) =>
                    p === 'ellipsis' ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="flex h-9 w-6 items-end justify-center pb-1 text-xs text-white/20"
                      >
                        ···
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-semibold transition-all duration-200',
                          page === p
                            ? cn(colors.pill, 'shadow-lg', colors.glow, 'scale-[1.08]')
                            : 'border-white/[0.07] bg-white/[0.03] text-white/35 hover:text-white/60 hover:border-white/15',
                        )}
                      >
                        {p}
                      </button>
                    ),
                  )}

                {/* Next */}
                <button
                  disabled={!hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/40 transition hover:border-white/20 hover:text-white/70 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </AppShell>
  )
}