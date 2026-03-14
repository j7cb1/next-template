import { getDefaultConfig } from '@rainbow-me/rainbowkit'
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

// Lazy singleton — prevents WalletConnect Core from being re-initialised
// on every Fast Refresh cycle during development.
let _config: ReturnType<typeof getDefaultConfig> | undefined

export function getWagmiConfig() {
  if (!_config) {
    _config = getDefaultConfig({
      appName: 'CNZ Swap',
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
      chains: [mainnet, bsc, arbitrum, base, optimism, avalanche, polygon, gnosis],
      ssr: true,
    })
  }
  return _config
}
