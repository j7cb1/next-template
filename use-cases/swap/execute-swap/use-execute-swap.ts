import { useMutation } from '@tanstack/react-query'
import type { Account, Chain, Transport, WalletClient } from 'viem'
import { executeSwapAction } from './execute-swap-action'

type ExecuteSwapParams = {
  routeId: string
  sourceAddress: string
  destinationAddress: string
  walletClient: WalletClient<Transport, Chain, Account>
  sellChain: string
}

export function useExecuteSwap() {
  return useMutation({
    mutationFn: async ({
      routeId,
      sourceAddress,
      destinationAddress,
      walletClient,
      sellChain,
    }: ExecuteSwapParams) => {
      // 1. Build transaction server-side (protects API key)
      const { data, error } = await executeSwapAction({
        routeId,
        sourceAddress,
        destinationAddress,
      })
      if (error) throw new Error(error.message)

      // 2. Sign & send client-side via wallet
      const txHash = await walletClient.sendTransaction({
        to: data.tx.to as `0x${string}`,
        value: data.tx.value ? BigInt(data.tx.value) : undefined,
        data: data.tx.data as `0x${string}` | undefined,
        ...(data.tx.gas ? { gas: BigInt(data.tx.gas) } : {}),
        ...(data.tx.gasPrice ? { gasPrice: BigInt(data.tx.gasPrice) } : {}),
      })

      return { txHash, chainId: sellChain }
    },
  })
}
