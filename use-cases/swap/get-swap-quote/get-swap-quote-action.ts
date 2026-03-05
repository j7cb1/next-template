'use server'

import { getLogger, LoggerModule } from '@/services/logger/logger'
import { getSwapQuoteUseCase } from './get-swap-quote-use-case'

export async function getSwapQuoteAction(params: {
  sellAsset: string
  buyAsset: string
  sellAmount: string
  slippage?: number
}) {
  const log = getLogger({ module: LoggerModule.App })

  return getSwapQuoteUseCase({
    ...params,
    slippage: params.slippage ?? 3,
    log,
  })
}
