'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Search, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { ProductCard } from '@/components/molecules/product-card'
import { CartDrawer } from '@/components/molecules/cart-drawer'
import { SkeletonCard } from '@/components/atoms/skeleton-card'
import { CounterBadge } from '@/components/atoms/counter-badge'
import { useCustomerStore } from '@/store/customer.store'
import { useOrderSocket } from '@/hooks/use-order-socket'
import { productsApi } from '@/lib/api/products'
import { cn } from '@/lib/utils'

const CATEGORIES = ['All', 'Dairy', 'Bakery', 'Fruits', 'Vegetables', 'Meat', 'Seafood', 'Beverages', 'Snacks', 'Pantry', 'Frozen']

/* ── Floating orb background decoration ─────────────────────────────────── */
function BackgroundOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      {/* Acid orb — top left */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.05]"
        style={{
          background: 'radial-gradient(circle, #c8ff00, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      {/* Violet orb — bottom right */}
      <div
        className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, #7c3aff, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      {/* Subtle centre bloom */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-[0.03]"
        style={{
          background: 'radial-gradient(ellipse, #c8ff00, transparent 65%)',
          filter: 'blur(100px)',
        }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(247,244,239,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(247,244,239,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  )
}

/* ── Animated search bar ─────────────────────────────────────────────────── */
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false)

  return (
    <motion.div
      animate={{ scale: focused ? 1.01 : 1 }}
      transition={{ duration: 0.2 }}
      className="relative flex-1"
    >
      {/* Glow ring on focus */}
      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              boxShadow: '0 0 0 1px rgba(200,255,0,0.45), 0 0 20px rgba(200,255,0,0.08)',
            }}
          />
        )}
      </AnimatePresence>

      <Search
        className={cn(
          'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
          focused ? 'text-[#c8ff00]' : 'text-white/25',
        )}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search products…"
        className={cn(
          'w-full h-12 pl-11 pr-4 rounded-2xl text-sm text-white/90 placeholder:text-white/25',
          'outline-none transition-all duration-200',
          /* Glass base */
          'bg-white/[0.04] backdrop-blur-xl',
          'border border-white/[0.09]',
          focused && 'bg-white/[0.07] border-transparent',
        )}
      />
    </motion.div>
  )
}

/* ── Category pill ───────────────────────────────────────────────────────── */
function CategoryPill({
  cat,
  active,
  onClick,
  index,
}: {
  cat: string
  active: boolean
  onClick: () => void
  index: number
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      onClick={onClick}
      className={cn(
        'relative flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 overflow-hidden',
        active
          ? 'text-white'
          : 'text-white/40 hover:text-white/70 border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]',
      )}
    >
      {active && (
        <motion.span
          layoutId="activePill"
          className="absolute inset-0 rounded-full"
          style={{
            background: 'var(--acid)',
            boxShadow: '0 0 16px rgba(200,255,0,0.30)',
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}
      <span className="relative z-10" style={{ color: active ? '#050505' : undefined }}>{cat}</span>
    </motion.button>
  )
}

/* ── Cart button ─────────────────────────────────────────────────────────── */
function CartButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'relative h-11 px-4 gap-2.5 rounded-2xl flex items-center',
        'bg-white/[0.05] hover:bg-white/[0.09]',
        'border border-white/[0.10] hover:border-white/[0.18]',
        'backdrop-blur-xl',
        'text-white/70 hover:text-white',
        'transition-all duration-200',
        'shadow-[0_4px_16px_rgba(0,0,0,0.25)]',
      )}
    >
      <ShoppingCart className="w-4 h-4" />
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-xs font-bold text-white"
        >
          {count}
        </motion.span>
      )}
      <CounterBadge count={count} />
    </motion.button>
  )
}

/* ── Skeleton shimmer ────────────────────────────────────────────────────── */
function GlassSkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06] animate-pulse">
      <div className="aspect-square bg-white/[0.05]" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-white/[0.06] rounded-full w-3/4" />
        <div className="h-3 bg-white/[0.04] rounded-full w-1/2" />
        <div className="h-7 bg-white/[0.06] rounded-xl mt-3" />
      </div>
    </div>
  )
}

/* ── Pagination ──────────────────────────────────────────────────────────── */
function Pagination({
  current,
  total,
  onChange,
}: {
  current: number
  total: number
  onChange: (p: number) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-1.5 mt-10"
    >
      <button
        disabled={current === 1}
        onClick={() => onChange(current - 1)}
        className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/80 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            'w-9 h-9 rounded-xl text-xs font-semibold transition-all duration-200',
            p === current
              ? 'shadow-[0_0_16px_rgba(200,255,0,0.35)]'
              : 'bg-white/[0.04] text-white/35 hover:bg-white/[0.08] hover:text-white/70 border border-white/[0.07]',
          )}
          style={
            p === current
              ? {
                  background: 'var(--acid)',
                  color: '#050505',
                }
              : undefined
          }
        >
          {p}
        </button>
      ))}

      <button
        disabled={current === total}
        onClick={() => onChange(current + 1)}
        className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/80 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  useOrderSocket()
  const { products, productsMeta, productsLoading, setProducts, setProductsLoading, cart } =
    useCustomerStore()
  const [cartOpen, setCartOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(1)

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      const res = await productsApi.list({
        page,
        limit: 12,
        category: category !== 'All' ? category : undefined,
        search: search || undefined,
      })
      setProducts(res.data.data, res.data.meta)
    } catch {
      /* ignore */
    } finally {
      setProductsLoading(false)
    }
  }, [page, category, search])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return (
    <AppShell allowedRoles={['customer']}>
      {/* ── Ambient background ── */}
      <BackgroundOrbs />

      <div className="relative px-5 md:px-8 py-8 max-w-7xl mx-auto">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-10">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Eyebrow label */}
           
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-head)', color: 'rgba(247,244,239,0.95)' }}>
              Shop
            </h1>
            <p className="text-sm mt-1 font-medium" style={{ color: 'rgba(247,244,239,0.30)', fontFamily: 'var(--font-body)' }}>
              {productsMeta
                ? `${productsMeta.total.toLocaleString()} products available`
                : 'Browse products'}
            </p>
          </motion.div>

          <CartButton count={cartCount} onClick={() => setCartOpen(true)} />
        </div>

        {/* ── Search + category strip ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mb-8 space-y-4"
        >
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
          />

          {/* Category pills row */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {CATEGORIES.map((cat, i) => (
              <CategoryPill
                key={cat}
                cat={cat}
                active={category === cat}
                index={i}
                onClick={() => {
                  setCategory(cat)
                  setPage(1)
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Section label ─────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.p
            key={category + search}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs font-semibold uppercase tracking-widest text-white/25 mb-4"
          >
            {search ? `Results for "${search}"` : category === 'All' ? 'All Products' : category}
          </motion.p>
        </AnimatePresence>

        {/* ── Product grid ──────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {productsLoading ? (
            <motion.div
              key="skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <GlassSkeletonCard key={i} />
              ))}
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-28"
            >
              {/* Glass pill container */}
              <div
                className="flex flex-col items-center gap-4 px-10 py-10 rounded-3xl border border-white/[0.07]"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'rgba(200,255,0,0.05)',
                    border: '1px solid rgba(200,255,0,0.12)',
                  }}
                >
                  <Search className="w-7 h-7" style={{ color: 'rgba(200,255,0,0.35)' }} />
                </div>
                <div className="text-center">
                  <p className="text-white/60 font-semibold text-sm">No products found</p>
                  <p className="text-white/25 text-xs mt-1">Try adjusting your search or filters</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              {products.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.3 }}
                >
                  <ProductCard product={p} index={i} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {productsMeta && productsMeta.totalPages > 1 && (
          <Pagination
            current={page}
            total={productsMeta.totalPages}
            onChange={setPage}
          />
        )}
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </AppShell>
  )
}