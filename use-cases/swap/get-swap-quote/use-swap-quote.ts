import { useQuery } from '@tanstack/react-query'
import { getSwapQuoteAction } from './get-swap-quote-action'
import { getSwapQuoteQueryKey } from './get-swap-quote-query-key'

type UseSwapQuoteParams = {
  sellAsset: string | undefined
  buyAsset: string | undefined
  sellAmount: string
  slippage?: number
}

export function useSwapQuote({ sellAsset, buyAsset, sellAmount, slippage = 3 }: UseSwapQuoteParams) {
  const enabled = !!sellAsset && !!buyAsset && !!sellAmount && parseFloat(sellAmount) > 0

  return useQuery({
    queryKey: getSwapQuoteQueryKey(sellAsset ?? '', buyAsset ?? '', sellAmount, slippage),
    queryFn: async () => {
      const { data, error } = await getSwapQuoteAction({
        sellAsset: sellAsset!,
        buyAsset: buyAsset!,
        sellAmount,
        slippage,
      })
      if (error) throw new Error(error.message)
      return data
    },
    enabled,
    staleTime: 1000 * 30, // 30s — quotes go stale fast
    gcTime: 1000 * 60 * 5,
    retry: false,
  })
}
