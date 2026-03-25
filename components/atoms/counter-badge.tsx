import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function CounterBadge({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={count}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={cn(
          'absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full',
          'bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center',
          className,
        )}
      >
        {count > 99 ? '99+' : count}
      </motion.span>
    </AnimatePresence>
  )
}
