'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

export function MobileTopBar() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  const handleLogout = async () => {
    setOpen(false)
    await logout()
    router.push('/login')
  }

  return (
    <header
      className="mobile-top-bar fixed top-0 left-0 right-0 h-12 backdrop-blur-sm border-b z-40 lg:hidden flex items-center justify-between px-4"
      style={{ background: 'rgba(5,5,5,0.92)', borderColor: 'rgba(247,244,239,0.06)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: 'var(--acid)', boxShadow: '0 0 6px rgba(200,255,0,0.6)' }}
        />
        <span
          className="text-sm font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-head)', color: 'rgba(247,244,239,0.92)' }}
        >
          Eeshuu<span style={{ color: 'var(--acid)' }}>.</span>
        </span>
      </div>

      {/* Profile button */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-opacity"
          style={{
            background: 'rgba(200,255,0,0.15)',
            color: 'var(--acid)',
            border: '1px solid rgba(200,255,0,0.25)',
            fontFamily: 'var(--font-head)',
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute right-0 top-10 w-52 rounded-xl shadow-xl overflow-hidden"
              style={{ background: '#111', border: '1px solid rgba(247,244,239,0.08)' }}
            >
              {/* User info */}
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(247,244,239,0.06)' }}>
                <p
                  className="text-sm font-semibold truncate"
                  style={{ fontFamily: 'var(--font-head)', color: 'rgba(247,244,239,0.90)' }}
                >
                  {user.name}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(247,244,239,0.35)', fontFamily: 'var(--font-mono)' }}>
                  {user.email}
                </p>
                <span
                  className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize"
                  style={{
                    background: 'rgba(200,255,0,0.10)',
                    color: 'var(--acid)',
                    border: '1px solid rgba(200,255,0,0.20)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {user.role}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                style={{ color: 'rgba(247,244,239,0.40)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.06em' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(255,77,0,0.08)'
                  el.style.color = '#ff6b3d'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'transparent'
                  el.style.color = 'rgba(247,244,239,0.40)'
                }}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
