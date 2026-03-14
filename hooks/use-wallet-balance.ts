import { useQuery } from '@tanstack/react-query'
import { useConfig } from 'wagmi'
import { getPublicClient } from 'wagmi/actions'
import { formatUnits } from 'viem'
import type { Token } from '@/repositories/swap/swap-schema'
import { CHAIN_MAP } from '@/utilities/chain-map'

const ERC20_BALANCE_OF_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export function useWalletBalance(
  walletAddress: string | undefined,
  token: Token | null,
) {
  const config = useConfig()
  const identifier = token?.identifier
  const isErc20 = !!token?.address

  return useQuery({
    queryKey: walletAddress && identifier
      ? ['wallet', 'balance', walletAddress, identifier]
      : ['wallet', 'balance', 'pending'],
    queryFn: async (): Promise<string> => {
      console.log('[balance] queryFn called', { walletAddress, chain: token?.chain, identifier, isErc20 })

      if (!walletAddress || !token) throw new Error('Missing wallet or token')

      const chain = CHAIN_MAP[token.chain]
      if (!chain) throw new Error(`Unsupported chain: ${token.chain}`)

      const client = getPublicClient(config, { chainId: chain.id })
      console.log('[balance] public client', { chainId: chain.id, hasClient: !!client })
      if (!client) throw new Error(`No public client for chain: ${token.chain}`)

      try {
        if (!isErc20) {
          const raw = await client.getBalance({
            address: walletAddress as `0x${string}`,
          })
          const formatted = formatUnits(raw, token.decimals ?? 18)
          console.log('[balance] native balance', { chain: token.chain, raw: raw.toString(), formatted })
          return formatted
        }

        const raw = await client.readContract({
          address: token.address as `0x${string}`,
          abi: ERC20_BALANCE_OF_ABI,
          functionName: 'balanceOf',
          args: [walletAddress as `0x${string}`],
        })
        const formatted = formatUnits(raw, token.decimals ?? 18)
        console.log('[balance] erc20 balance', { chain: token.chain, token: token.address, raw: raw.toString(), formatted })
        return formatted
      } catch (err) {
        console.error('[balance] RPC error', { chain: token.chain, error: err })
        throw err
      }
    },
    enabled: !!walletAddress && !!token && !!CHAIN_MAP[token.chain],
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 2,
  })
}
