import { cn } from '@/lib/utils'

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('surface-card rounded-xl p-4 space-y-3', className)}>
      <div className="h-40 rounded-lg bg-white/[0.03] shimmer" />
      <div className="h-4 w-3/4 rounded bg-white/[0.03] shimmer" />
      <div className="h-3 w-1/2 rounded bg-white/[0.03] shimmer" />
      <div className="flex justify-between items-center pt-1">
        <div className="h-5 w-16 rounded bg-white/[0.03] shimmer" />
        <div className="h-8 w-20 rounded-lg bg-white/[0.03] shimmer" />
      </div>
    </div>
  )
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 p-4', className)}>
      <div className="w-10 h-10 rounded-full bg-white/[0.03] shimmer flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 rounded bg-white/[0.03] shimmer" />
        <div className="h-3 w-1/2 rounded bg-white/[0.03] shimmer" />
      </div>
      <div className="h-6 w-20 rounded bg-white/[0.03] shimmer" />
    </div>
  )
}

export function SkeletonOrderCard({ className }: { className?: string }) {
  return (
    <div className={cn('surface-card rounded-xl p-4', className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-white/[0.03] shimmer" />
          <div className="h-3 w-24 rounded bg-white/[0.03] shimmer" />
        </div>
        <div className="h-6 w-20 rounded-full bg-white/[0.03] shimmer" />
      </div>
      <div className="h-3 w-full rounded bg-white/[0.03] shimmer mb-2" />
      <div className="flex justify-between items-center mt-3">
        <div className="h-3 w-20 rounded bg-white/[0.03] shimmer" />
        <div className="h-5 w-16 rounded bg-white/[0.03] shimmer" />
      </div>
    </div>
  )
}

export function SkeletonDeliveryCard({ className }: { className?: string }) {
  return (
    <div className={cn('surface-card rounded-2xl p-5', className)}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="space-y-2">
          <div className="h-4 w-36 rounded bg-white/[0.03] shimmer" />
          <div className="h-3 w-24 rounded bg-white/[0.03] shimmer" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-5 w-16 rounded bg-white/[0.03] shimmer" />
          <div className="h-3 w-12 rounded bg-white/[0.03] shimmer" />
        </div>
      </div>
      <div className="h-14 rounded-xl bg-white/[0.02] shimmer mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-24 rounded-md bg-white/[0.03] shimmer" />
        <div className="h-6 w-20 rounded-md bg-white/[0.03] shimmer" />
      </div>
      <div className="h-10 rounded-xl bg-white/[0.03] shimmer" />
    </div>
  )
}
