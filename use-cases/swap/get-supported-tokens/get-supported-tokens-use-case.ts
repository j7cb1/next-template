import { z } from 'zod'
import { Logger } from 'pino'
import { createResultSchema, ZodFunctionResult } from '@/utilities/function-result'
import { tokenSchema, tokenProviderSchema, type Token } from '@/repositories/swap/swap-schema'
import { captureError } from '@/utilities/error'

export const GetSupportedTokensUseCaseArgsSchema = z.object({
  log: z.custom<Logger | undefined>(),
})

export const GetSupportedTokensUseCaseResultSchema = createResultSchema(
  z.array(tokenSchema),
  z.object({ message: z.string() }).passthrough()
)

export type GetSupportedTokensUseCaseArgs = z.infer<typeof GetSupportedTokensUseCaseArgsSchema>
export type GetSupportedTokensUseCaseResult = ZodFunctionResult<typeof GetSupportedTokensUseCaseResultSchema>

// In-memory cache for the token list (~3.5MB, too large for Next.js data cache)
const TOKEN_CACHE_TTL = 60 * 60 * 1000 // 1 hour
let tokenCache: { data: Token[]; timestamp: number } | null = null

export async function getSupportedTokensUseCase({
  log,
}: GetSupportedTokensUseCaseArgs): Promise<GetSupportedTokensUseCaseResult> {
  const { success, error } = GetSupportedTokensUseCaseResultSchema

  try {
    if (tokenCache && Date.now() - tokenCache.timestamp < TOKEN_CACHE_TTL) {
      log?.info({ count: tokenCache.data.length }, 'Returning cached supported tokens')
      return success(tokenCache.data)
    }

    log?.info('Fetching supported tokens from SwapKit API')

    const response = await fetch('https://api.swapkit.dev/tokens', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.SWAPKIT_API_KEY ?? '',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      log?.error({ status: response.status }, 'SwapKit tokens API returned error')
      return error({ message: `Failed to fetch tokens: ${response.statusText}` })
    }

    const data = await response.json()

    // API returns an array of provider groups, each with a nested tokens array
    const providers = z.array(tokenProviderSchema).safeParse(data)
    if (!providers.success) {
      log?.error({ issues: providers.error.issues.slice(0, 3) }, 'Token response did not match schema')
      return error({ message: 'Unexpected token response format from SwapKit API' })
    }

    // Flatten and deduplicate by identifier (same token appears across providers)
    const seen = new Set<string>()
    const result: Token[] = []
    for (const provider of providers.data) {
      for (const token of provider.tokens) {
        if (!seen.has(token.identifier)) {
          seen.add(token.identifier)
          result.push(token)
        }
      }
    }

    tokenCache = { data: result, timestamp: Date.now() }
    log?.info({ count: result.length }, 'Retrieved and cached supported tokens')
    return success(result)
  } catch (err) {
    // Serve stale cache on fetch failure
    if (tokenCache) {
      log?.warn('Fetch failed, returning stale cached tokens')
      return success(tokenCache.data)
    }
    log?.error({ err }, 'Error fetching supported tokens')
    captureError(err)
    return error({ message: 'Failed to fetch supported tokens' })
  }
}
