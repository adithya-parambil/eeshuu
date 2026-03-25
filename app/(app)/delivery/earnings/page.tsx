'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Package, Zap, Clock, IndianRupee, Star } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { ordersApi } from '@/lib/api/orders'
import { ratingsApi } from '@/lib/api/ratings'
import { useAuthStore } from '@/store/auth.store'
import type { DeliveryEarnings, PartnerRatings } from '@/types'

const spring = { type: 'spring' as const, stiffness: 280, damping: 28 }

function StatCard({ label, value, sub, icon: Icon, color, iconColor = 'text-white', index }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string; iconColor?: string; index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: index * 0.06 }}
      className="surface-card rounded-2xl p-5"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-head)' }}>{value}</p>
      {sub && <p className="text-white/40 text-xs mt-0.5">{sub}</p>}
      <p className="text-white/40 text-sm mt-1">{label}</p>
    </motion.div>
  )
}

export default function DeliveryEarningsPage() {
  const user = useAuthStore((s) => s.user)
  const [earnings, setEarnings] = useState<DeliveryEarnings | null>(null)
  const [ratings, setRatings] = useState<PartnerRatings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      ordersApi.getMyEarnings(),
      ratingsApi.getForPartner(user.userId),
    ]).then(([e, r]) => {
      setEarnings(e.data.data)
      setRatings(r.data.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user])

  const stars = Array.from({ length: 5 }, (_, i) => i + 1)

  return (
    <AppShell allowedRoles={['delivery']}>
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-white">Earnings</h1>
          <p className="text-white/30 text-sm mt-0.5">Your performance & commission</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="surface-card rounded-2xl p-5 h-28 shimmer" />
            ))}
          </div>
        ) : earnings ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard label="Total Earnings" value={`₹${earnings.totalEarnings.toFixed(2)}`} icon={IndianRupee} color="bg-[rgba(200,255,0,0.12)] border border-[rgba(200,255,0,0.18)]" iconColor="text-[#c8ff00]" index={0} />
              <StatCard label="This Month" value={`₹${earnings.thisMonthEarnings.toFixed(2)}`} sub={`${earnings.thisMonthDeliveries} deliveries`} icon={TrendingUp} color="bg-[rgba(200,255,0,0.08)] border border-[rgba(200,255,0,0.12)]" iconColor="text-[#c8ff00]" index={1} />
              <StatCard label="Total Deliveries" value={String(earnings.totalDeliveries)} icon={Package} color="bg-violet-600/15 border border-violet-500/20" iconColor="text-violet-400" index={2} />
              <StatCard
                label="Avg Delivery Time"
                value={earnings.avgDeliveryMinutes ? `${earnings.avgDeliveryMinutes} min` : '—'}
                icon={Clock}
                color="bg-amber-700/15 border border-amber-600/20"
                iconColor="text-amber-400"
                index={3}
              />
              <StatCard
                label="Fastest Delivery"
                value={earnings.fastestDeliveryMinutes ? `${earnings.fastestDeliveryMinutes} min` : '—'}
                icon={Zap}
                color="bg-[rgba(200,255,0,0.08)] border border-[rgba(200,255,0,0.12)]"
                iconColor="text-[#c8ff00]"
                index={4}
              />
              {ratings && (
                <StatCard
                  label="Avg Rating"
                  value={ratings.count > 0 ? `${ratings.average} / 5` : 'No ratings yet'}
                  sub={ratings.count > 0 ? `${ratings.count} reviews` : undefined}
                  icon={Star}
                  color="bg-amber-500/10 border border-amber-500/15"
                  iconColor="text-amber-400"
                  index={5}
                />
              )}
            </div>

            {/* Commission info */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.4 }}
              className="surface-card rounded-2xl p-5 mb-6"
            >
              <h3 className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Commission Structure</h3>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                <span className="text-white/60 text-sm">Rate per delivery</span>
                <span className="text-white font-medium text-sm">10% of order value</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-white/60 text-sm">Avg order value</span>
                <span className="text-white font-medium text-sm">
                  {earnings.totalDeliveries > 0
                    ? `₹${(earnings.totalEarnings / earnings.totalDeliveries / 0.10).toFixed(2)}`
                    : '—'}
                </span>
              </div>
            </motion.div>

            {/* Recent ratings */}
            {ratings && ratings.ratings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.5 }}
                className="surface-card rounded-2xl p-5"
              >
                <h3 className="text-white/50 text-xs font-medium uppercase tracking-wider mb-4">Recent Reviews</h3>
                <div className="space-y-4">
                  {ratings.ratings.slice(0, 5).map((r) => (
                    <div key={r._id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 text-white/40 text-xs font-medium">
                        {typeof r.customerId === 'object' ? r.customerId.name[0].toUpperCase() : '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white/70 text-xs font-medium">
                            {typeof r.customerId === 'object' ? r.customerId.name : 'Customer'}
                          </span>
                          <div className="flex gap-0.5">
                            {stars.map((s) => (
                              <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-white/15'}`} />
                            ))}
                          </div>
                        </div>
                        {r.comment && <p className="text-white/40 text-xs">{r.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-white/20">
            <TrendingUp className="w-12 h-12 mb-3" />
            <p className="text-sm">No earnings data yet</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
