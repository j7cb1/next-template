'use client'

import { useSyncExternalStore } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { IconPower } from '@tabler/icons-react'

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function WalletStatus() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!mounted || !isConnected || !address) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-2 rounded-full bg-emerald-500" />
      <span className="text-sm text-muted-foreground font-mono">
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
      <button
        type="button"
        onClick={() => disconnect()}
        className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-sm p-0.5"
        aria-label="Disconnect wallet"
      >
        <IconPower className="size-3.5" />
      </button>
    </div>
  )
}
