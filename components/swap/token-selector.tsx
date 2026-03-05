'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { IconChevronDown, IconSearch, IconCheck } from '@tabler/icons-react'
import { getChainMeta, CHAIN_ORDER } from '@/config/chains'
import type { Token } from '@/repositories/swap/swap-schema'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TokenSelectorProps = {
  tokens: Token[]
  selectedToken: Token | null
  onSelect: (token: Token) => void
  disabledToken?: Token | null
  isLoading?: boolean
  label?: string
}

const POPULAR_SYMBOLS = ['ETH', 'BTC', 'USDC', 'USDT', 'SOL', 'DAI']
const ROW_HEIGHT = 56

// ---------------------------------------------------------------------------
// Chain icon components
// ---------------------------------------------------------------------------

function ChainIcon({ chainKey, size = 16 }: { chainKey: string; size?: number }) {
  const meta = getChainMeta(chainKey)

  if (!meta.iconUrl) {
    return (
      <div
        className="shrink-0 rounded-full bg-muted flex items-center justify-center"
        style={{ width: size, height: size, fontSize: size * 0.55 }}
      >
        <span className="text-muted-foreground font-semibold leading-none">
          {chainKey[0]}
        </span>
      </div>
    )
  }

  return (
    <img
      src={meta.iconUrl}
      alt={meta.name}
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
  )
}

function ChainBadge({ chainKey, size = 14 }: { chainKey: string; size?: number }) {
  const meta = getChainMeta(chainKey)

  if (!meta.iconUrl) {
    return (
      <div
        className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background ring-[1.5px] ring-background flex items-center justify-center"
        style={{ width: size, height: size, fontSize: size * 0.55 }}
      >
        <div
          className="w-full h-full rounded-full bg-muted flex items-center justify-center"
        >
          <span className="text-muted-foreground font-semibold leading-none">
            {chainKey[0]}
          </span>
        </div>
      </div>
    )
  }

  return (
    <>
      <img
        src={meta.iconUrl}
        alt={meta.name}
        width={size}
        height={size}
        className="absolute -bottom-0.5 -right-0.5 rounded-full ring-[1.5px] ring-background"
        onError={(e) => {
          const target = e.currentTarget
          target.style.display = 'none'
          const sibling = target.nextElementSibling as HTMLElement | null
          if (sibling) sibling.style.display = 'flex'
        }}
      />
      {/* Fallback for broken chain icon */}
      <div
        className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background ring-[1.5px] ring-background items-center justify-center"
        style={{ width: size, height: size, fontSize: size * 0.55, display: 'none' }}
      >
        <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground font-semibold leading-none">
            {chainKey[0]}
          </span>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Token icon components
// ---------------------------------------------------------------------------

function TokenIcon({ token, size = 32 }: { token: Token; size?: number }) {
  if (token.logoURI) {
    return (
      <>
        <img
          src={token.logoURI}
          alt={token.ticker}
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
          className="shrink-0 rounded-full bg-muted flex items-center justify-center font-medium text-muted-foreground"
          style={{ width: size, height: size, fontSize: size * 0.375, display: 'none' }}
        >
          {token.ticker.slice(0, 2)}
        </div>
      </>
    )
  }

  return (
    <div
      className="shrink-0 rounded-full bg-muted flex items-center justify-center font-medium text-muted-foreground"
      style={{ width: size, height: size, fontSize: size * 0.375 }}
    >
      {token.ticker.slice(0, 2)}
    </div>
  )
}

function TokenIconWithChain({
  token,
  size = 36,
  showChainBadge = true,
}: {
  token: Token
  size?: number
  showChainBadge?: boolean
}) {
  const badgeSize = Math.max(Math.round(size * 0.39), 10)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <TokenIcon token={token} size={size} />
      {showChainBadge && <ChainBadge chainKey={token.chain} size={badgeSize} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Network filter
// ---------------------------------------------------------------------------

const VISIBLE_CHAIN_COUNT = 7

function NetworkBar({
  chains,
  selected,
  onSelect,
}: {
  chains: string[]
  selected: string | null
  onSelect: (chain: string | null) => void
}) {
  const [moreOpen, setMoreOpen] = useState(false)
  const visibleChains = chains.slice(0, VISIBLE_CHAIN_COUNT)
  const overflowChains = chains.slice(VISIBLE_CHAIN_COUNT)

  return (
    <div className="flex items-center gap-1.5">
      {/* All networks button */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        title="All Networks"
        className={`group relative flex-1 h-9 rounded-lg flex items-center justify-center text-[11px] font-semibold transition-all ${
          selected === null
            ? 'bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-600/30'
            : 'text-muted-foreground hover:bg-muted/60'
        }`}
      >
        All
      </button>

      {/* Visible chain icons */}
      {visibleChains.map((chainKey) => {
        const meta = getChainMeta(chainKey)
        const isSelected = selected === chainKey
        return (
          <button
            key={chainKey}
            type="button"
            onClick={() => onSelect(chainKey)}
            title={meta.name}
            className={`group relative flex-1 h-9 rounded-lg flex items-center justify-center transition-all ${
              isSelected
                ? 'ring-1 ring-emerald-500/60 bg-emerald-600/10'
                : 'hover:bg-muted/60'
            }`}
          >
            <ChainIcon chainKey={chainKey} size={22} />
            {/* Tooltip */}
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-[10px] font-medium text-popover-foreground shadow-md ring-1 ring-foreground/10 opacity-0 scale-95 transition-all group-hover:opacity-100 group-hover:scale-100">
              {meta.name}
            </span>
          </button>
        )
      })}

      {/* Overflow dropdown */}
      {overflowChains.length > 0 && (
        <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="flex-1 h-9 rounded-lg flex items-center justify-center gap-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted/60 transition-colors"
              />
            }
          >
            +{overflowChains.length}
            <IconChevronDown className="size-3 text-muted-foreground/60" />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={4}
            className="w-48 p-1 max-h-64 overflow-y-auto"
          >
            {overflowChains.map((chainKey) => {
              const meta = getChainMeta(chainKey)
              const isSelected = selected === chainKey
              return (
                <button
                  key={chainKey}
                  type="button"
                  onClick={() => { onSelect(chainKey); setMoreOpen(false) }}
                  className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-muted/80"
                >
                  <ChainIcon chainKey={chainKey} size={16} />
                  <span className="flex-1 text-left">{meta.name}</span>
                  {isSelected && (
                    <IconCheck className="size-3.5 text-emerald-400" />
                  )}
                </button>
              )
            })}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Virtualized token list
// ---------------------------------------------------------------------------

function VirtualTokenList({
  tokens,
  onSelect,
  disabledToken,
}: {
  tokens: Token[]
  onSelect: (token: Token) => void
  disabledToken?: Token | null
}) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: tokens.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  })

  return (
    <div ref={parentRef} className="flex-1 overflow-auto">
      <div
        style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const token = tokens[virtualRow.index]
          const disabled = disabledToken?.identifier === token.identifier
          return (
            <button
              key={virtualRow.key}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(token)}
              className="absolute left-0 w-full flex items-center gap-3 px-5 text-left transition-colors hover:bg-emerald-600/10 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:bg-emerald-600/10"
              style={{
                height: ROW_HEIGHT,
                top: virtualRow.start,
              }}
            >
              <TokenIconWithChain token={token} size={36} />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold truncate">{token.ticker}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {token.name ?? token.ticker}
                </span>
              </div>
              <div className="flex flex-col items-end ml-auto shrink-0">
                <span className="text-sm font-medium text-muted-foreground/40 tabular-nums">
                  --
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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
  const [selectedChain, setSelectedChain] = useState<string | null>(null)

  const handleSelect = useCallback(
    (token: Token) => {
      onSelect(token)
      setOpen(false)
      setSearch('')
      setSelectedChain(null)
    },
    [onSelect],
  )

  const handleOpenChange = useCallback((v: boolean) => {
    setOpen(v)
    if (!v) {
      setSearch('')
      setSelectedChain(null)
    }
  }, [])

  // Build sorted chain list
  const chains = useMemo(() => {
    const present = new Set<string>()
    for (const t of tokens) present.add(t.chain)

    const orderIndex = new Map(CHAIN_ORDER.map((c, i) => [c, i]))
    return Array.from(present).sort((a, b) => {
      const ai = orderIndex.get(a) ?? 999
      const bi = orderIndex.get(b) ?? 999
      if (ai !== bi) return ai - bi
      return a.localeCompare(b)
    })
  }, [tokens])

  const popularTokens = useMemo(
    () =>
      POPULAR_SYMBOLS.map((sym) =>
        tokens.find((t) => t.ticker.toUpperCase() === sym),
      ).filter(Boolean) as Token[],
    [tokens],
  )

  const filteredTokens = useMemo(() => {
    let result = tokens

    if (selectedChain) {
      result = result.filter((t) => t.chain === selectedChain)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.ticker.toLowerCase().includes(q) ||
          (t.name ?? '').toLowerCase().includes(q) ||
          t.chain.toLowerCase().includes(q) ||
          (t.address ?? '').toLowerCase().includes(q),
      )
    }

    return result
  }, [tokens, selectedChain, search])

  const isSearching = !!search.trim()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-2.5 shrink-0 h-auto py-1.5 px-2.5 pr-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] transition-colors cursor-pointer"
          />
        }
      >
        {isLoading ? (
          <>
            <Skeleton className="size-8 rounded-full" />
            <div className="flex flex-col items-start gap-1 min-w-0">
              <Skeleton className="h-3.5 w-10 rounded" />
              <Skeleton className="h-3 w-14 rounded" />
            </div>
          </>
        ) : selectedToken ? (
          <>
            <TokenIconWithChain token={selectedToken} size={32} />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-bold truncate leading-tight">{selectedToken.ticker}</span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                {getChainMeta(selectedToken.chain).name}
              </span>
            </div>
          </>
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">Select token</span>
        )}
        <IconChevronDown className="size-4 text-muted-foreground/60 shrink-0" />
      </DialogTrigger>

      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden flex flex-col max-h-[min(85vh,600px)]">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle>{label ?? 'Select token'}</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50 pointer-events-none" />
            <input
              placeholder="Search name or address"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full h-10 pl-9 pr-3 text-sm rounded-full bg-muted/30 border border-border/40 placeholder:text-muted-foreground/40 outline-none focus:border-emerald-600/40 focus:ring-1 focus:ring-emerald-600/20 transition-all"
            />
          </div>
        </div>

        {/* Network filter */}
        {!isSearching && chains.length > 1 && (
          <div className="px-5 pb-2 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Network:</span>
              <span className="text-[11px] font-medium text-foreground">
                {selectedChain ? getChainMeta(selectedChain).name : 'All Networks'}
              </span>
            </div>
            <NetworkBar
              chains={chains}
              selected={selectedChain}
              onSelect={setSelectedChain}
            />
          </div>
        )}

        {/* Popular tokens */}
        {!isSearching && popularTokens.length > 0 && (
          <div className="px-5 pb-3">
            <span className="text-[11px] text-muted-foreground mb-1.5 block">Popular tokens</span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {popularTokens.map((token) => (
                <motion.button
                  key={token.identifier}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  disabled={disabledToken?.identifier === token.identifier}
                  onClick={() => handleSelect(token)}
                  className="shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border border-border/60 text-xs font-medium transition-colors hover:bg-emerald-600/10 hover:border-emerald-600/30 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <TokenIconWithChain token={token} size={20} showChainBadge={false} />
                  <span>{token.ticker}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-border/60" />

        {/* Token list */}
        {isLoading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-2">
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
            <p className="text-sm">No results found</p>
          </div>
        ) : (
          <VirtualTokenList
            tokens={filteredTokens}
            onSelect={handleSelect}
            disabledToken={disabledToken}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export { TokenIcon, TokenIconWithChain }
