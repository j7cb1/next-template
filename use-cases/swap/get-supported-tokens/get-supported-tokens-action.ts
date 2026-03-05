'use server'

import { getLogger, LoggerModule } from '@/services/logger/logger'
import { getSupportedTokensUseCase } from './get-supported-tokens-use-case'

export async function getSupportedTokensAction() {
  const log = getLogger({ module: LoggerModule.App })

  return getSupportedTokensUseCase({ log })
}
