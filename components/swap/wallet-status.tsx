'use client'

import { useState, useEffect } from 'react'
import { useDynamicContext, DynamicWidget } from '@dynamic-labs/sdk-react-core'

export function WalletStatus() {
  const { primaryWallet } = useDynamicContext()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (!primaryWallet) {
    return <DynamicWidget />
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-2 rounded-full bg-emerald-500" />
      <span className="text-sm text-muted-foreground font-mono">
        {primaryWallet.address.slice(0, 6)}...{primaryWallet.address.slice(-4)}
      </span>
    </div>
  )
}
