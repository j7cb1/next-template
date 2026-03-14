'use client'

import { useCallback } from 'react'
import { useCurrency } from './use-currency'
import { useExchangeRates } from './use-exchange-rates'

/**
 * Returns a formatter that converts a USD value to the user's selected currency.
 * Falls back to USD display if rates haven't loaded yet.
 */
export function useFormatCurrency() {
  const { currency } = useCurrency()
  const { data: rates } = useExchangeRates()

  const format = useCallback(
    (usdValue: number): string => {
      const rate = rates?.[currency.code] ?? 1
      const converted = usdValue * rate
      const isJpy = currency.code === 'JPY'

      if (converted < 0.01 && !isJpy) return `<${currency.symbol}0.01`
      if (converted < 1 && isJpy) return `<${currency.symbol}1`

      return `${currency.symbol}${converted.toLocaleString('en-US', {
        minimumFractionDigits: isJpy ? 0 : 2,
        maximumFractionDigits: isJpy ? 0 : 2,
      })}`
    },
    [currency, rates],
  )

  return format
}
