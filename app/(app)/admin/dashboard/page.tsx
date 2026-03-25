'use client'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, Users, ShoppingBag, Wifi } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { LiveFeed } from '@/components/molecules/live-feed'
import { OrderTable } from '@/components/organisms/order-table'
import { useAdminStore } from '@/store/admin.store'
import { useAdminSocket } from '@/hooks/use-admin-socket'
import { adminApi } from '@/lib/api/admin'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500',
  ACCEPTED: 'bg-blue-500',
  PICKED_UP: 'bg-violet-500',
  ON_THE_WAY: 'bg-cyan-500',
  DELIVERED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  PICKED_UP: 'Picked Up',
  ON_THE_WAY: 'On the Way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

const spring = { type: 'spring' as const, stiffness: 280, damping: 28 }

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  iconColor?: string
  index: number
}

function StatCard({ label, value, icon: Icon, color, iconColor = 'text-white', index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: index * 0.06 }}
      className="surface-card rounded-2xl p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-head)' }}>{value}</p>
      <p className="text-white/40 text-sm mt-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{label}</p>
    </motion.div>
  )
}

export default function AdminDashboardPage() {
  useAdminSocket()
  const { stats, orders, ordersLoading, activityFeed, onlinePartners, setStats, setOrders } = useAdminStore()

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          adminApi.getStats(),
          adminApi.listOrders({ limit: 20 }),
        ])
        setStats(statsRes.data.data)
        setOrders(ordersRes.data.data, ordersRes.data.meta!)
      } catch { /* ignore */ }
    }
    fetchAll()
  }, [])

  const statCards = stats ? [
    { label: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'bg-[rgba(200,255,0,0.15)] border border-[rgba(200,255,0,0.20)]', iconColor: 'text-[#c8ff00]' },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-violet-600/15 border border-violet-500/20', iconColor: 'text-violet-400' },
    { label: 'Active Products', value: stats.activeProducts, icon: ShoppingBag, color: 'bg-[rgba(200,255,0,0.10)] border border-[rgba(200,255,0,0.15)]', iconColor: 'text-[#c8ff00]' },
    { label: 'Online Partners', value: onlinePartners.size, icon: Wifi, color: 'bg-orange-500/10 border border-orange-500/15', iconColor: 'text-orange-400' },
  ] : []

  return (
    <AppShell allowedRoles={['admin']}>
      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-head)' }}>Dashboard</h1>
          <p className="text-white/30 text-sm mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>System overview — live</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <StatCard key={s.label} {...s} index={i} />
          ))}
          {!stats && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="surface-card rounded-2xl p-5 h-28 shimmer" />
          ))}
        </div>

        {/* Status breakdown */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.3 }}
            className="surface-card rounded-2xl p-5 mb-8"
          >
            <h3 className="text-white/50 text-xs font-medium uppercase tracking-wider mb-4">Orders by Status</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[status] ?? 'bg-white/20'}`} />
                  <span className="text-white/60 text-xs">{STATUS_LABEL[status] ?? status}</span>
                  <span className="text-white font-semibold text-sm ml-1">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Two-column: table + feed */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div>
            <h3 className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Recent Orders</h3>
            <OrderTable orders={orders} loading={ordersLoading} />
          </div>
          <div>
            <h3 className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Activity</h3>
            <LiveFeed events={activityFeed} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
