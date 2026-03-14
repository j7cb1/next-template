import type { Chain } from 'viem'
import { mainnet, bsc, arbitrum, base, optimism, avalanche, polygon, gnosis } from 'viem/chains'

export const CHAIN_MAP: Record<string, Chain> = {
  ETH: mainnet,
  BSC: bsc,
  ARB: arbitrum,
  BASE: base,
  OP: optimism,
  AVAX: avalanche,
  POL: polygon,
  GNO: gnosis,
}
