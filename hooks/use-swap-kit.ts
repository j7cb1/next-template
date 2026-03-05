'use client'

import { useState, useEffect } from 'react'

type SwapKitInstance = Awaited<ReturnType<typeof import('@swapkit/sdk')['createSwapKit']>>

export function useSwapKit() {
  const [swapKit, setSwapKit] = useState<SwapKitInstance | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const { createSwapKit } = await import('@swapkit/sdk')
        const client = createSwapKit({
          config: {
            apiKeys: {
              swapKit: process.env.NEXT_PUBLIC_SWAPKIT_API_KEY ?? '',
            },
          },
        })
        if (!cancelled) {
          setSwapKit(client)
        }
      } catch (error) {
        console.error('Failed to initialize SwapKit:', error)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [])

  return { swapKit, isLoading }
}
