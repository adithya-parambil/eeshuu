'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Truck, CheckCircle, Loader2, Package, MapPin, Phone, User, Maximize2, ChevronLeft, MapPinOff, LocateFixed } from 'lucide-react'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/layout/app-shell'
import { StatusStepper } from '@/components/molecules/status-stepper'
import { StatusBadge } from '@/components/atoms/status-badge'
import { Spinner } from '@/components/atoms/spinner'
import { OrderDeliveredPopup } from '@/components/molecules/order-delivered-popup'
import { useDeliveryStore } from '@/store/delivery.store'
import { useOrderSocket } from '@/hooks/use-order-socket'
import { ordersApi } from '@/lib/api/orders'
import { connectSocket } from '@/lib/socket/socket-client'
import { geocodeAddress } from '@/lib/geocode'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const DeliveryMap = dynamic(
  () => import('@/components/molecules/delivery-map'),
  { ssr: false, loading: () => <div className="w-full h-full bg-white/[0.03] animate-pulse" /> },
)

const STATUS_FLOW: { from: OrderStatus; to: OrderStatus; label: string }[] = [
  { from: 'ACCEPTED',   to: 'PICKED_UP',  label: 'Mark as Picked Up' },
  { from: 'PICKED_UP',  to: 'ON_THE_WAY', label: 'Start Delivery' },
  { from: 'ON_THE_WAY', to: 'DELIVERED',  label: 'Mark as Delivered' },
]

// ── Calculate distance in meters using Haversine formula ──────────────────────
function distanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const spring = { type: 'spring' as const, stiffness: 280, damping: 28 }

type GeoPermission = 'unknown' | 'granted' | 'denied' | 'prompt' | 'requesting'

export default function DeliveryActivePage() {
  useOrderSocket()
  const {
    activeOrder, setActiveOrder, updateActiveOrderStatus,
    partnerCoords, setPartnerCoords,
    showDeliveredPopup, setShowDeliveredPopup,
  } = useDeliveryStore()
  const [updating, setUpdating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mapFullscreen, setMapFullscreen] = useState(false)
  const [geoPermission, setGeoPermission] = useState<GeoPermission>('unknown')
  const locationWatchRef = useRef<number | null>(null)
  const [showForceDeliverModal, setShowForceDeliverModal] = useState(false)

  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(partnerCoords ?? null)
  const [myAccuracy, setMyAccuracy] = useState<number | undefined>(undefined)
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  useEffect(() => {
    console.log('[ACTIVE] useEffect triggered - fetching active order')
    
    // TEST: Try geocoding the user's actual address
    console.log('[ACTIVE] TEST: Geocoding user address')
    geocodeAddress('B-104, MALKOS SECTOR 10 VASANT NAGARI VASAI EAST 401208')
      .then(coords => console.log('[ACTIVE] TEST: User address geocoded to:', coords))
      .catch(err => console.error('[ACTIVE] TEST: User address geocoding failed:', err))
    
    ordersApi.getMyActive()
      .then((res) => {
        const order = res.data.data ?? null
        console.log('[ACTIVE] Fetched active order:', order)
        console.log('[ACTIVE] Order delivery address:', order?.deliveryAddress)
        setActiveOrder(order)
        if (order) {
          // Check if coordinates are already in the address object
          const addr = order.deliveryAddress
          if (addr.lat != null && addr.lng != null) {
            console.log('[ACTIVE] Using coordinates from address object:', { lat: addr.lat, lng: addr.lng })
            setDestCoords({ lat: addr.lat, lng: addr.lng })
            setGeocodingStatus('success')
          } else {
            // Geocode the address string
            const addrStr = `${addr.line1}, ${addr.city}, ${addr.pincode}`
            console.log('[ACTIVE] Constructed address string:', addrStr)
            console.log('[ACTIVE] Starting geocode for address:', addrStr)
            setGeocodingStatus('loading')
            geocodeAddress(addrStr)
              .then((c) => {
                console.log('[ACTIVE] Geocode promise resolved with:', c)
                if (c) {
                  setDestCoords(c)
                  setGeocodingStatus('success')
                  console.log('[ACTIVE] Destination coordinates set:', c)
                } else {
                  setGeocodingStatus('error')
                  console.log('[ACTIVE] Geocode returned null - no coordinates found')
                  // Show toast with error
                  toast.error('Could not find destination coordinates')
                }
              })
              .catch((err) => {
                setGeocodingStatus('error')
                console.error('[ACTIVE] Geocode promise rejected with error:', err)
                toast.error('Geocoding failed')
              })
          }
        } else {
          console.log('[ACTIVE] No active order found')
        }
      })
      .catch((err) => {
        console.error('[ACTIVE] Failed to fetch active order:', err)
      })
      .finally(() => {
        console.log('[ACTIVE] Setting loading to false')
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Check geolocation permission on mount ──────────────────────────────────
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoPermission('denied')
      return
    }
    if (!navigator.permissions) {
      // Permissions API not available — treat as prompt
      setGeoPermission('prompt')
      return
    }
    navigator.permissions.query({ name: 'geolocation' }).then((status) => {
      setGeoPermission(status.state as GeoPermission)
      status.onchange = () => setGeoPermission(status.state as GeoPermission)
    }).catch(() => setGeoPermission('prompt'))
  }, [])

  const startWatchPosition = useCallback((orderId: string) => {
    if (locationWatchRef.current !== null) return
    const socket = connectSocket('/order')
    console.log('[GPS] Starting location tracking for order:', orderId)
    locationWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        console.log('[GPS] Position update:', { lat, lng, accuracy })
        setMyCoords({ lat, lng })
        setPartnerCoords({ lat, lng })
        setMyAccuracy(accuracy)
        socket.emit('v1:PARTNER:LOCATION', { orderId, lat, lng, accuracy, eventId: `${orderId}-${Date.now()}` }, () => {})
      },
      (err) => { 
        console.error('[GPS] Error:', err)
        if (err.code !== err.TIMEOUT) toast.error('Location unavailable') 
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
    )
  }, [setMyCoords, setPartnerCoords, setMyAccuracy])

  const stopLocationTracking = useCallback(() => {
    if (locationWatchRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchRef.current)
      locationWatchRef.current = null
    }
  }, [])

  // ── Request permission then start tracking ─────────────────────────────────
  const requestPermissionAndTrack = useCallback((orderId: string) => {
    setGeoPermission('requesting')
    navigator.geolocation.getCurrentPosition(
      () => {
        setGeoPermission('granted')
        startWatchPosition(orderId)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoPermission('denied')
          toast.error('Location permission denied')
        } else {
          // Timeout / unavailable — still treat as granted and try watchPosition
          setGeoPermission('granted')
          startWatchPosition(orderId)
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [startWatchPosition])

  // ── Auto-start tracking when permission + active order are ready ───────────
  useEffect(() => {
    if (!activeOrder || !['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'].includes(activeOrder.status)) {
      stopLocationTracking()
      return
    }
    
    // Auto-request permission if it's in prompt state
    if (geoPermission === 'prompt') {
      requestPermissionAndTrack(activeOrder._id)
    } else if (geoPermission === 'granted') {
      startWatchPosition(activeOrder._id)
    }
    
    return stopLocationTracking
  }, [activeOrder?.status, activeOrder?._id, geoPermission, requestPermissionAndTrack, startWatchPosition, stopLocationTracking])

  useEffect(() => {
    const socket = connectSocket('/order')
    const handler = (payload: { orderId: string }) => {
      if (activeOrder && payload.orderId === activeOrder._id) {
        stopLocationTracking()
        setActiveOrder(null)
      }
    }
    socket.on('v1:ORDER:CANCELLED', handler)
    return () => { socket.off('v1:ORDER:CANCELLED', handler) }
  }, [activeOrder?._id])

  useEffect(() => {
    if (mapFullscreen) {
      document.body.style.overflow = 'hidden'
      document.body.classList.add('map-fullscreen')
    } else {
      document.body.style.overflow = ''
      document.body.classList.remove('map-fullscreen')
    }
    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('map-fullscreen')
    }
  }, [mapFullscreen])

  const nextAction = STATUS_FLOW.find((s) => s.from === activeOrder?.status)

  // Calculate distance to destination for proximity check
  const distanceToDestination = myCoords && destCoords
    ? distanceInMeters(myCoords.lat, myCoords.lng, destCoords.lat, destCoords.lng)
    : null

  // Only allow "Mark as Delivered" if within 50 meters of destination
  const canMarkDelivered = nextAction?.to === 'DELIVERED'
    ? distanceToDestination !== null && distanceToDestination <= 50
    : true // Allow other status updates without proximity check

  const handleStatusUpdate = async () => {
    if (!activeOrder || !nextAction) return
    
    // If trying to mark as delivered but not in proximity, show force deliver modal
    if (nextAction.to === 'DELIVERED' && !canMarkDelivered) {
      setShowForceDeliverModal(true)
      return
    }
    
    setUpdating(true)
    try {
      await ordersApi.updateStatus(activeOrder._id, nextAction.to)
      updateActiveOrderStatus(nextAction.to)
      if (nextAction.to === 'DELIVERED') {
        stopLocationTracking()
        setPartnerCoords(null)
        setMapFullscreen(false)
        setShowDeliveredPopup(true)
        setTimeout(() => setActiveOrder(null), 6500)
      } else {
        toast.success(`Status updated to ${nextAction.to.replace(/_/g, ' ')}`)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleForceDeliver = async () => {
    if (!activeOrder) return
    setUpdating(true)
    setShowForceDeliverModal(false)
    try {
      await ordersApi.updateStatus(activeOrder._id, 'DELIVERED')
      updateActiveOrderStatus('DELIVERED')
      stopLocationTracking()
      setPartnerCoords(null)
      setMapFullscreen(false)
      setShowDeliveredPopup(true)
      setTimeout(() => setActiveOrder(null), 6500)
      toast.success('Order marked as delivered')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const customer = activeOrder?.customerId && typeof activeOrder.customerId === 'object'
    ? activeOrder.customerId as { _id: string; name: string; email: string; phone?: string }
    : null

  const isActiveStatus = ['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'].includes(activeOrder?.status ?? '')
  const showMap = isActiveStatus && (destCoords != null || myCoords != null)

  if (loading) {
    return (
      <AppShell allowedRoles={['delivery']}>
        <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>
      </AppShell>
    )
  }

  if (!activeOrder) {
    return (
      <AppShell allowedRoles={['delivery']}>
        <div className="px-6 py-8 max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-2xl font-bold text-white">Active Order</h1>
          </motion.div>
          <div className="flex flex-col items-center justify-center py-24 text-white/20">
            <Truck className="w-12 h-12 mb-3" />
            <p className="text-sm">No active order</p>
            <p className="text-xs mt-1">Accept an order from the available list</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell allowedRoles={['delivery']}>
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-white">Active Order</h1>
          <p className="text-white/30 text-sm mt-0.5">#{activeOrder.orderId ?? String(activeOrder._id).slice(-8).toUpperCase()}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {/* ── GPS permission cards ── */}
          <AnimatePresence>
            {/* Geocoding status debug card */}
            {isActiveStatus && geocodingStatus !== 'idle' && (
              <motion.div
                key="geocoding-status"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={spring}
                className="rounded-2xl p-4 flex items-center gap-3 text-xs"
                style={{ 
                  background: geocodingStatus === 'loading' ? 'rgba(200,255,0,0.05)' : 
                              geocodingStatus === 'success' ? 'rgba(52,211,153,0.05)' : 
                              'rgba(239,68,68,0.05)',
                  border: geocodingStatus === 'loading' ? '1px solid rgba(200,255,0,0.18)' : 
                          geocodingStatus === 'success' ? '1px solid rgba(52,211,153,0.18)' : 
                          '1px solid rgba(239,68,68,0.18)'
                }}
              >
                {geocodingStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--acid)' }} />}
                {geocodingStatus === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                {geocodingStatus === 'error' && <MapPinOff className="w-4 h-4 text-red-400" />}
                <span className="text-white/70">
                  {geocodingStatus === 'loading' && 'Finding destination coordinates...'}
                  {geocodingStatus === 'success' && `Destination found: ${destCoords?.lat.toFixed(6)}, ${destCoords?.lng.toFixed(6)}`}
                  {geocodingStatus === 'error' && 'Could not find destination coordinates'}
                </span>
              </motion.div>
            )}

            {isActiveStatus && geoPermission === 'prompt' && (
              <motion.div
                key="geo-prompt"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={spring}
                className="rounded-2xl p-5 flex items-start gap-4"
                style={{ background: 'rgba(200,255,0,0.05)', border: '1px solid rgba(200,255,0,0.18)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,255,0,0.10)' }}>
                  <LocateFixed className="w-5 h-5" style={{ color: 'var(--acid)' }} />
                </div>
                <div className="flex-1">
                  <p className="text-white/90 text-sm font-semibold mb-0.5">Location access needed</p>
                  <p className="text-white/40 text-xs mb-3">
                    We need your location to show the map and share your position with the customer.
                  </p>
                  <button
                    onClick={() => requestPermissionAndTrack(activeOrder._id)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                    style={{ background: 'var(--acid)', color: '#050505', fontFamily: 'var(--font-head)' }}
                  >
                    Allow Location
                  </button>
                </div>
              </motion.div>
            )}

            {isActiveStatus && geoPermission === 'requesting' && (
              <motion.div
                key="geo-requesting"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={spring}
                className="rounded-2xl p-5 flex items-center gap-4"
                style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.15)' }}
              >
                <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" style={{ color: 'var(--acid)' }} />
                <p className="text-white/60 text-sm">Waiting for location permission…</p>
              </motion.div>
            )}

            {isActiveStatus && geoPermission === 'denied' && (
              <motion.div
                key="geo-denied"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={spring}
                className="rounded-2xl p-5 flex items-start gap-4"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <MapPinOff className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-white/90 text-sm font-semibold mb-0.5">Location access blocked</p>
                  <p className="text-white/40 text-xs">
                    To enable tracking, open your browser settings → Site permissions → Location → Allow for this site.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Map widget ── */}
          <AnimatePresence>
            {showMap && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={spring}
              >
                {/* Fixed-height card — map is clipped inside, click opens fullscreen */}
                <div
                  className="relative rounded-2xl overflow-hidden cursor-pointer group"
                  style={{ height: 200, border: '1px solid rgba(200,255,0,0.25)', position: 'relative', zIndex: 0 }}
                  onClick={() => setMapFullscreen(true)}
                >
                  {/* Map rendered at exact card size — pointer-events off so click bubbles */}
                  <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}>
                    <DeliveryMap
                      key="map-mini"
                      partnerLat={myCoords?.lat}
                      partnerLng={myCoords?.lng}
                      destLat={destCoords?.lat}
                      destLng={destCoords?.lng}
                      className="w-full h-full"
                    />
                  </div>

                  {/* LIVE badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(5,5,5,0.70)', backdropFilter: 'blur(8px)', border: '1px solid rgba(200,255,0,0.3)', zIndex: 10 }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--acid)' }} />
                    <span className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--acid)' }}>LIVE</span>
                    {myAccuracy !== undefined && (
                      <span className={cn('text-[10px] font-medium ml-1',
                        myAccuracy < 20 ? 'text-emerald-400' : myAccuracy < 50 ? 'text-amber-400' : 'text-rose-400',
                      )}>±{Math.round(myAccuracy)}m</span>
                    )}
                  </div>

                  {/* Expand icon */}
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                    style={{ background: 'rgba(5,5,5,0.70)', backdropFilter: 'blur(8px)', border: '1px solid rgba(200,255,0,0.3)', zIndex: 10 }}
                  >
                    <Maximize2 className="w-3.5 h-3.5" style={{ color: 'var(--acid)' }} />
                  </div>

                  {/* Bottom address */}
                  <div className="absolute bottom-0 left-0 right-0 px-4 py-2.5 flex items-center justify-between"
                    style={{ background: 'linear-gradient(to top, rgba(5,5,5,0.80) 0%, transparent 100%)', zIndex: 10 }}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--acid)' }} />
                      <span className="text-white/90 text-xs font-medium truncate max-w-[220px]">
                        {activeOrder.deliveryAddress.line1}
                      </span>
                    </div>
                    <span className="text-white/40 text-[10px]">Tap to expand</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status */}
          <div className="surface-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">Progress</h2>
              <StatusBadge status={activeOrder.status} />
            </div>
            <StatusStepper status={activeOrder.status} statusHistory={activeOrder.statusHistory} />
          </div>

          {/* Customer */}
          {customer && (
            <div className="surface-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-white/30" />
                <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">Customer</h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">{customer.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">{customer.email}</p>
                </div>
                {customer.phone && (
                  <a href={`tel:${customer.phone}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/15 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />{customer.phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Delivery address */}
          <div className="surface-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-white/30" />
              <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">Deliver To</h2>
              {activeOrder.deliveryAddress.lat != null && activeOrder.deliveryAddress.lng != null && (
                <span
                  className="ml-auto px-2 py-0.5 rounded text-[10px] font-semibold"
                  style={{
                    background: 'rgba(200,255,0,0.10)',
                    color: 'var(--acid)',
                    border: '1px solid rgba(200,255,0,0.20)',
                  }}
                >
                  📍 Customer-selected
                </span>
              )}
            </div>
            <p className="text-white/80 text-sm">{activeOrder.deliveryAddress.line1}</p>
            <p className="text-white/50 text-sm">{activeOrder.deliveryAddress.city} — {activeOrder.deliveryAddress.pincode}</p>
            {activeOrder.deliveryAddress.lat != null && activeOrder.deliveryAddress.lng != null && (
              <p className="text-white/30 text-xs mt-2 font-mono">
                {activeOrder.deliveryAddress.lat.toFixed(6)}, {activeOrder.deliveryAddress.lng.toFixed(6)}
              </p>
            )}
          </div>

          {/* Items */}
          <div className="surface-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-white/30" />
              <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider">Items ({activeOrder.items.length})</h2>
            </div>
            <div className="space-y-3">
              {activeOrder.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {(item as any).imageUrl && (
                    <img src={(item as any).imageUrl} alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-white/[0.04]" />
                  )}
                  <div className="flex-1 flex justify-between text-sm">
                    <span className="text-white/70">{item.name} <span className="text-white/30">×{item.quantity}</span></span>
                    <span className="text-white/50">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-white/[0.06] flex justify-between text-sm">
                <span className="text-white/40">Commission (10%)</span>
                <span className="text-emerald-400 font-semibold">
                  ₹{((activeOrder.pricing?.subtotal ?? activeOrder.totalAmount) * 0.10).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action button */}
          {nextAction && (
            <>
              {/* Proximity warning for delivery */}
              {nextAction.to === 'DELIVERED' && !canMarkDelivered && distanceToDestination !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4 flex items-center gap-3 text-xs mb-4"
                  style={{
                    background: 'rgba(251,191,36,0.05)',
                    border: '1px solid rgba(251,191,36,0.18)',
                  }}
                >
                  <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-white/70 font-medium">
                      You're {Math.round(distanceToDestination)}m away from destination
                    </p>
                    <p className="text-white/40 text-[11px] mt-0.5">
                      Get within 50m to mark as delivered, or tap button to override
                    </p>
                  </div>
                </motion.div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleStatusUpdate}
                disabled={updating}
                className="w-full h-12 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'var(--acid)', color: '#050505', fontFamily: 'var(--font-head)' }}
              >
                {updating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : nextAction.to === 'DELIVERED' ? (
                  <><CheckCircle className="w-5 h-5" />{nextAction.label}</>
                ) : (
                  <><Truck className="w-5 h-5" />{nextAction.label}</>
                )}
              </motion.button>
            </>
          )}

          {activeOrder.status === 'DELIVERED' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring}
              className="flex flex-col items-center gap-4 p-8 rounded-2xl text-center"
              style={{ background: 'rgba(200,255,0,0.04)', border: '1px solid rgba(200,255,0,0.12)' }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: 3, duration: 0.5 }}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(200,255,0,0.10)' }}
              >
                <CheckCircle className="w-8 h-8" style={{ color: 'var(--acid)' }} />
              </motion.div>
              <div>
                <p className="font-semibold text-lg" style={{ color: 'var(--acid)', fontFamily: 'var(--font-head)' }}>Delivered!</p>
                <p className="text-white/30 text-sm mt-1">
                  You earned ₹{((activeOrder.pricing?.subtotal ?? activeOrder.totalAmount) * 0.10).toFixed(2)} for this delivery.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ── Fullscreen map modal ── */}
      <AnimatePresence>
        {mapFullscreen && (destCoords != null || myCoords != null) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998]"
          >
            <div className="absolute inset-0">
              <DeliveryMap
                key="map-fullscreen"
                partnerLat={myCoords?.lat}
                partnerLng={myCoords?.lng}
                destLat={destCoords?.lat}
                destLng={destCoords?.lng}
                className="w-full h-full"
                isFullscreen={true}
                onExitFullscreen={() => setMapFullscreen(false)}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, ...spring }}
              className="absolute top-0 left-0 right-0 z-[100] flex items-center justify-between px-4"
              style={{
                paddingTop: 'max(env(safe-area-inset-top), 16px)',
                paddingBottom: 12,
                background: 'linear-gradient(to bottom, rgba(5,5,5,0.85) 0%, transparent 100%)',
              }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMapFullscreen(false)}
                  className="flex items-center gap-1 active:scale-95 transition-transform"
                  style={{ color: 'var(--acid)' }}
                >
                  <ChevronLeft className="w-6 h-6" style={{ color: 'var(--acid)' }} />
                  <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-head)', color: 'var(--acid)' }}>Active Order</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(15,17,23,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(52,211,153,0.3)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 text-xs font-bold tracking-wider">LIVE</span>
                </div>
                {myAccuracy !== undefined && (
                  <span className={cn('text-xs font-medium px-2 py-1 rounded-full',
                    myAccuracy < 20 ? 'text-emerald-400 bg-emerald-400/10' :
                    myAccuracy < 50 ? 'text-amber-400 bg-amber-400/10' :
                    'text-rose-400 bg-rose-400/10',
                  )}>±{Math.round(myAccuracy)}m</span>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ delay: 0.12, ...spring }}
              className="absolute bottom-0 left-0 right-0 z-[100] rounded-t-3xl overflow-hidden"
              style={{
                background: 'rgba(10,10,14,0.82)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderBottom: 'none',
                paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
              }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div className="px-5 pt-2 pb-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-semibold text-sm">Order #{activeOrder.orderId ?? String(activeOrder._id).slice(-8).toUpperCase()}</p>
                    <p className="text-white/40 text-xs mt-0.5">{activeOrder.items.length} items</p>
                  </div>
                  <StatusBadge status={activeOrder.status} />
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl mb-4"
                  style={{ background: 'rgba(200,255,0,0.05)', border: '1px solid rgba(200,255,0,0.12)' }}
                >
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--acid)' }} />
                  <div>
                    <p className="text-white/80 text-sm font-medium">{activeOrder.deliveryAddress.line1}</p>
                    <p className="text-white/40 text-xs">{activeOrder.deliveryAddress.city} — {activeOrder.deliveryAddress.pincode}</p>
                  </div>
                </div>
                {customer && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'rgba(200,255,0,0.10)', color: 'var(--acid)' }}>
                        {customer.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white/80 text-sm font-medium">{customer.name}</p>
                        <p className="text-white/30 text-xs">{customer.email}</p>
                      </div>
                    </div>
                    {customer.phone && (
                      <a href={`tel:${customer.phone}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
                      >
                        <Phone className="w-3 h-3" />{customer.phone}
                      </a>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl mb-4"
                  style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.12)' }}
                >
                  <span className="text-white/50 text-xs">Your commission (10%)</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    ₹{((activeOrder.pricing?.subtotal ?? activeOrder.totalAmount) * 0.10).toFixed(2)}
                  </span>
                </div>
                {nextAction && (
                  <>
                    {/* Proximity warning in fullscreen */}
                    {nextAction.to === 'DELIVERED' && !canMarkDelivered && distanceToDestination !== null && (
                      <div
                        className="px-3 py-2 rounded-xl mb-3 flex items-center gap-2"
                        style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.20)' }}
                      >
                        <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="text-amber-400 text-xs font-medium">
                          {Math.round(distanceToDestination)}m away • Tap to override
                        </span>
                      </div>
                    )}

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleStatusUpdate}
                      disabled={updating}
                      className="w-full h-12 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ background: 'var(--acid)', color: '#050505', fontFamily: 'var(--font-head)' }}
                    >
                      {updating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : nextAction.to === 'DELIVERED' ? (
                        <><CheckCircle className="w-5 h-5" />{nextAction.label}</>
                      ) : (
                        <><Truck className="w-5 h-5" />{nextAction.label}</>
                      )}
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OrderDeliveredPopup
        show={showDeliveredPopup}
        role="delivery"
        commission={(activeOrder.pricing?.subtotal ?? activeOrder.totalAmount) * 0.10}
        onClose={() => {
          setShowDeliveredPopup(false)
          setActiveOrder(null)
        }}
      />

      {/* Force Deliver Confirmation Modal */}
      <AnimatePresence>
        {showForceDeliverModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !updating && setShowForceDeliverModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={spring}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#111', border: '1px solid rgba(247,244,239,0.08)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(251,191,36,0.10)' }}>
                  <MapPin className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold mb-1">Override Location Check?</h2>
                  <p className="text-white/50 text-sm leading-relaxed">
                    You're {distanceToDestination ? Math.round(distanceToDestination) : '?'}m away from the destination. 
                    Only proceed if you've actually delivered the order and GPS isn't updating properly.
                  </p>
                </div>
              </div>

              <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <p className="text-red-400 text-xs font-medium">
                  ⚠️ Warning: Marking as delivered without being at the location may result in disputes and account suspension.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowForceDeliverModal(false)}
                  disabled={updating}
                  className="flex-1 h-11 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: 'rgba(247,244,239,0.04)', color: 'rgba(247,244,239,0.50)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(247,244,239,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(247,244,239,0.04)'
                  }}
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleForceDeliver}
                  disabled={updating}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'var(--acid)', color: '#050505', fontFamily: 'var(--font-head)' }}
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, I\'m at Location'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  )
}
