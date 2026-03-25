'use client'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, PartyPopper } from 'lucide-react'

interface OrderDeliveredPopupProps {
  show: boolean
  onClose: () => void
  /** For delivery partner: show commission earned */
  commission?: number
  /** Label override */
  role?: 'customer' | 'delivery'
}

const spring = { type: 'spring' as const, stiffness: 260, damping: 22 }

export function OrderDeliveredPopup({ show, onClose, commission, role = 'customer' }: OrderDeliveredPopupProps) {
  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!show) return
    const t = setTimeout(onClose, 6000)
    return () => clearTimeout(t)
  }, [show, onClose])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={spring}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(15,17,23,0.72)',
              border: '1px solid rgba(247,244,239,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 0 60px rgba(200,255,0,0.10), 0 24px 64px rgba(0,0,0,0.6)',
            }}
            className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center"
          >
            {/* Animated check ring */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
              className="relative mb-6"
            >
              {/* Outer glow ring */}
              <motion.div
                animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(200,255,0,0.25) 0%, transparent 70%)' }}
              />
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(200,255,0,0.10)',
                  border: '2px solid rgba(200,255,0,0.30)',
                  boxShadow: '0 0 32px rgba(200,255,0,0.15)',
                }}
              >
                <CheckCircle className="w-12 h-12" style={{ color: 'var(--acid)' }} strokeWidth={1.5} />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <PartyPopper className="w-5 h-5 text-amber-400" />
                <h2 className="text-white text-2xl font-bold tracking-tight">
                  {role === 'delivery' ? 'Delivered!' : 'Order Delivered!'}
                </h2>
                <PartyPopper className="w-5 h-5 text-amber-400 scale-x-[-1]" />
              </div>

              <p className="text-white/50 text-sm leading-relaxed">
                {role === 'delivery'
                  ? commission != null
                    ? `Great job! ₹${commission.toFixed(2)} has been credited to your wallet.`
                    : 'Great job! Your commission has been credited.'
                  : 'Your order has been delivered. Enjoy your meal!'}
              </p>
            </motion.div>

            {/* Divider */}
            <div className="w-full h-px bg-white/[0.07] my-6" />

            {/* Close button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              whileTap={{ scale: 0.96 }}
              onClick={onClose}
              className="w-full h-11 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: 'rgba(200,255,0,0.12)',
                border: '1px solid rgba(200,255,0,0.22)',
                color: 'var(--acid)',
                fontFamily: 'var(--font-head)',
              }}
            >
              {role === 'delivery' ? 'View Earnings' : 'Rate your order'}
            </motion.button>

            <p className="text-white/20 text-xs mt-3">Tap anywhere to dismiss</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
