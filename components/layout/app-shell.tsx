'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WifiOff } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { NavSidebar } from './nav-sidebar'
import { MobileNav } from './mobile-nav'
import { MobileTopBar } from './mobile-top-bar'
import { Spinner } from '@/components/atoms/spinner'
import type { UserRole } from '@/types'

interface AppShellProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function AppShell({ children, allowedRoles }: AppShellProps) {
  const router = useRouter()
  const { user, isAuthenticated, hydrate } = useAuthStore()
  const [ready, setReady] = useState(false)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    hydrate().finally(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready) return
    if (!isAuthenticated) router.push('/login')
  }, [ready, isAuthenticated])

  useEffect(() => {
    const onOffline = () => setOffline(true)
    const onOnline  = () => setOffline(false)
    setOffline(!navigator.onLine)
    window.addEventListener('offline', onOffline)
    window.addEventListener('online',  onOnline)
    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online',  onOnline)
    }
  }, [])

  /* ── Loading screen ─────────────────────────────────────────────────────── */
  if (!ready || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#050505' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #c8ff00, transparent 70%)', filter: 'blur(80px)' }}
          />
        </div>
        <Spinner size="lg" />
      </div>
    )
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    router.push('/login')
    return null
  }

  /* ── Shell ──────────────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen relative"
      style={{
        background: `
          radial-gradient(ellipse 65% 45% at 5% 0%, rgba(200,255,0,0.04) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 95% 100%, rgba(124,58,255,0.03) 0%, transparent 55%),
          #050505
        `,
      }}
    >
      {/* Offline banner */}
      {offline && (
        <div className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 py-2.5
                        bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-xs font-semibold
                        backdrop-blur-sm">
          <WifiOff className="w-3.5 h-3.5" />
          You're offline — showing cached data
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <NavSidebar />
      </div>

      <MobileTopBar />

      <main
        className={`lg:pl-56 pt-12 lg:pt-0 pb-16 lg:pb-0 min-h-screen${offline ? ' mt-8' : ''}`}
      >
        {children}
      </main>

      <MobileNav />
    </div>
  )
}