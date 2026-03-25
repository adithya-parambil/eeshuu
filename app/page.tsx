'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { Spinner } from '@/components/atoms/spinner'

export default function RootPage() {
  const router = useRouter()
  const { user, isAuthenticated, hydrate } = useAuthStore()

  useEffect(() => {
    hydrate().then(() => {
      const u = useAuthStore.getState().user
      if (!u) {
        router.replace('/login')
        return
      }
      const routes: Record<string, string> = {
        customer: '/dashboard',
        delivery: '/delivery/orders',
        admin: '/admin/dashboard',
      }
      router.replace(routes[u.role] ?? '/login')
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}
