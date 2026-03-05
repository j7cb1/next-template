import { useQuery } from '@tanstack/react-query'
import { getSupportedTokensAction } from './get-supported-tokens-action'
import { getSupportedTokensQueryKey } from './get-supported-tokens-query-key'

export function useSupportedTokens() {
  return useQuery({
    queryKey: getSupportedTokensQueryKey(),
    queryFn: async () => {
      const { data, error } = await getSupportedTokensAction()
      if (error) {
        throw error
      }
      return data
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  })
}
