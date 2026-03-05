import { Skeleton } from '@/components/ui/skeleton'

export function SwapWidgetSkeleton() {
  return (
    <div className="rounded-xl border border-emerald-600/20 bg-card/80 backdrop-blur-sm text-card-foreground overflow-hidden shadow-[0_0_40px_rgba(5,150,105,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-7 w-28" />
      </div>

      {/* Token inputs */}
      <div className="px-4 pb-1">
        <div className="flex flex-col">
          {/* From */}
          <div className="bg-black/20 border border-white/[0.06] rounded-lg p-4">
            <Skeleton className="h-3 w-16 mb-3" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </div>

          {/* Swap button placeholder */}
          <div className="relative z-10 flex justify-center h-0">
            <Skeleton className="absolute -translate-y-1/2 size-10 rounded-full" />
          </div>

          {/* To */}
          <div className="bg-black/20 border border-white/[0.06] rounded-lg p-4">
            <Skeleton className="h-3 w-20 mb-3" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Action button */}
      <div className="px-4 pt-3 pb-4">
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  )
}
