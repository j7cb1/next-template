'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconGasStation, IconChevronDown } from '@tabler/icons-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utilities/shadcn'
import type { QuoteRoute } from '@/repositories/swap/swap-schema'
import type { Token } from '@/repositories/swap/swap-schema'

type SwapDetailsProps = {
  route: QuoteRoute | null
  fromToken: Token
  toToken: Token
  sellAmount: string
  slippage: number
  onSlippageChange: (value: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  isLoading?: boolean
}

const SLIPPAGE_PRESETS = [1, 3, 5]

function formatTime(seconds: number): string {
  if (seconds < 60) return `~${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return secs > 0 ? `~${mins}m ${secs}s` : `~${mins}m`
}

function formatNumber(value: string | number, maxDecimals = 6): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  if (num === 0) return '0'
  if (num < 0.000001) return '<0.000001'
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  })
}

function ValueOrSkeleton({ loading, width = 'w-16', children }: { loading?: boolean; width?: string; children: React.ReactNode }) {
  if (loading) return <Skeleton className={cn('h-3 rounded', width)} />
  return <>{children}</>
}

export function SwapDetails({ route, fromToken, toToken, sellAmount, slippage, onSlippageChange, open, onOpenChange, isLoading }: SwapDetailsProps) {
  const [editingSlippage, setEditingSlippage] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const loading = isLoading || !route

  // Build a price lookup from quote meta for USD conversion
  const prices = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of route?.meta?.assets ?? []) {
      if (a.price) map.set(a.asset, a.price)
    }
    return map
  }, [route?.meta?.assets])

  // Sum network-type fees into a single USD value
  const gasFeeUsd = useMemo(() => {
    if (!route) return 0
    const networkFees = route.fees.filter((f) =>
      ['network', 'inbound', 'outbound'].includes(f.type),
    )
    let totalUsd = 0
    for (const f of networkFees) {
      const amt = parseFloat(f.amount || '0')
      const price = prices.get(f.asset) ?? 0
      totalUsd += amt * price
    }
    return totalUsd
  }, [route, prices])

  const rate = useMemo(() => {
    if (!route) return null
    const sell = parseFloat(sellAmount)
    const buy = parseFloat(route.expectedBuyAmount)
    if (!sell || !buy) return null
    return buy / sell
  }, [sellAmount, route])

  const isCustomSlippage = !SLIPPAGE_PRESETS.includes(slippage)

  const handlePreset = useCallback((value: number) => {
    onSlippageChange(value)
    setEditingSlippage(false)
    setCustomValue('')
  }, [onSlippageChange])

  const commitCustom = useCallback(() => {
    const num = parseFloat(customValue)
    if (!isNaN(num) && num > 0 && num <= 50) {
      onSlippageChange(num)
    }
    setEditingSlippage(false)
  }, [customValue, onSlippageChange])

  useEffect(() => {
    if (editingSlippage) {
      inputRef.current?.focus()
    }
  }, [editingSlippage])

  const providers = route?.providers.join(' → ')
  const estTime = route?.estimatedTime?.total

  return (
    <div className="mt-3 px-2">
      {/* Gas summary row */}
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="w-full flex items-center gap-1.5 py-1.5 text-xs text-muted-foreground hover:text-foreground/70 transition-colors cursor-pointer"
      >
        <ValueOrSkeleton loading={loading} width="w-12">
          <span className="tabular-nums font-medium">
            {gasFeeUsd < 0.01 ? '<$0.01' : `$${formatNumber(gasFeeUsd, 2)}`}
          </span>
        </ValueOrSkeleton>
        <IconGasStation className="size-3.5" />
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-auto"
        >
          <IconChevronDown className="size-3.5" />
        </motion.div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pt-1.5 pb-1 space-y-2 text-[11px]">
              {/* Rate */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <ValueOrSkeleton loading={loading} width="w-28">
                  {rate && (
                    <span className="text-muted-foreground/80 tabular-nums">
                      1 {fromToken.ticker} = {formatNumber(rate)} {toToken.ticker}
                    </span>
                  )}
                </ValueOrSkeleton>
              </div>

              {/* Slippage */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Slippage</span>
                  <div className="flex items-center gap-1">
                    {SLIPPAGE_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePreset(p)}
                        className={cn(
                          'h-5 min-w-[32px] px-1.5 rounded text-[10px] font-medium tabular-nums transition-colors',
                          slippage === p
                            ? 'bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-600/30'
                            : 'text-muted-foreground/70 hover:bg-muted/60',
                        )}
                      >
                        {p}%
                      </button>
                    ))}
                    {editingSlippage ? (
                      <div className="flex items-center h-5 rounded bg-muted/40 ring-1 ring-emerald-600/30 px-1.5">
                        <input
                          ref={inputRef}
                          type="text"
                          inputMode="decimal"
                          value={customValue}
                          onChange={(e) => setCustomValue(e.target.value.replace(/[^0-9.]/g, ''))}
                          onBlur={commitCustom}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitCustom() }}
                          className="w-8 bg-transparent text-[10px] font-medium tabular-nums text-foreground outline-none text-right"
                          placeholder={String(slippage)}
                        />
                        <span className="text-[10px] text-muted-foreground/60 ml-0.5">%</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomValue(isCustomSlippage ? String(slippage) : '')
                          setEditingSlippage(true)
                        }}
                        className={cn(
                          'h-5 min-w-[32px] px-1.5 rounded text-[10px] font-medium tabular-nums transition-colors',
                          isCustomSlippage
                            ? 'bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-600/30'
                            : 'text-muted-foreground/70 hover:bg-muted/60',
                        )}
                      >
                        {isCustomSlippage ? `${slippage}%` : 'Custom'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Min receive */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min. receive</span>
                <ValueOrSkeleton loading={loading} width="w-24">
                  <span className="text-muted-foreground/80 tabular-nums">
                    {route ? formatNumber(route.expectedBuyAmountMaxSlippage) : '—'} {toToken.ticker}
                  </span>
                </ValueOrSkeleton>
              </div>

              {/* Network fee */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network fee</span>
                <ValueOrSkeleton loading={loading} width="w-14">
                  <span className="text-muted-foreground/80 tabular-nums">
                    {gasFeeUsd < 0.01 ? '<$0.01' : `$${formatNumber(gasFeeUsd, 2)}`}
                  </span>
                </ValueOrSkeleton>
              </div>

              {/* Route */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route</span>
                <ValueOrSkeleton loading={loading} width="w-20">
                  <span className="text-muted-foreground/80">
                    {providers}
                  </span>
                </ValueOrSkeleton>
              </div>

              {/* Estimated time */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. time</span>
                <ValueOrSkeleton loading={loading} width="w-10">
                  {estTime != null && estTime > 0 && (
                    <span className="text-muted-foreground/80 tabular-nums">
                      {formatTime(estTime)}
                    </span>
                  )}
                </ValueOrSkeleton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
