'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Wifi } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { SkeletonRow } from '@/components/atoms/skeleton-card'
import { useAdminSocket } from '@/hooks/use-admin-socket'
import { useAdminStore } from '@/store/admin.store'
import { adminApi } from '@/lib/api/admin'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

const ROLE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Customers', value: 'customer' },
  { label: 'Delivery', value: 'delivery' },
  { label: 'Admins', value: 'admin' },
]

const ROLE_COLOR: Record<string, string> = {
  customer: 'text-[#c8ff00] bg-[rgba(200,255,0,0.08)] border-[rgba(200,255,0,0.20)]',
  delivery: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  admin: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
}

const ROLE_AVATAR: Record<string, string> = {
  customer: 'bg-[rgba(200,255,0,0.15)] text-[#c8ff00]',
  delivery: 'bg-violet-600',
  admin: 'bg-orange-700',
}

export default function AdminUsersPage() {
  useAdminSocket()
  const { onlinePartners } = useAdminStore()
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.listUsers({ role: role || undefined })
      setUsers(res.data.data)
      setTotal(res.data.meta?.total ?? res.data.data.length)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [role])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  return (
    <AppShell allowedRoles={['admin']}>
      <div className="px-6 py-8 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-white/30 text-sm mt-0.5">{total} registered users</p>
        </motion.div>

        {/* Role filter tabs */}
        <div className="flex gap-2 mb-6">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setRole(f.value)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-medium transition-all border',
                role === f.value
                  ? 'text-[#050505] border-transparent'
                  : 'bg-white/[0.04] text-white/40 hover:text-white/60 border-white/[0.06]',
              )}
              style={role === f.value ? { background: 'var(--acid)' } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="surface-card rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.06]">
            {['Name', 'Email', 'Role', 'Status'].map((h) => (
              <span key={h} className="text-white/25 text-xs font-medium uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-white/20 text-sm">
              No users found
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {users.map((user, i) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      ROLE_AVATAR[user.role] ?? 'bg-white/10 text-white',
                    )}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white/80 text-sm truncate">{user.name}</span>
                  </div>
                  <span className="text-white/40 text-xs truncate">{user.email}</span>
                  <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium border capitalize', ROLE_COLOR[user.role] ?? 'text-white/40 bg-white/5 border-white/10')}>
                    {user.role}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {user.role === 'delivery' && onlinePartners.has(user._id) ? (
                      <>
                        <Wifi className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 text-xs">Online</span>
                      </>
                    ) : (
                      <span className={cn('text-xs', user.isActive ? 'text-white/30' : 'text-red-400/60')}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
