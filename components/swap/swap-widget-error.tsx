'use client'

import { Button } from '@/components/ui/button'
import { IconAlertTriangle } from '@tabler/icons-react'

type SwapWidgetErrorProps = {
  error?: Error
  reset?: () => void
}

export function SwapWidgetError({ error, reset }: SwapWidgetErrorProps) {
  return (
    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm text-card-foreground overflow-hidden shadow-[0_0_40px_rgba(5,150,105,0.06)]">
      <div className="flex flex-col items-center justify-center gap-4 px-5 py-16">
        <IconAlertTriangle className="size-10 text-destructive" />
        <div className="text-center space-y-1">
          <p className="text-sm font-medium">Failed to load swap widget</p>
          <p className="text-xs text-muted-foreground">
            {error?.message ?? 'An unexpected error occurred'}
          </p>
        </div>
        {reset && (
          <Button variant="outline" onClick={reset} className="h-9 px-4 text-xs">
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
}
