import { QueryClient, isServer } from '@tanstack/react-query'
import { cache } from 'react'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

// Server: React.cache() gives per-request dedup (no cross-request leaking)
// Browser: module-level singleton (persists across navigations)
export const getQueryClient = isServer
  ? cache(makeQueryClient)
  : () => {
      if (!browserQueryClient) browserQueryClient = makeQueryClient()
      return browserQueryClient
    }
