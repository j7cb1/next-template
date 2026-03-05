'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { isEthereumWallet } from '@dynamic-labs/ethereum'
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
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/utilities/shadcn'
import type { Token, TransactionStatusValue } from '@/repositories/swap/swap-schema'
import { IconWallet } from '@tabler/icons-react'

const DEFAULT_FROM = 'ETH.ETH'
const DEFAULT_TO = 'ETH.USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

function formatUsd(value: number): string {
  if (value < 0.01) return '<$0.01'
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function SwapWidgetClient() {
  const { primaryWallet, setShowAuthFlow } = useDynamicContext()
  const tokensQuery = useSupportedTokens()

  const [fromTokenState, setFromToken] = useState<Token | null>(null)
  const [toTokenState, setToToken] = useState<Token | null>(null)
  const [amount, setAmount] = useState('')
  const [flipped, setFlipped] = useState(false)
  const [slippage, setSlippage] = useState(3)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txChainId, setTxChainId] = useState<string | null>(null)

  const walletAddress = primaryWallet?.address
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

  // USD values from quote meta.assets
  const sellUsd = useMemo(() => {
    const assets = bestRoute?.meta?.assets
    if (!assets) return undefined
    const sellMeta = assets.find((a) => a.asset === fromToken?.identifier)
    const price = sellMeta?.price
    const qty = parseFloat(amount)
    if (!price || !qty) return undefined
    return formatUsd(price * qty)
  }, [bestRoute, amount, fromToken])

  const buyUsd = useMemo(() => {
    const assets = bestRoute?.meta?.assets
    if (!assets) return undefined
    const buyMeta = assets.find((a) => a.asset === toToken?.identifier)
    const price = buyMeta?.price
    const qty = parseFloat(receiveAmount)
    if (!price || !qty) return undefined
    return formatUsd(price * qty)
  }, [bestRoute, receiveAmount, toToken])

  const isQuoteLoading = quoteQuery.isFetching && !!debouncedAmount && parseFloat(debouncedAmount) > 0

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
        break
      case 'swapping':
        toast.loading('Swap in progress...', { id: 'swap-status' })
        break
      case 'completed':
        toast.success('Swap complete!', { id: 'swap-status' })
        break
      case 'failed':
        toast.error('Swap failed', { id: 'swap-status' })
        break
      case 'refunded':
        toast.error('Swap refunded', { id: 'swap-status' })
        break
    }
  }, [trackQuery.data?.status])

  async function handleSwap() {
    if (!bestRoute || !primaryWallet || !fromToken || swapMutation.isPending) return

    if (!isEthereumWallet(primaryWallet)) {
      toast.error('Wallet not supported')
      return
    }

    const walletClient = await primaryWallet.getWalletClient()
    if (!walletClient) {
      toast.error('Wallet not available')
      return
    }

    toast.loading('Building transaction...', { id: 'swap-status' })

    swapMutation.mutate(
      {
        routeId: bestRoute.routeId,
        sourceAddress: primaryWallet.address,
        destinationAddress: primaryWallet.address,
        walletClient,
        sellChain: fromToken.chain,
      },
      {
        onSuccess: ({ txHash: hash, chainId }) => {
          setTxHash(hash)
          setTxChainId(chainId)
          toast.success('Transaction submitted!', { id: 'swap-status' })
        },
        onError: (err) => {
          toast.error(err.message || 'Swap failed', { id: 'swap-status' })
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
  const canSwap = walletAddress && fromToken && toToken && parseFloat(amount) > 0 && !!receiveAmount && !isSwapping && !isTracking && !insufficientBalance

  const actionLabel = useMemo(() => {
    if (!walletAddress) return null
    if (isSwapping) return 'Swapping...'
    if (isTracking) return 'Pending...'
    if (!fromToken || !toToken) return 'Select tokens'
    if (!amount || parseFloat(amount) <= 0) return 'Enter amount'
    if (insufficientBalance) return 'Insufficient balance'
    if (isQuoteLoading) return 'Fetching quote...'
    if (quoteQuery.isError) return 'No route found'
    return 'Swap'
  }, [walletAddress, fromToken, toToken, amount, isQuoteLoading, quoteQuery.isError, isSwapping, isTracking, insufficientBalance])

  return (
    <>
    <div className="rounded-3xl bg-card/90 backdrop-blur-sm text-card-foreground overflow-hidden border border-white/[0.08] shadow-[0_0_60px_rgba(5,150,105,0.06)]">
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
            usdValue={sellUsd}
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
            usdValue={buyUsd}
          />
        </div>
      </div>

      {/* Action */}
      <div className="px-3 pt-3 pb-4">
        {!walletAddress ? (
          <motion.button
            type="button"
            onClick={() => setShowAuthFlow(true)}
            className="relative w-full h-12 rounded-2xl text-sm font-bold cursor-pointer overflow-hidden bg-emerald-500 text-white"
            animate={{
              boxShadow: [
                '0 0 20px rgba(16,185,129,0.20), 0 4px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.10)',
                '0 0 28px rgba(16,185,129,0.30), 0 4px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.10)',
                '0 0 20px rgba(16,185,129,0.20), 0 4px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.10)',
              ],
            }}
            whileHover={{
              backgroundColor: 'rgb(52, 211, 153)',
              boxShadow: '0 0 40px rgba(16,185,129,0.40), 0 6px 12px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
            whileTap={{
              backgroundColor: 'rgb(5, 150, 105)',
              boxShadow: '0 0 12px rgba(16,185,129,0.15), 0 1px 2px rgba(0,0,0,0.10), inset 0 2px 4px rgba(0,0,0,0.25)',
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Inner light bar */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.10] to-transparent rounded-t-2xl pointer-events-none" />
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
              'relative w-full h-12 rounded-2xl text-sm font-bold overflow-hidden',
              canSwap
                ? 'bg-emerald-500 text-white cursor-pointer'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
            animate={canSwap ? {
              boxShadow: [
                '0 0 20px rgba(16,185,129,0.20), 0 4px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.10)',
                '0 0 28px rgba(16,185,129,0.30), 0 4px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.10)',
                '0 0 20px rgba(16,185,129,0.20), 0 4px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.10)',
              ],
            } : { boxShadow: 'none' }}
            whileHover={canSwap ? {
              backgroundColor: 'rgb(52, 211, 153)',
              boxShadow: '0 0 40px rgba(16,185,129,0.40), 0 6px 12px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.15)',
            } : undefined}
            whileTap={canSwap ? {
              backgroundColor: 'rgb(5, 150, 105)',
              boxShadow: '0 0 12px rgba(16,185,129,0.15), 0 1px 2px rgba(0,0,0,0.10), inset 0 2px 4px rgba(0,0,0,0.25)',
            } : undefined}
            transition={{ duration: 2.5, repeat: canSwap ? Infinity : 0, ease: 'easeInOut' }}
          >
            {canSwap && (
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.10] to-transparent rounded-t-2xl pointer-events-none" />
            )}
            <span className="relative">{actionLabel}</span>
          </motion.button>
        )}
      </div>
    </div>
    {fromToken && toToken && parseFloat(amount) > 0 ? (
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
    </>
  )
}
