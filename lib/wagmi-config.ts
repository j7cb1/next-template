import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { fallback, http } from 'wagmi'
import {
  mainnet,
  bsc,
  arbitrum,
  base,
  optimism,
  avalanche,
  polygon,
  gnosis,
} from 'wagmi/chains'

const chains = [mainnet, bsc, arbitrum, base, optimism, avalanche, polygon, gnosis] as const

const transports = Object.fromEntries(
  chains.map((chain) => [
    chain.id,
    fallback([
      http(chain.rpcUrls.default.http[0]),
      http(),
    ]),
  ]),
) as Record<(typeof chains)[number]['id'], ReturnType<typeof fallback>>

// Lazy singleton — prevents WalletConnect Core from being re-initialised
// on every Fast Refresh cycle during development.
let _config: ReturnType<typeof getDefaultConfig> | undefined

export function getWagmiConfig() {
  if (!_config) {
    _config = getDefaultConfig({
      appName: 'CNZ Swap',
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
      chains,
      transports,
      ssr: true,
    })
  }
  return _config
}
