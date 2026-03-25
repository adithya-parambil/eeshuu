'use client'
import { useState, useEffect, useRef, forwardRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Package } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { Spinner } from '@/components/atoms/spinner'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Needs uppercase')
    .regex(/[0-9]/, 'Needs number')
    .regex(/[^A-Za-z0-9]/, 'Needs special char'),
  role: z.enum(['customer', 'delivery']),
  phone: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const spring = { type: 'spring' as const, stiffness: 280, damping: 28 }

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser, isLoading } = useAuthStore()
  const [showPass, setShowPass] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [taglineIndex, setTaglineIndex] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'customer' },
  })

  const role = watch('role')

  // 3D card tilt
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 20 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 20 })

  const taglines = [
    'Deliver faster.',
    'Track smarter.',
    'Scale endlessly.',
  ]

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleCardMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data)
      const user = useAuthStore.getState().user
      if (!user) return
      const routes: Record<string, string> = { customer: '/dashboard', delivery: '/delivery/orders', admin: '/admin/dashboard' }
      router.push(routes[user.role] ?? '/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Registration failed')
    }
  }

  const getSpotlightPosition = () => {
    if (!cardRef.current) return { x: 0, y: 0 }
    const rect = cardRef.current.getBoundingClientRect()
    return {
      x: mousePos.x - rect.left - 150,
      y: mousePos.y - rect.top - 150,
    }
  }

  const spotPos = getSpotlightPosition()

  return (
    <div className="min-h-screen flex bg-[#040406] relative overflow-hidden">
      {/* Animated orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #c8ff00 0%, transparent 70%)', top: -200, left: -100 }}
          animate={{ x: [0, 60, -30, 0], y: [0, 40, 60, 0], scale: [1, 1.05, 0.95, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #7c3aff 0%, transparent 70%)', bottom: -100, right: -100 }}
          animate={{ x: [0, -40], y: [0, -60], scale: [1, 1.08, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full blur-[120px] opacity-[0.04] top-1/2 left-1/2"
          style={{ background: 'radial-gradient(circle, #c8ff00 0%, transparent 70%)', transform: 'translate(-50%, -50%)' }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Noise texture */}
      <div className="fixed inset-0 opacity-[0.04] pointer-events-none z-[1]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '256px',
      }} />

      {/* Scan line */}
      <motion.div
        className="fixed left-0 right-0 h-[1px] pointer-events-none z-[4] opacity-20"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(200,255,0,0.4), transparent)' }}
        animate={{ top: ['-5px', '100vh'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 relative z-10">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shadow-[0_0_24px_rgba(200,255,0,0.25)] relative overflow-hidden" style={{ background: 'var(--acid)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <Package className="w-[18px] h-[18px] relative z-10" style={{ color: '#050505' }} strokeWidth={2.5} />
              <motion.div
                className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-[1px]"
                style={{ background: 'rgba(5,5,5,0.6)' }}
                animate={{ x: [0, 4, 0], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <span className="text-white text-[15px] font-semibold tracking-tight" style={{ fontFamily: 'var(--font-head)' }}>Eeshuu</span>
          </div>

          <div className="h-[72px] overflow-hidden">
            <motion.h1
              key={taglineIndex}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-[52px] font-light italic leading-[1.12] tracking-[-2px] text-white font-[family-name:var(--font-playfair)]"
            >
              {taglines[taglineIndex]}
            </motion.h1>
          </div>
          <p className="text-white/40 text-sm font-light tracking-[0.5px] font-mono mt-4">// quick commerce reimagined</p>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10 py-12">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.25 }}
          className="w-full max-w-md"
        >
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--acid)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <Package className="w-3.5 h-3.5 relative z-10" style={{ color: '#050505' }} />
            </div>
            <span className="text-white font-semibold" style={{ fontFamily: 'var(--font-head)' }}>Eeshuu</span>
          </div>

          <motion.div
            ref={cardRef}
            className="relative rounded-[24px] p-9 overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.032)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(40px) saturate(1.5)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
            }}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
          >
            {/* Corner decorations */}
            <div className="absolute top-4 left-4 w-5 h-5 border-t border-l border-[rgba(200,255,0,0.25)] pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-5 h-5 border-b border-r border-[rgba(200,255,0,0.25)] pointer-events-none" />

            {/* Spotlight effect */}
            <motion.div
              className="absolute w-[300px] h-[300px] rounded-full pointer-events-none opacity-100 mix-blend-screen"
              style={{
                background: 'radial-gradient(circle, rgba(200,255,0,0.08), transparent 70%)',
                left: spotPos.x,
                top: spotPos.y,
              }}
              transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 rounded-[24px] pointer-events-none" style={{
              background: 'linear-gradient(135deg, rgba(200,255,0,0.04) 0%, transparent 50%, rgba(124,58,255,0.03) 100%)',
              transform: 'translateZ(20px)',
            }} />
            <div className="absolute top-0 left-0 right-0 h-[1px] rounded-t-[24px] pointer-events-none" style={{
              background: 'linear-gradient(90deg, transparent, rgba(200,255,0,0.15), transparent)',
              transform: 'translateZ(20px)',
            }} />

            <div className="relative z-10">
              <h2 className="text-[22px] font-medium tracking-[-0.8px] text-white mb-1.5">Create account</h2>
              <p className="text-white/40 text-[13px] font-light mb-7">Join the network — fill in your details</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                {/* Role selector */}
                <div className="grid grid-cols-2 gap-1 p-1 rounded-[14px] border" style={{ background: 'rgba(247,244,239,0.025)', borderColor: 'rgba(247,244,239,0.08)' }}>
                  {(['customer', 'delivery'] as const).map((r) => (
                    <label
                      key={r}
                      className={cn(
                        'flex items-center justify-center py-2.5 rounded-[10px] cursor-pointer transition-all text-xs font-medium tracking-[0.3px]',
                        role === r
                          ? 'shadow-[0_4px_16px_rgba(200,255,0,0.25)]'
                          : 'text-white/40 hover:text-white/60',
                      )}
                      style={role === r ? { background: 'var(--acid)', color: '#050505', fontFamily: 'var(--font-head)' } : undefined}
                    >
                      <input type="radio" value={r} {...register('role')} className="sr-only" />
                      {r === 'customer' ? 'Customer' : 'Delivery Partner'}
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <FloatingInput label="Full name" error={errors.name?.message} {...register('name')} />
                  <FloatingInput label="Phone (opt.)" type="tel" {...register('phone')} />
                </div>
                <FloatingInput label="Email address" type="email" error={errors.email?.message} {...register('email')} />

                <div className="relative">
                  <FloatingInput label="Password" type={showPass ? 'text' : 'password'} error={errors.password?.message} {...register('password')} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-white/30 hover:text-white/60 transition-colors">
                    {showPass ? <EyeOff className="w-[15px] h-[15px]" /> : <Eye className="w-[15px] h-[15px]" />}
                  </button>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileTap={{ scale: 0.99 }}
                  whileHover={{ y: -1 }}
                  className="relative w-full h-[46px] mt-1.5 rounded-xl font-medium text-sm tracking-[-0.2px] overflow-hidden disabled:opacity-50"
                  style={{
                    background: 'var(--acid)',
                    color: '#050505',
                    fontFamily: 'var(--font-head)',
                    boxShadow: '0 8px 24px rgba(200,255,0,0.25)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                  {isLoading ? <Spinner size="sm" /> : 'Create account'}
                </motion.button>
              </form>

              <p className="text-center text-white/40 text-[13px] mt-5">
                Already have an account?{' '}
                <Link href="/login" className="font-medium transition-colors" style={{ color: 'var(--acid)' }}>
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

const FloatingInput = forwardRef<HTMLInputElement, {
  label: string; type?: string; error?: string
} & React.InputHTMLAttributes<HTMLInputElement>>(
  ({ label, type = 'text', error, className, ...props }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        type={type}
        placeholder=" "
        className={cn(
          'peer w-full h-12 px-3.5 pt-4 pb-1 rounded-xl text-[13px] text-white caret-violet-500',
          'bg-white/[0.03] border border-white/[0.08] outline-none',
          'focus:border-[rgba(200,255,0,0.40)] focus:bg-[rgba(200,255,0,0.02)] focus:shadow-[0_0_0_3px_rgba(200,255,0,0.06)] transition-all',
          'placeholder-transparent',
          error && 'border-red-500/50',
          className,
        )}
        {...props}
      />
      <label className="absolute left-3.5 top-3.5 text-[13px] text-white/40 pointer-events-none transition-all origin-left peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[13px] peer-focus:top-1.5 peer-focus:text-[13px] peer-focus:scale-[0.78] peer-focus:text-[#c8ff00] peer-[&:not(:placeholder-shown)]:top-1.5 peer-[&:not(:placeholder-shown)]:text-[13px] peer-[&:not(:placeholder-shown)]:scale-[0.78]">
        {label}
      </label>
      {error && <p className="mt-1 text-[11px] text-[#f87171] font-mono pl-0.5">{error}</p>}
    </div>
  )
)
FloatingInput.displayName = 'FloatingInput'
