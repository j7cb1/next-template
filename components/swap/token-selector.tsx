'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { IconChevronDown, IconSearch } from '@tabler/icons-react'
import type { Token } from '@/repositories/swap/swap-schema'

type TokenSelectorProps = {
  tokens: Token[]
  selectedToken: Token | null
  onSelect: (token: Token) => void
  disabledToken?: Token | null
  isLoading?: boolean
  label?: string
}

const POPULAR_SYMBOLS = ['ETH', 'BTC', 'USDC', 'USDT', 'SOL', 'DAI']

function TokenIcon({ token, size = 32 }: { token: Token; size?: number }) {
  if (token.logoUrl) {
    return (
      <>
        <img
          src={token.logoUrl}
          alt={token.symbol}
          width={size}
          height={size}
          className="shrink-0 rounded-full"
          onError={(e) => {
            const target = e.currentTarget
            target.style.display = 'none'
            const sibling = target.nextElementSibling as HTMLElement | null
            if (sibling) sibling.style.display = 'flex'
          }}
        />
        <div
          className="shrink-0 rounded-full bg-muted items-center justify-center font-medium text-muted-foreground"
          style={{ width: size, height: size, fontSize: size * 0.375, display: 'none' }}
        >
          {token.symbol.slice(0, 2)}
        </div>
      </>
    )
  }

  return <TokenFallbackIcon symbol={token.symbol} size={size} />
}

function TokenFallbackIcon({
  symbol,
  size = 32,
}: {
  symbol: string
  size?: number
}) {
  return (
    <div
      className="shrink-0 rounded-full bg-muted flex items-center justify-center font-medium text-muted-foreground"
      style={{ width: size, height: size, fontSize: size * 0.375 }}
    >
      {symbol.slice(0, 2)}
    </div>
  )
}

function TokenRow({
  token,
  onSelect,
  disabled,
}: {
  token: Token
  onSelect: (token: Token) => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(token)}
      className="flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors hover:bg-emerald-600/10 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:bg-emerald-600/10"
    >
      <TokenIcon token={token} size={36} />
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium truncate">{token.symbol}</span>
        <span className="text-xs text-muted-foreground truncate">
          {token.name}
        </span>
      </div>
      <span className="ml-auto text-xs text-muted-foreground uppercase tracking-wide">
        {token.chain}
      </span>
    </button>
  )
}

export function TokenSelector({
  tokens,
  selectedToken,
  onSelect,
  disabledToken,
  isLoading,
  label,
}: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const handleSelect = useCallback(
    (token: Token) => {
      onSelect(token)
      setOpen(false)
      setSearch('')
    },
    [onSelect],
  )

  const popularTokens = useMemo(
    () =>
      POPULAR_SYMBOLS.map((sym) =>
        tokens.find(
          (t) => t.symbol.toUpperCase() === sym,
        ),
      ).filter(Boolean) as Token[],
    [tokens],
  )

  const filteredTokens = useMemo(() => {
    if (!search.trim()) return tokens
    const q = search.toLowerCase()
    return tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.chain.toLowerCase().includes(q),
    )
  }, [tokens, search])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="gap-2 min-w-0 shrink-0 h-10 px-3 text-sm font-medium"
          />
        }
      >
        {selectedToken ? (
          <>
            <TokenIcon token={selectedToken} size={20} />
            <span className="truncate">{selectedToken.symbol}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Select</span>
        )}
        <IconChevronDown className="size-4 text-muted-foreground shrink-0" />
      </DialogTrigger>

      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3">
          <DialogTitle>{label ?? 'Select token'}</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name, symbol, or chain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Popular tokens */}
        {!search && popularTokens.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {popularTokens.map((token) => (
                <Button
                  key={token.identifier}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 px-2.5"
                  disabled={
                    disabledToken?.identifier === token.identifier
                  }
                  onClick={() => handleSelect(token)}
                >
                  <TokenIcon token={token} size={18} />
                  <span className="text-xs font-medium">{token.symbol}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Token list */}
        <ScrollArea className="h-72">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No tokens found</p>
              {search && (
                <p className="text-xs mt-1">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="py-1">
              {filteredTokens.map((token) => (
                <TokenRow
                  key={token.identifier}
                  token={token}
                  onSelect={handleSelect}
                  disabled={
                    disabledToken?.identifier === token.identifier
                  }
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export { TokenIcon }
