'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingCart, MapPin, Loader2, Trash2, ChevronRight, ShieldCheck, Zap } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useCustomerStore } from '@/store/customer.store'
import { ordersApi } from '@/lib/api/orders'
import { cn } from '@/lib/utils'
import { AddressPickerMap } from './address-picker-map'
import { useCartSync } from '@/hooks/use-cart-sync'
import { useAuthStore } from '@/store/auth.store'
import type { DeliveryAddressWithCoords } from '@/types'

interface CartDrawerProps { open: boolean; onClose: () => void }
interface AddressForm { 
  line1: string
  city: string
  pincode: string
  lat?: number
  lng?: number
}

const spring = { type: 'spring' as const, stiffness: 320, damping: 32 }

const DELIVERY_FEE = 25
const PLATFORM_FEE = 5
const TAX_RATE     = 0.05



/* ── Tiny reusable qty button ─────────────────────────────────────────────── */
function QtyBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150"
      style={{
        background: 'rgba(247,244,239,0.05)',
        border: '1px solid rgba(247,244,239,0.08)',
        color: 'rgba(247,244,239,0.55)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'rgba(200,255,0,0.10)'
        el.style.borderColor = 'rgba(200,255,0,0.25)'
        el.style.color = 'var(--acid)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'rgba(247,244,239,0.05)'
        el.style.borderColor = 'rgba(247,244,239,0.08)'
        el.style.color = 'rgba(247,244,239,0.55)'
      }}
    >
      {children}
    </motion.button>
  )
}

/* ── Cart item row ────────────────────────────────────────────────────────── */
function CartItem({
  item,
  onInc,
  onDec,
  onRemove,
}: {
  item: any
  onInc: () => void
  onDec: () => void
  onRemove: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.22 }}
      className="group flex items-center gap-3 p-3.5 rounded-2xl"
      style={{
        background: 'rgba(247,244,239,0.02)',
        border: '1px solid rgba(247,244,239,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
      }}
    >
      {/* Product image placeholder / category letter */}
      <div
        className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-lg font-bold"
        style={{
          background: 'rgba(200,255,0,0.08)',
          border: '1px solid rgba(200,255,0,0.15)',
          color: 'var(--acid)',
          fontFamily: 'var(--font-head)',
        }}
      >
        {item.product.name[0]}
      </div>

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ fontFamily: 'var(--font-head)', color: 'rgba(247,244,239,0.90)' }}>
          {item.product.name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(247,244,239,0.35)', fontFamily: 'var(--font-mono)' }}>
          ₹{item.product.price.toFixed(2)} each
        </p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <QtyBtn onClick={onDec}><Minus className="w-3 h-3" /></QtyBtn>
        <span
          className="text-sm font-bold w-6 text-center tabular-nums"
          style={{ color: 'rgba(210,220,255,0.90)' }}
        >
          {item.quantity}
        </span>
        <QtyBtn onClick={onInc}><Plus className="w-3 h-3" /></QtyBtn>
      </div>

      {/* Line total */}
      <div className="text-right shrink-0 min-w-[56px]">
        <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-head)', color: 'rgba(247,244,239,0.85)' }}>
          ₹{(item.product.price * item.quantity).toFixed(2)}
        </span>
      </div>

      {/* Remove — visible on hover */}
      <motion.button
        initial={{ opacity: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1.5 rounded-lg"
        style={{ color: 'rgba(239,68,68,0.55)' }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#f87171')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.55)')}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </motion.button>
    </motion.div>
  )
}

/* ── Price row ────────────────────────────────────────────────────────────── */
function PriceRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span
        className="text-xs font-medium"
        style={{
          color: highlight ? 'rgba(247,244,239,0.80)' : 'rgba(247,244,239,0.40)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
      <span
        className={highlight ? 'text-sm font-bold' : 'text-xs font-semibold'}
        style={{
          color: highlight ? 'var(--acid)' : 'rgba(247,244,239,0.55)',
          fontFamily: highlight ? 'var(--font-head)' : 'var(--font-mono)',
        }}
      >
        {value}
      </span>
    </div>
  )
}

/* ── Address input ────────────────────────────────────────────────────────── */
function AddressInput({ label, error, ...props }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <div
        className="relative rounded-xl transition-all duration-200"
        style={{
          boxShadow: focused
            ? '0 0 0 1px rgba(200,255,0,0.45), 0 0 16px rgba(200,255,0,0.08)'
            : error
            ? '0 0 0 1px rgba(255,77,0,0.45)'
            : 'none',
        }}
      >
        <input
          {...props}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={label}
          className="w-full h-12 px-4 rounded-xl text-sm outline-none transition-all duration-200"
          style={{
            background: 'rgba(247,244,239,0.04)',
            border: `1px solid ${focused ? 'transparent' : error ? 'rgba(255,77,0,0.40)' : 'rgba(247,244,239,0.08)'}`,
            color: 'rgba(247,244,239,0.90)',
            fontFamily: 'var(--font-body)',
          }}
        />
      </div>
      {error && (
        <p
          className="mt-1.5 text-[11px] font-medium pl-1"
          style={{ color: '#ff6b3d', fontFamily: 'var(--font-mono)' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { cart, updateCartQty, clearCart, prependOrder } = useCustomerStore()
  const { broadcastCartAction } = useCartSync()
  const user = useAuthStore((s) => s.user)
  const [placing, setPlacing] = useState(false)
  const [step, setStep] = useState<'cart' | 'address'>('cart')
  const [addressData, setAddressData] = useState<AddressForm | null>(null)
  const idempotencyKeyRef = useRef<string | null>(null)

  const { register, handleSubmit, formState: { errors }, setValue, getValues } = useForm<AddressForm>()

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const tax      = parseFloat((subtotal * TAX_RATE).toFixed(2))
  const total    = parseFloat((subtotal + tax + DELIVERY_FEE + PLATFORM_FEE).toFixed(2))

  const handleAddressSelect = (address: DeliveryAddressWithCoords) => {
    // Update form values
    setValue('line1', address.line1)
    setValue('city', address.city)
    setValue('pincode', address.pincode)
    setValue('lat', address.lat)
    setValue('lng', address.lng)
    
    // Store address data
    setAddressData({
      line1: address.line1,
      city: address.city,
      pincode: address.pincode,
      lat: address.lat,
      lng: address.lng,
    })

    // Proceed to payment
    placeOrder({
      line1: address.line1,
      city: address.city,
      pincode: address.pincode,
      lat: address.lat,
      lng: address.lng,
    })
  }

  const placeOrder = async (address: AddressForm) => {
    if (placing) return
    if (!user || user.role !== 'customer') {
      toast.error('Only customers can place orders')
      return
    }
    setPlacing(true)
    try {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`
      }

      const orderRes = await ordersApi.placeWithRetry({
        items: cart.map((i) => ({ productId: i.product._id, quantity: i.quantity })),
        deliveryAddress: address,
      }, idempotencyKeyRef.current!)

      prependOrder(orderRes.data.data)
      clearCart(); onClose(); setStep('cart')
      idempotencyKeyRef.current = null
      toast.success('Order placed successfully')
    } catch (err: any) {
      const msg = err?.response?.data?.message
      const code = err?.response?.data?.code
      if (code === 'FORBIDDEN' && typeof msg === 'string' && msg.includes("Role 'delivery'")) {
        toast.error('You are logged in as a delivery partner', {
          description: 'Log out and sign in as a customer to place orders',
        })
      } else {
        toast.error(msg ?? 'Order placement failed')
      }
    }
    finally { setPlacing(false) }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ─────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(8,12,30,0.75)', backdropFilter: 'blur(6px)' }}
          />

          {/* ── Drawer panel ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={spring}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col"
            style={{
              background: '#111',
              borderLeft: '1px solid rgba(247,244,239,0.08)',
              boxShadow: '-16px 0 64px rgba(0,0,0,0.70)',
            }}
          >
            {/* Ambient top glow */}
            <div
              className="absolute top-0 left-0 right-0 h-56 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 110% 55% at 50% 0%, rgba(200,255,0,0.06), transparent 70%)',
              }}
            />

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div
              className="relative flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: '1px solid rgba(247,244,239,0.06)' }}
            >
              {/* Step breadcrumb */}
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(200,255,0,0.10)',
                    border: '1px solid rgba(200,255,0,0.20)',
                  }}
                >
                  {step === 'cart'
                    ? <ShoppingCart className="w-4 h-4" style={{ color: 'var(--acid)' }} />
                    : <MapPin       className="w-4 h-4" style={{ color: 'var(--acid)' }} />
                  }
                </div>
                <div>
                  <h2
                    className="text-sm font-bold"
                    style={{ fontFamily: 'var(--font-head)', color: 'rgba(247,244,239,0.92)' }}
                  >
                    {step === 'cart' ? 'My Cart' : 'Delivery Address'}
                  </h2>
                  {step === 'cart' && cart.length > 0 && (
                    <p className="text-[11px]" style={{ color: 'rgba(247,244,239,0.40)', fontFamily: 'var(--font-mono)' }}>
                      {cart.length} item{cart.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Step indicator pills */}
              <div className="flex items-center gap-1.5 mr-10">
                {(['cart', 'address'] as const).map((s) => (
                  <div
                    key={s}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: step === s ? '20px' : '6px',
                      background: step === s ? 'var(--acid)' : 'rgba(247,244,239,0.15)',
                    }}
                  />
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
                style={{
                  background: 'rgba(247,244,239,0.05)',
                  border: '1px solid rgba(247,244,239,0.08)',
                  color: 'rgba(247,244,239,0.45)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(255,77,0,0.10)'
                  el.style.borderColor = 'rgba(255,77,0,0.25)'
                  el.style.color = '#ff6b3d'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(247,244,239,0.05)'
                  el.style.borderColor = 'rgba(247,244,239,0.08)'
                  el.style.color = 'rgba(247,244,239,0.45)'
                }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* ── Scrollable content ──────────────────────────────────────── */}
            <div className="relative flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {step === 'cart' ? (
                  <motion.div
                    key="cart"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 space-y-2.5"
                  >
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div
                          className="w-20 h-20 rounded-3xl flex items-center justify-center"
                          style={{
                            background: 'rgba(200,255,0,0.06)',
                            border: '1px solid rgba(200,255,0,0.12)',
                          }}
                        >
                          <ShoppingCart className="w-9 h-9" style={{ color: 'rgba(200,255,0,0.35)' }} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold" style={{ color: 'rgba(247,244,239,0.45)', fontFamily: 'var(--font-head)' }}>
                            Your cart is empty
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'rgba(247,244,239,0.25)', fontFamily: 'var(--font-mono)' }}>
                            Add some products to get started
                          </p>
                        </div>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {cart.map((item) => (
                          <CartItem
                            key={item.product._id}
                            item={item}
                            onInc={() => {
                              updateCartQty(item.product._id, item.quantity + 1)
                              broadcastCartAction('UPDATE', item.product._id, item.quantity + 1)
                            }}
                            onDec={() => {
                              updateCartQty(item.product._id, item.quantity - 1)
                              broadcastCartAction('UPDATE', item.product._id, item.quantity - 1)
                            }}
                            onRemove={() => {
                              updateCartQty(item.product._id, 0)
                              broadcastCartAction('REMOVE', item.product._id, 0)
                            }}
                          />
                        ))}
                      </AnimatePresence>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="address"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="p-4"
                  >
                    {/* Info banner */}
                    <div
                      className="flex items-start gap-3 p-3.5 rounded-2xl mb-5"
                      style={{
                        background: 'rgba(200,255,0,0.05)',
                        border: '1px solid rgba(200,255,0,0.12)',
                      }}
                    >
                      <Zap className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--acid)' }} />
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(247,244,239,0.55)', fontFamily: 'var(--font-body)' }}>
                        Your order will be dispatched within{' '}
                        <span style={{ color: 'var(--acid)', fontWeight: 600 }}>30 minutes</span> of placement.
                      </p>
                    </div>

                    <AddressPickerMap
                      onAddressSelect={handleAddressSelect}
                      initialAddress={addressData || undefined}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            {cart.length > 0 && (
              <div
                className="relative shrink-0 px-4 py-4 space-y-4"
                style={{ borderTop: '1px solid rgba(247,244,239,0.06)' }}
              >
                {/* Price breakdown card */}
                <div
                  className="rounded-2xl p-4 space-y-2.5"
                  style={{
                    background: 'rgba(247,244,239,0.02)',
                    border: '1px solid rgba(247,244,239,0.06)',
                  }}
                >
                  <PriceRow label="Subtotal"      value={`₹${subtotal.toFixed(2)}`}  />
                  <PriceRow label="GST (5%)"      value={`₹${tax.toFixed(2)}`}       />
                  <PriceRow label="Delivery fee"  value={`₹${DELIVERY_FEE.toFixed(2)}`} />
                  <PriceRow label="Platform fee"  value={`₹${PLATFORM_FEE.toFixed(2)}`} />

                  {/* Divider */}
                  <div
                    className="h-px"
                    style={{
                      background: 'linear-gradient(to right,transparent,rgba(247,244,239,0.10) 30%,rgba(247,244,239,0.10) 70%,transparent)',
                    }}
                  />
                  <PriceRow label="Total" value={`₹${total.toFixed(2)}`} highlight />
                </div>

                {/* Trust badge */}
                

                {/* CTA button(s) */}
                {step === 'cart' ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStep('address')}
                    className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-150"
                    style={{
                      background: 'var(--acid)',
                      color: '#050505',
                      fontFamily: 'var(--font-head)',
                      boxShadow: '0 0 24px rgba(200,255,0,0.20), 0 4px 12px rgba(0,0,0,0.30)',
                      border: '1px solid rgba(200,255,0,0.40)',
                    }}
                  >
                    Continue to checkout
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStep('cart')}
                    disabled={placing}
                    className="w-full h-12 rounded-2xl text-sm font-semibold transition-all duration-150 disabled:opacity-40"
                    style={{
                      background: 'rgba(247,244,239,0.05)',
                      border: '1px solid rgba(247,244,239,0.10)',
                      color: 'rgba(247,244,239,0.60)',
                      fontFamily: 'var(--font-head)',
                    }}
                  >
                    ← Back to Cart
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
