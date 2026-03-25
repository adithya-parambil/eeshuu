'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/app-shell'
import { OrderTable } from '@/components/organisms/order-table'
import { useAdminStore } from '@/store/admin.store'
import { useAdminSocket } from '@/hooks/use-admin-socket'
import { adminApi } from '@/lib/api/admin'
import { cn } from '@/lib/utils'

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'On the Way', value: 'ON_THE_WAY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

export default function AdminOrdersPage() {
  useAdminSocket()
  const { orders, ordersMeta, ordersLoading, setOrders, setOrdersLoading } = useAdminStore()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const res = await adminApi.listOrders({ page, limit: 20, status: status || undefined })
      setOrders(res.data.data, res.data.meta!)
    } catch { /* ignore */ }
    finally { setOrdersLoading(false) }
  }, [page, status])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  return (
    <AppShell allowedRoles={['admin']}>
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-white">All Orders</h1>
          <p className="text-white/30 text-sm mt-0.5">
            {ordersMeta ? `${ordersMeta.total} total orders` : 'Loading…'}
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1) }}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all',
                status === f.value
                  ? 'text-[#050505]'
                  : 'bg-white/[0.04] text-white/40 hover:text-white/60 border border-white/[0.06]',
              )}
              style={status === f.value ? { background: 'var(--acid)' } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>

        <OrderTable orders={orders} loading={ordersLoading} />

        {/* Pagination */}
        {ordersMeta && ordersMeta.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: ordersMeta.totalPages }, (_, i) => i + 1).map((p) => (
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
