'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Check, Package, Plus, Minus, Trash2 } from 'lucide-react'
import { useCustomerStore } from '@/store/customer.store'
import { useCartSync } from '@/hooks/use-cart-sync'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  index?: number
}

const spring = { type: 'spring' as const, stiffness: 320, damping: 30 }
const springFast = { type: 'spring' as const, stiffness: 400, damping: 28 }

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addToCart      = useCustomerStore((s) => s.addToCart)
  const removeFromCart = useCustomerStore((s) => s.removeFromCart)
  const updateQuantity = useCustomerStore((s) => s.updateCartQty)
  const cart           = useCustomerStore((s) => s.cart)
  const { broadcastCartAction } = useCartSync()

  const inCart     = cart.find((i) => i.product._id === product._id)
  const qty        = inCart?.quantity ?? 0
  const outOfStock = product.stock === 0
  const atMax      = qty >= product.stock

  const [adding, setAdding] = useState(false)

  const handleAdd = () => {
    if (outOfStock || adding) return
    setAdding(true)
    addToCart(product)
    broadcastCartAction('ADD', product._id, 1)
    setTimeout(() => setAdding(false), 650)
  }

  const handleInc = () => {
    if (!atMax) {
      updateQuantity(product._id, qty + 1)
      broadcastCartAction('UPDATE', product._id, qty + 1)
    }
  }

  const handleDec = () => {
    if (qty > 1) {
      updateQuantity(product._id, qty - 1)
      broadcastCartAction('UPDATE', product._id, qty - 1)
    } else {
      removeFromCart(product._id)
      broadcastCartAction('REMOVE', product._id, 0)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: index * 0.04 }}
      whileHover={{ y: -3 }}
      className="group rounded-2xl overflow-hidden"
      style={{
        background: '#111',
        border: '1px solid rgba(247,244,239,0.06)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.40)',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(247,244,239,0.14)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(247,244,239,0.06)'
      }}
    >
      {/* ── Image ── */}
      <div
        className="relative h-44 overflow-hidden"
        style={{ background: 'rgba(247,244,239,0.02)' }}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package
              className="w-10 h-10"
              style={{ color: 'rgba(247,244,239,0.08)' }}
            />
          </div>
        )}

        {/* Category pill */}
        <div className="absolute top-3 left-3">
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-medium"
            style={{
              background: 'rgba(0,0,0,0.65)',
              color: 'rgba(247,244,239,0.45)',
              border: '1px solid rgba(247,244,239,0.08)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
              backdropFilter: 'blur(4px)',
            }}
          >
            {product.category}
          </span>
        </div>

        {/* Cart qty badge */}
        <AnimatePresence>
          {qty > 0 && (
            <motion.div
              key="badge"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={springFast}
              className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
              style={{
                background: 'var(--acid)',
                color: '#050505',
                fontFamily: 'var(--font-head)',
                boxShadow: '0 0 12px rgba(200,255,0,0.45)',
              }}
            >
              {qty}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Out-of-stock overlay */}
        {outOfStock && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(1px)' }}
          >
            <span
              className="text-xs font-medium"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'rgba(247,244,239,0.38)',
                letterSpacing: '0.1em',
              }}
            >
              OUT OF STOCK
            </span>
          </div>
        )}

        {/* Max qty ribbon */}
        <AnimatePresence>
          {atMax && !outOfStock && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 inset-x-0 py-1 text-center text-[10px] font-medium"
              style={{
                background: 'rgba(255,77,0,0.15)',
                borderTop: '1px solid rgba(255,77,0,0.28)',
                color: '#ff6b3d',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em',
              }}
            >
              Max quantity reached
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Body ── */}
      <div className="p-4">
        <h3
          className="text-sm font-semibold leading-snug mb-1 line-clamp-2"
          style={{
            fontFamily: 'var(--font-head)',
            color: 'rgba(247,244,239,0.92)',
            letterSpacing: '-0.01em',
          }}
        >
          {product.name}
        </h3>

        {product.description && (
          <p
            className="text-xs line-clamp-1 mb-3"
            style={{
              color: 'rgba(247,244,239,0.32)',
              fontFamily: 'var(--font-body)',
              lineHeight: '1.5',
            }}
          >
            {product.description}
          </p>
        )}

        {/* Price row */}
        <div className="flex items-baseline justify-between mb-4">
          <span
            className="font-bold text-base"
            style={{
              fontFamily: 'var(--font-head)',
              color: 'rgba(247,244,239,0.95)',
              letterSpacing: '-0.02em',
            }}
          >
            ₹{product.price.toFixed(2)}
          </span>
          <span
            className="text-xs"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'rgba(247,244,239,0.20)',
              letterSpacing: '0.04em',
            }}
          >
            {product.stock > 0 ? `${product.stock} left` : 'unavailable'}
          </span>
        </div>

        {/* ── CTA ── */}
        <AnimatePresence mode="wait">
          {qty === 0 ? (
            // ── Add to Cart Button ──
            <motion.button
              key="add"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={spring}
              whileHover={
                outOfStock
                  ? {}
                  : { y: -2, boxShadow: '0 8px 28px rgba(200,255,0,0.24)' }
              }
              whileTap={outOfStock ? {} : { scale: 0.97 }}
              onClick={handleAdd}
              disabled={outOfStock}
              className="w-full flex items-center justify-center gap-2 rounded-xl text-[13px] font-bold"
              style={{
                height: '42px',
                fontFamily: 'var(--font-head)',
                letterSpacing: '-0.01em',
                cursor: outOfStock ? 'not-allowed' : 'pointer',
                border: 'none',
                // Transition between idle → success → idle
                background: outOfStock
                  ? 'rgba(247,244,239,0.04)'
                  : adding
                  ? '#1a1a1a'
                  : 'var(--acid)',
                color: outOfStock
                  ? 'rgba(247,244,239,0.18)'
                  : adding
                  ? 'var(--acid)'
                  : '#050505',
                outline: adding ? '1px solid rgba(200,255,0,0.28)' : 'none',
                transition: 'background 0.25s, color 0.25s, outline 0.25s',
              }}
            >
              <AnimatePresence mode="wait">
                {adding ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={springFast}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                    Added!
                  </motion.span>
                ) : (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart
                      className={cn(
                        'w-[15px] h-[15px] transition-transform duration-200',
                        !outOfStock && 'group-hover:rotate-[-8deg] group-hover:scale-110'
                      )}
                    />
                    {outOfStock ? 'Unavailable' : 'Add to cart'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ) : (
            // ── Quantity Stepper ──
            <motion.div
              key="stepper"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={spring}
              className="flex items-center gap-2"
              style={{ height: '42px' }}
            >
              {/* Decrement / Remove */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleDec}
                className="flex items-center justify-center rounded-xl flex-shrink-0 transition-all duration-150"
                style={{
                  width: '42px',
                  height: '42px',
                  border: qty === 1
                    ? '1px solid rgba(255,77,0,0.35)'
                    : '1px solid rgba(247,244,239,0.08)',
                  background: qty === 1
                    ? 'rgba(255,77,0,0.10)'
                    : 'rgba(247,244,239,0.04)',
                  color: qty === 1
                    ? '#ff6b3d'
                    : 'rgba(247,244,239,0.45)',
                  cursor: 'pointer',
                }}
              >
                {qty === 1 ? (
                  <Trash2 className="w-[14px] h-[14px]" strokeWidth={2} />
                ) : (
                  <Minus className="w-[14px] h-[14px]" strokeWidth={2.5} />
                )}
              </motion.button>

              {/* Qty display */}
              <div
                className="flex-1 relative overflow-hidden flex items-center justify-center rounded-xl"
                style={{
                  height: '42px',
                  border: '1px solid rgba(200,255,0,0.25)',
                  background: 'rgba(200,255,0,0.08)',
                }}
              >
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={qty}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.13 }}
                    className="absolute text-sm font-bold"
                    style={{
                      fontFamily: 'var(--font-head)',
                      fontSize: '16px',
                      letterSpacing: '-0.02em',
                      color: 'var(--acid)',
                    }}
                  >
                    {qty}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Increment */}
              <motion.button
                whileTap={atMax ? {} : { scale: 0.88 }}
                onClick={handleInc}
                disabled={atMax}
                className="flex items-center justify-center rounded-xl flex-shrink-0 transition-all duration-150"
                style={{
                  width: '42px',
                  height: '42px',
                  border: atMax
                    ? '1px solid rgba(247,244,239,0.05)'
                    : '1px solid rgba(200,255,0,0.30)',
                  background: atMax
                    ? 'rgba(247,244,239,0.02)'
                    : 'rgba(200,255,0,0.10)',
                  color: atMax
                    ? 'rgba(247,244,239,0.15)'
                    : 'var(--acid)',
                  cursor: atMax ? 'not-allowed' : 'pointer',
                }}
              >
                <Plus className="w-[14px] h-[14px]" strokeWidth={2.5} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}