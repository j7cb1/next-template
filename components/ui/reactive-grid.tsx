'use client'

import { FlickeringGrid } from '@/components/magicui/flickering-grid'
import { useIsActive } from '@/hooks/use-ui-activity'

export function ReactiveGrid() {
  const active = useIsActive()

  return (
    <FlickeringGrid
      squareSize={4}
      gridGap={6}
      flickerChance={active ? 0.9 : 0.03}
      color="rgb(16, 185, 129)"
      baseOpacity={0.12}
      maxOpacity={active ? 0.7 : 0.2}
      className="dark:opacity-60"
    />
  )
}
