'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingBag, Package, Truck, BarChart3, Users, Wallet, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/types'

const NAV_ITEMS: Record<UserRole, { href: string; label: string; icon: React.ElementType }[]> = {
  customer: [
    { href: '/dashboard', label: 'Shop',   icon: LayoutDashboard },
    { href: '/orders',    label: 'Orders', icon: ShoppingBag     },
  ],
  delivery: [
    { href: '/delivery/orders',   label: 'Available', icon: Package   },
    { href: '/delivery/active',   label: 'Active',    icon: Truck     },
    { href: '/wallet',            label: 'Wallet',    icon: Wallet    },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3  },
    { href: '/admin/orders',    label: 'Orders',    icon: Package    },
    { href: '/admin/users',     label: 'Users',     icon: Users      },
    { href: '/admin/disputes',  label: 'Disputes',  icon: AlertCircle },
  ],
}

export function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  if (!user) return null

  const items = NAV_ITEMS[user.role] ?? []

  return (
    <nav
      className="mobile-nav fixed bottom-0 left-0 right-0 border-t z-40 lg:hidden"
      style={{ background: 'rgba(5,5,5,0.95)', borderColor: 'rgba(247,244,239,0.06)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div
                className="flex flex-col items-center gap-1 py-3 transition-colors"
                style={{ color: active ? 'var(--acid)' : 'rgba(247,244,239,0.30)' }}
              >
                <item.icon className="w-5 h-5" />
                <span
                  className="text-[9px] uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
