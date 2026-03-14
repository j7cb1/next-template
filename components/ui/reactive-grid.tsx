'use client'

import { FlickeringGrid } from '@/components/magicui/flickering-grid'
import { useIsActive } from '@/hooks/use-ui-activity'

export function ReactiveGrid() {
  const active = useIsActive()

  return (
    <FlickeringGrid
      squareSize={4}
      gridGap={6}
      flickerChance={active ? 0.9 : 0.15}
      color="rgb(16, 185, 129)"
      maxOpacity={active ? 0.5 : 0.15}
      className="dark:opacity-60"
    />
  )
}
