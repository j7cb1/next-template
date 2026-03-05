import { useQuery } from '@tanstack/react-query'
import { createPublicClient, formatUnits, http, type Chain, type PublicClient } from 'viem'
import { mainnet, bsc, arbitrum, base, optimism, avalanche, polygon, gnosis } from 'viem/chains'
import type { Token } from '@/repositories/swap/swap-schema'

/** Map SwapKit chain keys → viem chain configs for balance lookups */
const CHAIN_MAP: Record<string, Chain> = {
  ETH: mainnet,
  BSC: bsc,
  ARB: arbitrum,
  BASE: base,
  OP: optimism,
  AVAX: avalanche,
  POL: polygon,
  GNO: gnosis,
}

/** Cached public clients per chain to reuse viem batching/caching */
const clientCache = new Map<string, PublicClient>()

function getClient(chainKey: string): PublicClient | null {
  const chain = CHAIN_MAP[chainKey]
  if (!chain) return null

  let client = clientCache.get(chainKey)
  if (!client) {
    client = createPublicClient({ chain, transport: http() })
    clientCache.set(chainKey, client)
  }
  return client
}

const ERC20_BALANCE_OF_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

/**
 * Fetches the connected wallet's balance for a specific token.
 *
 * Uses a cached viem public client for the token's chain (not the wallet's
 * current chain), so balance is always checked on the correct network.
 *
 * Only works for EVM chains. Non-EVM chains (BTC, SOL, etc.) are skipped.
 */
export function useWalletBalance(
  walletAddress: string | undefined,
  token: Token | null,
) {
  const identifier = token?.identifier
  const isErc20 = !!token?.address

  return useQuery({
    queryKey: ['wallet', 'balance', walletAddress ?? '', identifier ?? ''],
    queryFn: async (): Promise<string | undefined> => {
      if (!walletAddress || !token) return undefined

      const client = getClient(token.chain)
      if (!client) return undefined

      if (!isErc20) {
        const raw = await client.getBalance({
          address: walletAddress as `0x${string}`,
        })
        return formatUnits(raw, token.decimals ?? 18)
      }

      const raw = await client.readContract({
        address: token.address as `0x${string}`,
        abi: ERC20_BALANCE_OF_ABI,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
      })
      return formatUnits(raw, token.decimals ?? 18)
    },
    enabled: !!walletAddress && !!token && !!CHAIN_MAP[token.chain],
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
  })
}
