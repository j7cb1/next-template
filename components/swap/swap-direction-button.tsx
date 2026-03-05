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
    <div className="relative z-10 flex justify-center h-0 my-1">
      <motion.button
        type="button"
        onClick={onClick}
        className={cn(
          'absolute -translate-y-1/2',
          'flex items-center justify-center',
          'size-9 rounded-xl',
          'bg-card/90 border border-white/[0.06]',
          'text-emerald-400',
          'transition-all duration-200',
          'hover:bg-card hover:text-emerald-300',
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
          <IconArrowDown className="size-4" />
        </motion.div>
      </motion.button>
    </div>
  )
}
