import { cn } from '@/lib/utils'

export function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <div className={cn('relative', sizes[size], className)}>
      <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: 'rgba(247,244,239,0.08)' }} />
      <div
        className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
        style={{ borderTopColor: 'var(--acid)' }}
      />
    </div>
  )
}
