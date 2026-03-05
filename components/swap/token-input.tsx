'use client'

import { useCallback } from 'react'
import { TokenSelector } from './token-selector'
import { Skeleton } from '@/components/ui/skeleton'
import type { Token } from '@/repositories/swap/swap-schema'
import { cn } from '@/utilities/shadcn'

type TokenInputProps = {
  label: string
  token: Token | null
  onTokenSelect: (token: Token) => void
  amount: string
  onAmountChange?: (value: string) => void
  readOnly?: boolean
  tokens: Token[]
  disabledToken?: Token | null
  isLoadingTokens?: boolean
  isLoadingQuote?: boolean
  usdValue?: string
  className?: string
}

function sanitizeDecimalInput(value: string): string {
  if (value === '') return ''
  if (value === '.') return '0.'
  const cleaned = value.replace(/[^0-9.]/g, '')
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('')
  }
  return cleaned
}

export function TokenInput({
  label,
  token,
  onTokenSelect,
  amount,
  onAmountChange,
  readOnly = false,
  tokens,
  disabledToken,
  isLoadingTokens,
  isLoadingQuote,
  usdValue,
  className,
}: TokenInputProps) {
  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onAmountChange) return
      const sanitized = sanitizeDecimalInput(e.target.value)
      onAmountChange(sanitized)
    },
    [onAmountChange],
  )

  return (
    <div
      className={cn(
        'bg-black/30 rounded-2xl p-4 transition-colors',
        'focus-within:ring-1 focus-within:ring-emerald-600/20',
        className,
      )}
    >
      {/* Label */}
      <span className="text-xs font-medium text-muted-foreground mb-3 block">
        {label}:
      </span>

      {/* Token selector + amount */}
      <div className="flex items-center gap-3">
        <TokenSelector
          tokens={tokens}
          selectedToken={token}
          onSelect={onTokenSelect}
          disabledToken={disabledToken}
          isLoading={isLoadingTokens}
          label={label}
        />
        <div className="flex-1 min-w-0 flex flex-col items-end gap-0.5">
          {readOnly ? (
            isLoadingQuote ? (
              <Skeleton className="h-8 w-28 rounded-lg" />
            ) : (
              <div
                className={cn(
                  'w-full text-right text-2xl font-semibold tracking-tight tabular-nums truncate',
                  amount ? 'text-foreground' : 'text-muted-foreground/40',
                )}
              >
                {amount || '0.0'}
              </div>
            )
          ) : (
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={amount}
              onChange={handleAmountChange}
              className="w-full bg-transparent text-right text-2xl font-semibold tracking-tight tabular-nums outline-none placeholder:text-muted-foreground/40"
            />
          )}
          {/* USD value */}
          {isLoadingQuote ? (
            <Skeleton className="h-4 w-14 rounded" />
          ) : (
            <span className="text-xs text-muted-foreground tabular-nums h-4">
              {usdValue ? `~${usdValue}` : '$0.00'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
