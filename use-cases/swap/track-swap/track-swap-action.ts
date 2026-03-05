'use server'

import { getLogger, LoggerModule } from '@/services/logger/logger'
import { trackSwapUseCase } from './track-swap-use-case'

export async function trackSwapAction(params: {
  hash: string
  chainId: string
}) {
  const log = getLogger({ module: LoggerModule.App })

  return trackSwapUseCase({
    ...params,
    log,
  })
}
