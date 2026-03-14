'use client'

import { createContext, use, useState, useCallback, useSyncExternalStore } from 'react'
import type { Currency } from '@/config/currencies'
import { getCurrency, DEFAULT_CURRENCY } from '@/config/currencies'

type CurrencyContextValue = {
  currency: Currency
  setCurrency: (code: string) => void
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

const STORAGE_KEY = 'preferred-currency'

// SSR-safe localStorage read
const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

function getInitialCode(): string {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY.code
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CURRENCY.code
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [code, setCode] = useState(getInitialCode)

  const setCurrency = useCallback((newCode: string) => {
    setCode(newCode)
    localStorage.setItem(STORAGE_KEY, newCode)
  }, [])

  const currency = mounted ? getCurrency(code) : DEFAULT_CURRENCY

  return (
    <CurrencyContext value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext>
  )
}

export function useCurrency() {
  const ctx = use(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
