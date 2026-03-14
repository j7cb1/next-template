'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { getQueryClient } from '@/lib/query-client'
import { getWagmiConfig } from '@/lib/wagmi-config'
import { PostHogProvider } from '@/components/providers/posthog-provider'
import { CurrencyProvider } from '@/hooks/use-currency'

import '@rainbow-me/rainbowkit/styles.css'

type ProvidersProps = {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient()
  const wagmiConfig = getWagmiConfig()

  return (
    <PostHogProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={darkTheme({ accentColor: '#10b981' })}>
            <CurrencyProvider>
              {children}
            </CurrencyProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </PostHogProvider>
  )
}
