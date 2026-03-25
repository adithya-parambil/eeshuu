'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, ShoppingBag, Package, Truck, BarChart3,
  LogOut, Users, ChevronRight, Wallet, History, AlertCircle, ShoppingBasket,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/types'

const NAV_ITEMS: Record<UserRole, { href: string; label: string; icon: React.ElementType }[]> = {
  customer: [
    { href: '/dashboard', label: 'Shop',      icon: LayoutDashboard },
    { href: '/orders',    label: 'My Orders', icon: ShoppingBag     },
    { href: '/disputes',  label: 'Disputes',  icon: AlertCircle     },
  ],
  delivery: [
    { href: '/delivery/orders',   label: 'Available',    icon: Package   },
    { href: '/delivery/active',   label: 'Active Order', icon: Truck     },
    { href: '/delivery/history',  label: 'History',      icon: History   },
    { href: '/wallet',            label: 'Wallet',       icon: Wallet    },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3      },
    { href: '/admin/orders',    label: 'Orders',    icon: Package        },
    { href: '/admin/products',  label: 'Products',  icon: ShoppingBasket },
    { href: '/admin/users',     label: 'Users',     icon: Users          },
    { href: '/admin/disputes',  label: 'Disputes',  icon: AlertCircle    },
  ],
}

export function NavSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, logout } = useAuthStore()
  if (!user) return null

  const items = NAV_ITEMS[user.role] ?? []

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full w-56 flex flex-col z-40"
      style={{
        background: '#111111',
        borderRight: '1px solid rgba(247,244,239,0.06)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.50)',
      }}
    >
      {/* Ambient top glow */}
      <div
        className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 120% 60% at 50% 0%, rgba(200,255,0,0.06), transparent 70%)',
        }}
      />

      {/* Grid bg overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(247,244,239,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(247,244,239,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Logo / brand */}
      <div
        className="relative flex items-center gap-2.5 px-5 py-[18px] shrink-0"
        style={{ borderBottom: '1px solid rgba(247,244,239,0.06)' }}
      >
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: 'var(--acid)', boxShadow: '0 0 8px rgba(200,255,0,0.6)' }}
        />
        <span
          className="font-bold text-sm tracking-tight"
          style={{ fontFamily: 'var(--font-head)', color: 'rgba(247,244,239,0.92)' }}
        >
          Eeshuu<span style={{ color: 'var(--acid)' }}>.</span>
        </span>
      </div>

      {/* Navigation links */}
      <nav className="relative flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: active ? 0 : 3 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors group cursor-pointer"
                style={
                  active
                    ? {
                        background: 'rgba(200,255,0,0.10)',
                        color: 'var(--acid)',
                        boxShadow: 'inset 3px 0 0 var(--acid)',
                      }
                    : { color: 'rgba(247,244,239,0.40)' }
                }
                onMouseEnter={(e) => {
                  if (!active) {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'rgba(247,244,239,0.05)'
                    el.style.color = 'rgba(247,244,239,0.75)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'transparent'
                    el.style.color = 'rgba(247,244,239,0.40)'
                  }
                }}
              >
                <item.icon
                  className="w-4 h-4 flex-shrink-0 transition-colors"
                  style={{ color: active ? 'var(--acid)' : 'rgba(247,244,239,0.25)' }}
                />
                <span
                  className="flex-1 text-xs tracking-wide uppercase"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
                >
                  {item.label}
                </span>
                {active && (
                  <ChevronRight
                    className="w-3 h-3 opacity-60"
                    style={{ color: 'var(--acid)' }}
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div
        className="relative px-2.5 py-3 shrink-0 space-y-0.5"
        style={{ borderTop: '1px solid rgba(247,244,239,0.06)' }}
      >
        {/* User info row */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(247,244,239,0.03)' }}
        >
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: 'rgba(200,255,0,0.15)',
              color: 'var(--acid)',
              border: '1px solid rgba(200,255,0,0.25)',
              fontFamily: 'var(--font-head)',
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-semibold truncate"
              style={{ fontFamily: 'var(--font-head)', color: 'rgba(247,244,239,0.85)' }}
            >
              {user.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--acid)', boxShadow: '0 0 4px rgba(200,255,0,0.6)' }}
              />
              <p
                className="text-[10px] capitalize"
                style={{ fontFamily: 'var(--font-mono)', color: 'rgba(247,244,239,0.35)', letterSpacing: '0.06em' }}
              >
                {user.role}
              </p>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ color: 'rgba(247,244,239,0.35)', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,77,0,0.08)'
            el.style.color = '#ff6b3d'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'transparent'
            el.style.color = 'rgba(247,244,239,0.35)'
          }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
