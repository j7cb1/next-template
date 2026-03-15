'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { IconPower, IconWallet } from '@tabler/icons-react'
import { Skeleton } from '@/components/ui/skeleton'

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function WalletStatus() {
  const { address, isConnected, isReconnecting, status } = useAccount()
  const { disconnect } = useDisconnect()
  const { openConnectModal } = useConnectModal()
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Wait one tick after mount so wagmi can start reconnecting before we show disconnected
  const [settled, setSettled] = useState(false)
  useEffect(() => { setSettled(true) }, [])

  const loading = !mounted || !settled || isReconnecting || status === 'connecting'

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-5">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>
    )
  }

  // Not connected — show red dot, 0x0, and connect button
  if (!isConnected || !address) {
    return (
      <div className="flex items-center gap-2 h-5">
        <div className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-sm text-muted-foreground font-mono">0x0</span>
        <button
          type="button"
          onClick={() => openConnectModal?.()}
          className="text-muted-foreground hover:text-emerald-500 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-sm p-0.5"
          aria-label="Connect wallet"
        >
          <IconWallet className="size-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 h-5">
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
