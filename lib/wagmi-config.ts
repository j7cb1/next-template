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

export const wagmiConfig = getDefaultConfig({
  appName: 'CNZ Swap',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
  chains: [mainnet, bsc, arbitrum, base, optimism, avalanche, polygon, gnosis],
  ssr: true,
})
