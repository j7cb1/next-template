'use client'

import { useSyncExternalStore } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function WalletStatus() {
  const { primaryWallet } = useDynamicContext()
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!mounted || !primaryWallet) {
    return null
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
