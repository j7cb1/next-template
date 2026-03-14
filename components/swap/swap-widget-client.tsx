'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useAccount, useWalletClient, useSwitchChain } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { WalletStatus } from './wallet-status'
import { TokenInput } from './token-input'
import { SwapDirectionButton } from './swap-direction-button'
import { SwapDetails } from './swap-details'
import { toast } from 'sonner'
import { useSupportedTokens } from '@/use-cases/swap/get-supported-tokens/use-supported-tokens'
import { useSwapQuote } from '@/use-cases/swap/get-swap-quote/use-swap-quote'
import { useExecuteSwap } from '@/use-cases/swap/execute-swap/use-execute-swap'
import { useTrackSwap } from '@/use-cases/swap/track-swap/use-track-swap'
import { useWalletBalance } from '@/hooks/use-wallet-balance'
import { CHAIN_MAP } from '@/utilities/chain-map'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/utilities/shadcn'
import { useFormatCurrency } from '@/hooks/use-format-currency'
import type { Token, TransactionStatusValue } from '@/repositories/swap/swap-schema'
import { IconWallet } from '@tabler/icons-react'

const DEFAULT_FROM = 'ETH.ETH'
const DEFAULT_TO = 'ETH.USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

const BUTTON_SHADOW = '0 1px 3px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.12)'

const BUTTON_PULSE = {
  boxShadow: [
    BUTTON_SHADOW,
    `0 0 20px rgba(16,185,129,0.18), 0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.12)`,
    BUTTON_SHADOW,
  ],
}

const BUTTON_PULSE_TRANSITION = {
  duration: 3,
  repeat: Infinity,
  ease: 'easeInOut' as const,
}

const BUTTON_HOVER = {
  scale: 1.015,
  boxShadow: '0 0 24px rgba(16,185,129,0.25), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
}

const BUTTON_TAP = {
  scale: 0.985,
  boxShadow: '0 1px 1px rgba(0,0,0,0.1), inset 0 2px 4px rgba(0,0,0,0.15)',
}

export function SwapWidgetClient() {
  const { address: walletAddress, isConnected, chainId: walletChainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()
  const { openConnectModal } = useConnectModal()
  const prefersReducedMotion = useReducedMotion()
  const formatCurrency = useFormatCurrency()
  const tokensQuery = useSupportedTokens()

  const [fromTokenState, setFromToken] = useState<Token | null>(null)
  const [toTokenState, setToToken] = useState<Token | null>(null)
  const [amount, setAmount] = useState('')
  const [flipped, setFlipped] = useState(false)
  const [slippage, setSlippage] = useState(3)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txChainId, setTxChainId] = useState<string | null>(null)
  const [statusAnnouncement, setStatusAnnouncement] = useState('')

  const tokens = useMemo(
    () => (Array.isArray(tokensQuery.data) ? tokensQuery.data : []),
    [tokensQuery.data],
  )

  // Compute defaults from loaded token list; state overrides when user selects
  const defaultFromToken = useMemo(
    () => tokens.find((t) => t.identifier === DEFAULT_FROM) ?? null,
    [tokens],
  )
  const defaultToToken = useMemo(
    () => tokens.find((t) => t.identifier === DEFAULT_TO) ?? null,
    [tokens],
  )
  const fromToken = fromTokenState ?? defaultFromToken
  const toToken = toTokenState ?? defaultToToken

  // Debounce the sell amount so we don't spam the quote API on every keystroke
  const debouncedAmount = useDebounce(amount, 500)

  // Fetch quote when we have both tokens and a debounced amount
  const quoteQuery = useSwapQuote({
    sellAsset: fromToken?.identifier,
    buyAsset: toToken?.identifier,
    sellAmount: debouncedAmount,
    slippage,
  })

  // Extract best route data
  const bestRoute = quoteQuery.data?.routes?.[0]
  const receiveAmount = bestRoute?.expectedBuyAmount ?? ''

  // Fiat values from quote meta.assets, converted to selected currency
  const sellFiat = useMemo(() => {
    const assets = bestRoute?.meta?.assets
    if (!assets) return undefined
    const sellMeta = assets.find((a) => a.asset === fromToken?.identifier)
    const price = sellMeta?.price
    const qty = parseFloat(amount)
    if (!price || !qty) return undefined
    return formatCurrency(price * qty)
  }, [bestRoute, amount, fromToken, formatCurrency])

  const buyFiat = useMemo(() => {
    const assets = bestRoute?.meta?.assets
    if (!assets) return undefined
    const buyMeta = assets.find((a) => a.asset === toToken?.identifier)
    const price = buyMeta?.price
    const qty = parseFloat(receiveAmount)
    if (!price || !qty) return undefined
    return formatCurrency(price * qty)
  }, [bestRoute, receiveAmount, toToken, formatCurrency])

  const isQuoteLoading = quoteQuery.isFetching && !!debouncedAmount && parseFloat(debouncedAmount) > 0

  // Surface quote errors on the output field instead of showing silent "0.0"
  const quoteError = useMemo(() => {
    if (!quoteQuery.isError || isQuoteLoading) return null
    if (!debouncedAmount || parseFloat(debouncedAmount) <= 0) return null
    return quoteQuery.error?.message || 'No route available'
  }, [quoteQuery.isError, quoteQuery.error, isQuoteLoading, debouncedAmount])

  // Balance check for sell token
  const balanceQuery = useWalletBalance(walletAddress, fromToken)
  const insufficientBalance = useMemo(() => {
    const bal = balanceQuery.data
    if (!bal || !amount) return false
    return parseFloat(amount) > parseFloat(bal)
  }, [balanceQuery.data, amount])

  // Swap execution
  const swapMutation = useExecuteSwap()
  const trackQuery = useTrackSwap(txHash, txChainId)

  // Track status changes via toasts
  const prevStatusRef = useRef<TransactionStatusValue | null>(null)
  useEffect(() => {
    const status = trackQuery.data?.status
    if (!status || status === prevStatusRef.current) return
    prevStatusRef.current = status

    switch (status) {
      case 'pending':
        toast.loading('Transaction pending...', { id: 'swap-status' })
        setStatusAnnouncement('Transaction pending')
        break
      case 'swapping':
        toast.loading('Swap in progress...', { id: 'swap-status' })
        setStatusAnnouncement('Swap in progress')
        break
      case 'completed':
        toast.success('Swap complete!', { id: 'swap-status' })
        setStatusAnnouncement('Swap complete')
        break
      case 'failed':
        toast.error('Swap failed', { id: 'swap-status' })
        setStatusAnnouncement('Swap failed')
        break
      case 'refunded':
        toast.error('Swap refunded', { id: 'swap-status' })
        setStatusAnnouncement('Swap refunded')
        break
    }
  }, [trackQuery.data?.status])

  async function handleSwap() {
    if (!bestRoute || !walletAddress || !walletClient || !fromToken || swapMutation.isPending) return

    const requiredChain = CHAIN_MAP[fromToken.chain]
    if (requiredChain && walletChainId !== requiredChain.id) {
      try {
        toast.loading('Switching network...', { id: 'swap-status' })
        setStatusAnnouncement('Switching network')
        await switchChainAsync({ chainId: requiredChain.id })
      } catch {
        toast.error('Network switch rejected', { id: 'swap-status' })
        setStatusAnnouncement('Network switch rejected')
        return
      }
    }

    toast.loading('Building transaction...', { id: 'swap-status' })
    setStatusAnnouncement('Building transaction')

    swapMutation.mutate(
      {
        routeId: bestRoute.routeId,
        sourceAddress: walletAddress,
        destinationAddress: walletAddress,
        walletClient,
        sellChain: fromToken.chain,
      },
      {
        onSuccess: ({ txHash: hash, chainId }) => {
          setTxHash(hash)
          setTxChainId(chainId)
          toast.success('Transaction submitted!', { id: 'swap-status' })
          setStatusAnnouncement('Transaction submitted')
        },
        onError: (err) => {
          toast.error(err.message || 'Swap failed', { id: 'swap-status' })
          setStatusAnnouncement(err.message || 'Swap failed')
        },
      },
    )
  }

  const handleSwapDirection = useCallback(() => {
    setFromToken(toToken)
    setToToken(fromToken)
    setAmount('')
    setFlipped((prev) => !prev)
  }, [fromToken, toToken])

  const isSwapping = swapMutation.isPending
  const isTracking = !!txHash && trackQuery.data?.status !== 'completed' && trackQuery.data?.status !== 'failed' && trackQuery.data?.status !== 'refunded'
  const canSwap = isConnected && walletClient && fromToken && toToken && parseFloat(amount) > 0 && !!receiveAmount && !isSwapping && !isTracking && !insufficientBalance

  const actionLabel = useMemo(() => {
    if (!isConnected) return null
    if (isSwapping) return 'Swapping'
    if (isTracking) return 'Pending'
    if (!fromToken || !toToken) return 'Select tokens'
    if (!amount || parseFloat(amount) <= 0) return 'Enter amount'
    if (isQuoteLoading) return 'Fetching quote'
    if (insufficientBalance) return 'Insufficient balance'
    if (quoteQuery.isError) return 'No route found'
    return 'Swap'
  }, [isConnected, fromToken, toToken, amount, isQuoteLoading, quoteQuery.isError, isSwapping, isTracking, insufficientBalance])

  const isActiveLoading = isSwapping || isTracking
  const isInactiveLoading = isQuoteLoading
  const isButtonLoading = isActiveLoading || isInactiveLoading
  const isButtonActive = canSwap || isActiveLoading

  return (
    <>
    <div className="rounded-3xl bg-card/90 backdrop-blur-sm text-card-foreground overflow-hidden border border-border shadow-[0_0_60px_rgba(5,150,105,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-end px-5 pt-5 pb-2">
        <WalletStatus />
      </div>

      {/* Token inputs with bridging swap button */}
      <div className="px-3 pb-1">
        <div className="flex flex-col gap-0">
          <TokenInput
            label="From"
            token={fromToken}
            onTokenSelect={setFromToken}
            amount={amount}
            onAmountChange={setAmount}
            tokens={tokens}
            disabledToken={toToken}
            isLoadingTokens={tokensQuery.isLoading}
            isLoadingQuote={isQuoteLoading}
            usdValue={quoteError ? undefined : sellFiat}
          />

          <SwapDirectionButton
            onClick={handleSwapDirection}
            flipped={flipped}
          />

          <TokenInput
            label="To"
            token={toToken}
            onTokenSelect={setToToken}
            amount={receiveAmount}
            readOnly
            tokens={tokens}
            disabledToken={fromToken}
            isLoadingTokens={tokensQuery.isLoading}
            isLoadingQuote={isQuoteLoading}
            usdValue={buyFiat}
            error={quoteError}
          />
        </div>
      </div>

      {/* Action */}
      <div className="px-3 pt-3 pb-4">
        {!isConnected ? (
          <motion.button
            type="button"
            onClick={() => openConnectModal?.()}
            className="relative w-full h-12 rounded-2xl text-sm font-bold cursor-pointer overflow-hidden bg-gradient-to-b from-emerald-400 to-emerald-600 text-white focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none"
            animate={BUTTON_PULSE}
            whileHover={BUTTON_HOVER}
            whileTap={BUTTON_TAP}
            transition={prefersReducedMotion ? { duration: 0 } : BUTTON_PULSE_TRANSITION}
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent rounded-t-2xl pointer-events-none" />
            <span className="relative flex items-center justify-center gap-2">
              <IconWallet className="size-4" />
              Connect Wallet
            </span>
          </motion.button>
        ) : (
          <motion.button
            type="button"
            disabled={!canSwap}
            onClick={handleSwap}
            className={cn(
              'relative w-full h-12 rounded-2xl text-sm font-bold overflow-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none',
              isButtonActive
                ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white'
                : 'bg-muted/80 text-muted-foreground cursor-not-allowed border border-border',
              canSwap && 'cursor-pointer',
              isButtonLoading && 'cursor-wait',
            )}
            animate={
              isButtonActive
                ? { boxShadow: BUTTON_SHADOW }
                : { boxShadow: 'none', scale: 1 }
            }
            whileHover={canSwap ? BUTTON_HOVER : undefined}
            whileTap={canSwap ? BUTTON_TAP : undefined}
            transition={isButtonActive && !prefersReducedMotion ? BUTTON_PULSE_TRANSITION : { duration: 0 }}
          >
            {isButtonActive && (
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent rounded-t-2xl pointer-events-none" />
            )}
            {isButtonLoading && (
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{
                  background: isActiveLoading
                    ? 'linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.4) 55%, transparent 80%)'
                    : 'linear-gradient(100deg, transparent 20%, rgba(128,128,128,0.15) 45%, rgba(128,128,128,0.2) 50%, rgba(128,128,128,0.15) 55%, transparent 80%)',
                }}
                animate={{ x: ['-120%', '120%'] }}
                transition={{ duration: 1, repeat: Infinity, ease: [0.4, 0, 0.2, 1], repeatDelay: 0.15 }}
              />
            )}
            <span className="relative">{actionLabel}</span>
          </motion.button>
        )}
      </div>
    </div>
    {fromToken && toToken && parseFloat(amount) > 0 && !quoteError ? (
      <SwapDetails
        route={bestRoute ?? null}
        fromToken={fromToken}
        toToken={toToken}
        sellAmount={amount}
        slippage={slippage}
        onSlippageChange={setSlippage}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        isLoading={isQuoteLoading}
      />
    ) : (
      <div className="mt-3 px-2 h-[30px]" />
    )}
    {/* Visually hidden live region for screen reader announcements of swap status */}
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {statusAnnouncement}
    </div>
    </>
  )
}
