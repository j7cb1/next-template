'use client'

import { useQuery } from '@tanstack/react-query'

export type ExchangeRates = Record<string, number>

const TARGETS = 'NZD,AUD,EUR,GBP,CAD,JPY,SGD,CHF'

export function useExchangeRates() {
  return useQuery({
    queryKey: ['exchange-rates', 'USD', TARGETS],
    queryFn: async (): Promise<ExchangeRates> => {
      const res = await fetch(
        `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${TARGETS}`,
      )
      if (!res.ok) throw new Error('Failed to fetch exchange rates')
      const json = await res.json()
      // Always include USD → USD = 1
      return { USD: 1, ...json.rates } as ExchangeRates
    },
    staleTime: 1000 * 60 * 30,    // 30 minutes
    gcTime: 1000 * 60 * 60 * 24,  // 24 hours
    refetchOnWindowFocus: false,
    retry: 2,
  })
}
