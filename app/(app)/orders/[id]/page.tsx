'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Package, X, Loader2, Navigation, Star, MessageSquare } from 'lucide-react'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/layout/app-shell'
import { StatusStepper } from '@/components/molecules/status-stepper'
import { StatusBadge } from '@/components/atoms/status-badge'
import { Spinner } from '@/components/atoms/spinner'
import { useCustomerStore } from '@/store/customer.store'
import { useOrderSocket } from '@/hooks/use-order-socket'
import { ordersApi } from '@/lib/api/orders'
import { ratingsApi } from '@/lib/api/ratings'
import { disputesApi } from '@/lib/api/disputes'
import { geocodeAddress } from '@/lib/geocode'
import { connectSocket } from '@/lib/socket/socket-client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { OrderDeliveredPopup } from '@/components/molecules/order-delivered-popup'

// SSR-safe map import
const DeliveryMap = dynamic(
  () => import('@/components/molecules/delivery-map'),
  { ssr: false, loading: () => <div className="w-full h-48 rounded-xl bg-white/[0.03] animate-pulse" /> },
)

const spring = { type: 'spring' as const, stiffness: 280, damping: 28 }

export default function OrderDetailPage() {
  useOrderSocket()
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const {
    activeOrder, setActiveOrder, updateOrderInList,
    partnerCoords: storedPartnerCoords, setPartnerCoords,
    showDeliveredPopup, setShowDeliveredPopup,
  } = useCustomerStore()
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // Rating state
  const [existingRating, setExistingRating] = useState<number | null>(null)
  const [ratingValue, setRatingValue] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [showRatingForm, setShowRatingForm] = useState(false)

  // Dispute state
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [disputeSubject, setDisputeSubject] = useState('')
  const [disputeDesc, setDisputeDesc] = useState('')
  const [submittingDispute, setSubmittingDispute] = useState(false)

  // Map state
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [partnerCoords, setPartnerCoordsLocal] = useState<{ lat: number; lng: number } | null>(
    storedPartnerCoords ?? null,
  )
  const [partnerAccuracy, setPartnerAccuracy] = useState<number | undefined>(undefined)
  const [partnerOffline, setPartnerOffline] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await ordersApi.get(id)
        const order = res.data.data
        setActiveOrder(order)

        // Geocode delivery address for map
        const addr = `${order.deliveryAddress.line1}, ${order.deliveryAddress.city}, ${order.deliveryAddress.pincode}`
        geocodeAddress(addr).then((coords) => { if (coords) setDestCoords(coords) })

        // Fetch last known partner location from Redis cache (not MongoDB)
        if (['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'].includes(order.status)) {
          ordersApi.getPartnerLocation(id).then((r) => {
            const loc = r.data.data
            if (loc) {
              setPartnerCoords({ lat: loc.lat, lng: loc.lng })
              if (loc.accuracy !== undefined) setPartnerAccuracy(loc.accuracy)
            }
          }).catch(() => {})
        }

        // Check if already rated (for DELIVERED orders)
        if (order.status === 'DELIVERED') {
          ratingsApi.getForOrder(id).then((r) => {
            if (r.data.data) setExistingRating(r.data.data.rating)
            else setShowRatingForm(true)
          }).catch(() => {})
        }
      } catch {
        toast.error('Order not found')
        router.push('/orders')
      } finally {
        setLoading(false)
      }
    }
    fetch()
    return () => setActiveOrder(null)
  }, [id, router, setActiveOrder, setPartnerCoords])

  // ── Polling: always-on every 10s for consistent freshness ───────────────────
  useEffect(() => {
    let pollId: NodeJS.Timeout | null = null
    const poll = async () => {
      try {
        const res = await ordersApi.get(id)
        const order = res.data.data
        setActiveOrder(order)
        updateOrderInList(id, order)

        // Only update partner location via poll if status is active
        if (['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'].includes(order.status)) {
          const locRes = await ordersApi.getPartnerLocation(id)
          const loc = locRes.data.data
          if (loc) {
            setPartnerCoords({ lat: loc.lat, lng: loc.lng })
            if (loc.accuracy !== undefined) setPartnerAccuracy(loc.accuracy)
          }
        }
      } catch { /* ignore */ }
    }
    pollId = setInterval(() => { void poll() }, 10_000)
    return () => { if (pollId) clearInterval(pollId) }
  }, [id, setActiveOrder, updateOrderInList, setPartnerCoords])

  // Join the order room so we receive live location broadcasts, then listen for updates
  useEffect(() => {
    const socket = connectSocket('/order')

    // Join the order-specific room so the server broadcasts reach this client
    socket.emit('join:order', { orderId: id })

    const locationHandler = (e: CustomEvent) => {
      const { orderId, lat, lng, accuracy } = e.detail
      if (orderId === id) {
        setPartnerCoordsLocal({ lat, lng })
        setPartnerCoords({ lat, lng })
        setPartnerOffline(false)
        if (accuracy !== undefined) setPartnerAccuracy(accuracy)
      }
    }
    window.addEventListener('partner-location', locationHandler as EventListener)

    // Handle partner going offline — show stale indicator
    const offlineHandler = (payload: { partnerId: string }) => {
      setPartnerOffline(true)
      toast.warning('Delivery partner went offline', { id: 'partner-offline' })
    }
    socket.on('v1:PARTNER:OFFLINE', offlineHandler)

    // Handle partner coming back online
    const onlineHandler = () => {
      setPartnerOffline(false)
      toast.success('Delivery partner is back online', { id: 'partner-offline' })
    }
    socket.on('v1:PARTNER:ONLINE', onlineHandler)

    return () => {
      socket.emit('leave:order', { orderId: id })
      window.removeEventListener('partner-location', locationHandler as EventListener)
      socket.off('v1:PARTNER:OFFLINE', offlineHandler)
      socket.off('v1:PARTNER:ONLINE', onlineHandler)
    }
  }, [id])

  const handleCancel = async () => {
    if (!activeOrder || !cancelReason.trim()) return
    setCancelling(true)
    try {
      await ordersApi.cancel(id, cancelReason.trim())
      updateOrderInList(id, { status: 'CANCELLED' })
      setShowCancelModal(false)
      toast.success('Order cancelled')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Cannot cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const handleRating = async () => {
    if (!ratingValue) return
    setSubmittingRating(true)
    try {
      await ratingsApi.submit({ orderId: id, rating: ratingValue, comment: ratingComment || undefined })
      setExistingRating(ratingValue)
      setShowRatingForm(false)
      toast.success('Rating submitted')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to submit rating')
    } finally {
      setSubmittingRating(false)
    }
  }

  const handleDispute = async () => {
    if (!disputeSubject || !disputeDesc) return
    setSubmittingDispute(true)
    try {
      await disputesApi.raise({ orderId: id, subject: disputeSubject, description: disputeDesc })
      setShowDisputeForm(false)
      toast.success('Dispute raised — our team will review it')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to raise dispute')
    } finally {
      setSubmittingDispute(false)
    }
  }

  if (loading) {
    return (
      <AppShell allowedRoles={['customer']}>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </AppShell>
    )
  }

  if (!activeOrder) return null

  const canCancel = activeOrder.status === 'PENDING'
  const isActive = ['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'].includes(activeOrder.status)
  const pricing = activeOrder.pricing
  const partner = activeOrder.deliveryPartnerId && typeof activeOrder.deliveryPartnerId === 'object'
    ? activeOrder.deliveryPartnerId as { _id: string; name: string; phone?: string }
    : null

  // Show map for all active statuses — as soon as we have any coords (partner or dest)
  const showMap = isActive && (partnerCoords != null || destCoords != null)

  return (
    <AppShell allowedRoles={['customer']}>
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/orders')}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to orders
        </button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-white">
                Order #{activeOrder.orderId ?? String(activeOrder._id).slice(-8).toUpperCase()}
              </h1>
              <p className="text-white/30 text-sm mt-1">
                {new Date(activeOrder.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
            <StatusBadge status={activeOrder.status} />
          </div>

          {/* Live tracking stepper */}
          <div className="surface-card rounded-2xl p-6 mb-4">
            <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-5">Order Tracking</h2>
            <StatusStepper status={activeOrder.status} statusHistory={activeOrder.statusHistory} />
          </div>

          {/* Live map */}
          <AnimatePresence>
            {showMap && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={spring}
                className="surface-card rounded-2xl overflow-hidden mb-4"
              >
                <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                  <Navigation className="w-4 h-4" style={{ color: 'var(--acid)' }} />
                  <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">Partner Location</h2>
                </div>
                <div style={{ height: 220 }}>
                  <DeliveryMap
                    partnerLat={partnerCoords?.lat}
                    partnerLng={partnerCoords?.lng}
                    destLat={destCoords?.lat}
                    destLng={destCoords?.lng}
                    accuracyMeters={partnerAccuracy}
                    className="w-full h-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delivery partner card */}
          {partner && (
            <div className="surface-card rounded-2xl p-5 mb-4">
              <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-3">Delivery Partner</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'rgba(200,255,0,0.10)', color: 'var(--acid)' }}>
                    {partner.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">{partner.name}</p>
                    {partner.phone && <p className="text-white/40 text-xs">{partner.phone}</p>}
                  </div>
                </div>
                {existingRating && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={cn('w-3.5 h-3.5', i < existingRating ? 'text-amber-400 fill-amber-400' : 'text-white/15')} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery address */}
          <div className="surface-card rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-white/30" />
              <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">Delivery Address</h2>
            </div>
            <p className="text-white/80 text-sm">{activeOrder.deliveryAddress.line1}</p>
            <p className="text-white/50 text-sm">{activeOrder.deliveryAddress.city} — {activeOrder.deliveryAddress.pincode}</p>
          </div>

          {/* Items + pricing breakdown */}
          <div className="surface-card rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-white/30" />
              <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">Items</h2>
            </div>
            <div className="space-y-3">
              {activeOrder.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">{item.name}</p>
                    <p className="text-white/30 text-xs">×{item.quantity}</p>
                  </div>
                  <span className="text-white/60 text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}

              {/* Pricing breakdown */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2">
                {pricing ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Subtotal</span>
                      <span className="text-white/60">₹{pricing.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">GST (5%)</span>
                      <span className="text-white/60">₹{pricing.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Delivery fee</span>
                      <span className="text-white/60">₹{pricing.deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Platform fee</span>
                      <span className="text-white/60">₹{pricing.platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/[0.06]">
                      <span className="text-white/70 text-sm font-medium">Total paid</span>
                      <span className="text-white font-semibold">₹{pricing.total.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-white/50 text-sm font-medium">Total</span>
                    <span className="text-white font-semibold">₹{activeOrder.totalAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rating form (shown after delivery) */}
          <AnimatePresence>
            {showRatingForm && activeOrder.status === 'DELIVERED' && !existingRating && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={spring}
                className="surface-card rounded-2xl p-5 mb-4"
              >
                <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-4">Rate your delivery</h2>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRatingValue(s)}>
                      <Star className={cn('w-7 h-7 transition-colors', s <= ratingValue ? 'text-amber-400 fill-amber-400' : 'text-white/20 hover:text-amber-400/50')} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Leave a comment (optional)"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] outline-none focus:border-amber-500/40 transition-all placeholder:text-white/25 resize-none mb-3"
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRating}
                  disabled={!ratingValue || submittingRating}
                  className="w-full h-10 bg-amber-600/80 hover:bg-amber-500/80 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {submittingRating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Rating'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dispute form */}
          <AnimatePresence>
            {showDisputeForm && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={spring}
                className="surface-card rounded-2xl p-5 mb-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">Raise a Dispute</h2>
                  <button onClick={() => setShowDisputeForm(false)} className="text-white/30 hover:text-white/60">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  value={disputeSubject}
                  onChange={(e) => setDisputeSubject(e.target.value)}
                  placeholder="Subject"
                  className="w-full h-10 px-4 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] outline-none focus:border-red-500/40 transition-all placeholder:text-white/25 mb-3"
                />
                <textarea
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] outline-none focus:border-red-500/40 transition-all placeholder:text-white/25 resize-none mb-3"
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDispute}
                  disabled={!disputeSubject || !disputeDesc || submittingDispute}
                  className="w-full h-10 bg-red-600/70 hover:bg-red-500/70 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {submittingDispute ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Dispute'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="space-y-3">
            {canCancel && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCancelModal(true)}
                className="w-full h-11 bg-red-500/10 hover:bg-red-500/15 text-red-400 border border-red-500/20 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel Order
              </motion.button>
            )}
            {!showDisputeForm && activeOrder.status !== 'CANCELLED' && (
              <button
                onClick={() => setShowDisputeForm(true)}
                className="w-full h-10 text-white/30 hover:text-white/50 text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Report an issue
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Cancel reason modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !cancelling && setShowCancelModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={spring}
              className="w-full max-w-md bg-[#111] border border-white/[0.08] rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-white font-semibold mb-1">Cancel Order</h2>
              <p className="text-white/40 text-sm mb-4">Please tell us why you're cancelling.</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed my mind, ordered by mistake…"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/[0.04] border border-white/[0.08] outline-none focus:border-red-500/40 transition-all placeholder:text-white/25 resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="flex-1 h-10 rounded-xl bg-white/[0.04] text-white/50 text-sm font-medium hover:bg-white/[0.08] transition-colors"
                >
                  Keep Order
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCancel}
                  disabled={!cancelReason.trim() || cancelling}
                  className="flex-1 h-10 rounded-xl bg-red-600/80 hover:bg-red-500/80 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Cancel'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OrderDeliveredPopup
        show={showDeliveredPopup}
        role="customer"
        onClose={() => {
          setShowDeliveredPopup(false)
          setShowRatingForm(true)
        }}
      />
    </AppShell>
  )
}
