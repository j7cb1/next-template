'use client'

import { useCallback } from 'react'
import { TokenSelector } from './token-selector'
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
  className?: string
}

function sanitizeDecimalInput(value: string): string {
  // Allow empty
  if (value === '') return ''
  // Allow starting decimal like ".5"
  if (value === '.') return '0.'
  // Remove non-numeric except decimal
  const cleaned = value.replace(/[^0-9.]/g, '')
  // Only allow one decimal point
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
        'bg-black/20 border border-white/[0.06] rounded-lg p-4 transition-colors',
        'focus-within:border-emerald-600/30 focus-within:bg-black/30',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <TokenSelector
          tokens={tokens}
          selectedToken={token}
          onSelect={onTokenSelect}
          disabledToken={disabledToken}
          isLoading={isLoadingTokens}
          label={`Select ${label.toLowerCase()} token`}
        />
        {readOnly ? (
          <div
            className={cn(
              'flex-1 text-right text-2xl font-semibold tracking-tight tabular-nums min-w-0 truncate',
              isLoadingQuote
                ? 'animate-pulse text-muted-foreground/40'
                : amount
                  ? 'text-foreground'
                  : 'text-muted-foreground/40',
            )}
          >
            {isLoadingQuote ? '...' : amount || '0.0'}
          </div>
        ) : (
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={handleAmountChange}
            className="flex-1 bg-transparent text-right text-2xl font-semibold tracking-tight tabular-nums outline-none placeholder:text-muted-foreground/40 min-w-0"
          />
        )}
      </div>
    </div>
  )
}
