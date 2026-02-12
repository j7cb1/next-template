'use client'

import { useState, useMemo, useCallback } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { Button } from '@/components/ui/button'
import { WalletStatus } from './wallet-status'
import { TokenInput } from './token-input'
import { SwapDirectionButton } from './swap-direction-button'
import { useSupportedTokens } from '@/use-cases/swap/get-supported-tokens/use-supported-tokens'
import type { Token } from '@/repositories/swap/swap-schema'
import { IconWallet } from '@tabler/icons-react'

export function SwapWidgetClient() {
  const { primaryWallet, setShowAuthFlow } = useDynamicContext()
  const tokensQuery = useSupportedTokens()

  const [fromToken, setFromToken] = useState<Token | null>(null)
  const [toToken, setToToken] = useState<Token | null>(null)
  const [amount, setAmount] = useState('')
  const [flipped, setFlipped] = useState(false)

  const walletAddress = primaryWallet?.address
  const tokens = useMemo(
    () => (Array.isArray(tokensQuery.data) ? tokensQuery.data : []),
    [tokensQuery.data],
  )

  const handleSwapDirection = useCallback(() => {
    setFromToken(toToken)
    setToToken(fromToken)
    setAmount('')
    setFlipped((prev) => !prev)
  }, [fromToken, toToken])

  const canSwap = walletAddress && fromToken && toToken && parseFloat(amount) > 0

  const actionLabel = useMemo(() => {
    if (!walletAddress) return null
    if (!fromToken || !toToken) return 'Select tokens'
    if (!amount || parseFloat(amount) <= 0) return 'Enter amount'
    return 'Swap'
  }, [walletAddress, fromToken, toToken, amount])

  return (
    <div className="rounded-xl border border-emerald-600/20 bg-card/80 backdrop-blur-sm text-card-foreground overflow-hidden shadow-[0_0_40px_rgba(5,150,105,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-end px-5 pt-5 pb-4">
        <WalletStatus />
      </div>

      {/* Token inputs with bridging swap button */}
      <div className="px-4 pb-1">
        <div className="flex flex-col">
          <TokenInput
            label="You pay"
            token={fromToken}
            onTokenSelect={setFromToken}
            amount={amount}
            onAmountChange={setAmount}
            tokens={tokens}
            disabledToken={toToken}
            isLoadingTokens={tokensQuery.isLoading}
          />

          <SwapDirectionButton
            onClick={handleSwapDirection}
            flipped={flipped}
          />

          <TokenInput
            label="You receive"
            token={toToken}
            onTokenSelect={setToToken}
            amount=""
            readOnly
            tokens={tokens}
            disabledToken={fromToken}
            isLoadingTokens={tokensQuery.isLoading}
          />
        </div>
      </div>

      {/* Action */}
      <div className="px-4 pt-3 pb-4">
        {!walletAddress ? (
          <Button
            className="w-full h-11 text-sm font-semibold cursor-pointer"
            onClick={() => setShowAuthFlow(true)}
          >
            <IconWallet className="size-4" />
            Connect Wallet
          </Button>
        ) : (
          <Button
            className="w-full h-11 text-sm font-semibold"
            disabled={!canSwap}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
