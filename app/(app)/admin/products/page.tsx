'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, X, Loader2, Search, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { productsApi } from '@/lib/api/products'
import { toast } from 'sonner'
import type { Product, ApiMeta } from '@/types'

const spring = { type: 'spring' as const, stiffness: 280, damping: 28 }

const CATEGORIES = ['Dairy', 'Bakery', 'Fruits', 'Vegetables', 'Meat', 'Seafood', 'Beverages', 'Snacks', 'Pantry', 'Frozen']

// ── Form modal (create / edit) ────────────────────────────────────────────────

interface FormState {
  name: string; description: string; price: string
  category: string; stock: string; imageUrl: string; isActive: boolean
}

const EMPTY_FORM: FormState = {
  name: '', description: '', price: '', category: 'Dairy',
  stock: '', imageUrl: '', isActive: true,
}

function ProductFormModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null
  onClose: () => void
  onSaved: (p: Product) => void
}) {
  const isEdit = product !== null
  const [form, setForm] = useState<FormState>(
    isEdit
      ? {
          name: product.name,
          description: product.description ?? '',
          price: String(product.price),
          category: product.category,
          stock: String(product.stock),
          imageUrl: product.imageUrl ?? '',
          isActive: product.isActive,
        }
      : EMPTY_FORM,
  )
  const [saving, setSaving] = useState(false)

  const set = (k: keyof FormState, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    const price = parseFloat(form.price)
    const stock = parseInt(form.stock, 10)
    if (isNaN(price) || price < 0) { toast.error('Enter a valid price'); return }
    if (isNaN(stock) || stock < 0) { toast.error('Enter a valid stock'); return }

    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price,
        category: form.category,
        stock,
        imageUrl: form.imageUrl.trim() || undefined,
        isActive: form.isActive,
      }
      const res = isEdit
        ? await productsApi.update(product._id, body)
        : await productsApi.create(body)
      toast.success(isEdit ? 'Product updated' : 'Product created')
      onSaved(res.data.data)
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={spring}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-white font-semibold">{isEdit ? 'Edit Product' : 'Add Product'}</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Name */}
          <Field label="Product Name">
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Fresh Milk (1L)" className={inputCls} />
          </Field>

          {/* Description */}
          <Field label="Description (optional)">
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Short description…" className={`${inputCls} resize-none`} />
          </Field>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)">
              <input type="number" min={0} value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Stock">
              <input type="number" min={0} value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="0" className={inputCls} />
            </Field>
          </div>

          {/* Category */}
          <Field label="Category">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          {/* Image URL */}
          <Field label="Image URL (optional)">
            <input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://…" className={inputCls} />
          </Field>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-white/60 text-sm">Active (visible to customers)</span>
            <button
              onClick={() => set('isActive', !form.isActive)}
              className="relative w-10 h-5 rounded-full transition-colors duration-200"
              style={{ background: form.isActive ? 'var(--acid)' : 'rgba(255,255,255,0.1)' }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full shadow transition-all duration-200"
                style={{ left: form.isActive ? '22px' : '2px', background: form.isActive ? '#050505' : '#fff' }}
              />
            </button>
          </div>

          {/* Save */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
            style={{ background: 'var(--acid)', color: '#050505', fontFamily: 'var(--font-head)' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save Changes' : 'Create Product'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteModal({ product, onClose, onDeleted }: { product: Product; onClose: () => void; onDeleted: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await productsApi.delete(product._id)
      toast.success('Product deleted')
      onDeleted(product._id)
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={spring}
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-red-400" />
        </div>
        <p className="text-white font-semibold text-center mb-1">Delete Product?</p>
        <p className="text-white/40 text-sm text-center mb-6">"{product.name}" will be permanently removed.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-sm font-medium text-white/50 transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 h-10 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: 'rgba(239,68,68,0.8)' }}
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls = 'w-full h-10 px-3 rounded-xl text-sm text-white/80 outline-none transition-all bg-white/[0.04] border border-white/[0.08] focus:border-[rgba(200,255,0,0.35)] placeholder:text-white/20'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-1.5">{label}</p>
      {children}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [meta, setMeta] = useState<ApiMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editTarget, setEditTarget] = useState<Product | null | 'new'>('new' as any)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchProducts = useCallback(() => {
    setLoading(true)
    productsApi.list({ page, limit: 12, search: search || undefined })
      .then((r) => { setProducts(r.data.data); setMeta(r.data.meta) })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const openCreate = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (p: Product) => { setEditTarget(p); setModalOpen(true) }

  const handleSaved = (saved: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p._id === saved._id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [saved, ...prev]
    })
    if (meta) setMeta({ ...meta, total: meta.total + (products.find(p => p._id === saved._id) ? 0 : 1) })
  }

  const handleDeleted = (id: string) => {
    setProducts((prev) => prev.filter((p) => p._id !== id))
    if (meta) setMeta({ ...meta, total: meta.total - 1 })
  }

  const totalPages = meta?.totalPages ?? 1

  return (
    <AppShell allowedRoles={['admin']}>
      <div className="px-6 py-8 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Products</h1>
            <p className="text-white/30 text-sm mt-0.5">
              {meta ? `${meta.total} products total` : 'Manage your product catalogue'}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium transition-colors"
            style={{ background: 'var(--acid)', border: '1px solid rgba(200,255,0,0.40)', color: '#050505', fontFamily: 'var(--font-head)' }}
          >
            <Plus className="w-4 h-4" />
            Add Product
          </motion.button>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search products…"
            className="w-full h-11 pl-11 pr-4 rounded-xl text-sm text-white/80 outline-none bg-white/[0.03] border border-white/[0.07] focus:border-[rgba(200,255,0,0.35)] placeholder:text-white/20 transition-all"
          />
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/20">
            <Package className="w-12 h-12 mb-3" />
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: i * 0.03 }}
                className="rounded-2xl overflow-hidden group"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Image */}
                <div className="relative h-36 bg-white/[0.02] overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-white/10" />
                    </div>
                  )}
                  {/* inactive badge */}
                  {!p.isActive && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white/50 text-xs font-medium">Inactive</span>
                    </div>
                  )}
                  {/* action buttons */}
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(p)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors"
                      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/70 hover:text-red-400 transition-colors"
                      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-white/85 text-xs font-semibold truncate">{p.name}</p>
                  <p className="text-white/30 text-[10px] mt-0.5">{p.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-white font-bold text-sm">₹{p.price}</span>
                    <span className="text-white/30 text-[10px]">{p.stock} in stock</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-1.5 mt-8">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-9 h-9 rounded-xl text-xs font-semibold transition-all"
                style={
                  p === page
                    ? { background: 'var(--acid)', color: '#050505', border: '1px solid rgba(200,255,0,0.40)' }
                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.07)' }
                }
              >
                {p}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <ProductFormModal
            product={editTarget as Product | null}
            onClose={() => setModalOpen(false)}
            onSaved={handleSaved}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            product={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDeleted={handleDeleted}
          />
        )}
      </AnimatePresence>
    </AppShell>
  )
}
