import { useQuery } from '@tanstack/react-query'
import { trackSwapAction } from './track-swap-action'
import { getTrackSwapQueryKey } from './track-swap-query-key'

export function useTrackSwap(hash: string | null, chainId: string | null) {
  return useQuery({
    queryKey: getTrackSwapQueryKey(hash ?? '', chainId ?? ''),
    queryFn: async () => {
      const { data, error } = await trackSwapAction({
        hash: hash!,
        chainId: chainId!,
      })
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!hash && !!chainId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'completed' || status === 'failed' || status === 'refunded') return false
      return 10_000
    },
    staleTime: 0,
  })
}
