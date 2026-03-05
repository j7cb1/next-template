import { z } from 'zod'
import { Logger } from 'pino'
import { createResultSchema, ZodFunctionResult } from '@/utilities/function-result'
import { quoteResponseSchema } from '@/repositories/swap/swap-schema'
import { captureError } from '@/utilities/error'

export const GetSwapQuoteUseCaseArgsSchema = z.object({
  sellAsset: z.string().min(1),
  buyAsset: z.string().min(1),
  sellAmount: z.string().min(1),
  slippage: z.number().min(0).max(50).default(3),
  log: z.custom<Logger | undefined>(),
})

export const GetSwapQuoteUseCaseResultSchema = createResultSchema(
  quoteResponseSchema,
  z.object({ message: z.string() }).passthrough(),
)

export type GetSwapQuoteUseCaseArgs = z.infer<typeof GetSwapQuoteUseCaseArgsSchema>
export type GetSwapQuoteUseCaseResult = ZodFunctionResult<typeof GetSwapQuoteUseCaseResultSchema>

export async function getSwapQuoteUseCase({
  sellAsset,
  buyAsset,
  sellAmount,
  slippage = 3,
  log,
}: GetSwapQuoteUseCaseArgs): Promise<GetSwapQuoteUseCaseResult> {
  const { success, error } = GetSwapQuoteUseCaseResultSchema

  try {
    log?.info({ sellAsset, buyAsset, sellAmount, slippage }, 'Fetching swap quote')

    const response = await fetch('https://api.swapkit.dev/v3/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.SWAPKIT_API_KEY ?? '',
      },
      body: JSON.stringify({ sellAsset, buyAsset, sellAmount, slippage }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      log?.error({ status: response.status, body }, 'SwapKit quote API returned error')

      let message = `Quote failed: ${response.statusText}`
      try {
        const parsed = JSON.parse(body)
        if (parsed.message) message = parsed.message
      } catch {
        // body wasn't JSON, keep default message
      }

      return error({ message })
    }

    const data = await response.json()
    const parsed = quoteResponseSchema.safeParse(data)

    if (!parsed.success) {
      log?.error({ issues: parsed.error.issues.slice(0, 3) }, 'Quote response did not match schema')
      return error({ message: 'Unexpected quote response format' })
    }

    if (parsed.data.routes.length === 0) {
      return error({ message: parsed.data.error ?? 'No routes available for this swap' })
    }

    log?.info(
      { routes: parsed.data.routes.length, bestAmount: parsed.data.routes[0].expectedBuyAmount },
      'Quote received',
    )

    return success(parsed.data)
  } catch (err) {
    log?.error({ err }, 'Error fetching swap quote')
    captureError(err)
    return error({ message: 'Failed to fetch swap quote' })
  }
}
