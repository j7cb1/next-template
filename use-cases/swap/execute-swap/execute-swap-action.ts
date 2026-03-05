'use server'

import { getLogger, LoggerModule } from '@/services/logger/logger'
import { executeSwapUseCase } from './execute-swap-use-case'

export async function executeSwapAction(params: {
  routeId: string
  sourceAddress: string
  destinationAddress: string
}) {
  const log = getLogger({ module: LoggerModule.App })

  return executeSwapUseCase({
    ...params,
    log,
  })
}
