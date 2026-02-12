'use client'

import { motion } from 'framer-motion'
import { IconArrowDown } from '@tabler/icons-react'
import { cn } from '@/utilities/shadcn'

type SwapDirectionButtonProps = {
  onClick: () => void
  flipped: boolean
}

export function SwapDirectionButton({
  onClick,
  flipped,
}: SwapDirectionButtonProps) {
  return (
    <div className="relative z-10 flex justify-center h-0">
      <motion.button
        type="button"
        onClick={onClick}
        className={cn(
          'absolute -translate-y-1/2',
          'flex items-center justify-center',
          'size-10 rounded-full',
          'bg-card border-2 border-border',
          'text-muted-foreground',
          'transition-all duration-200',
          'hover:border-emerald-600/50 hover:text-emerald-400 hover:bg-card',
          'hover:shadow-[0_0_12px_rgba(5,150,105,0.15)]',
          'active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'cursor-pointer',
        )}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          animate={{ rotate: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <IconArrowDown className="size-5" />
        </motion.div>
      </motion.button>
    </div>
  )
}
