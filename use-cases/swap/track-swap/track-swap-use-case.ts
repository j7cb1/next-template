import { z } from 'zod'
import { Logger } from 'pino'
import { createResultSchema, ZodFunctionResult } from '@/utilities/function-result'
import { transactionStatusSchema } from '@/repositories/swap/swap-schema'
import { captureError } from '@/utilities/error'

export const TrackSwapUseCaseArgsSchema = z.object({
  hash: z.string().min(1),
  chainId: z.string().min(1),
  log: z.custom<Logger | undefined>(),
})

export const TrackSwapUseCaseResultSchema = createResultSchema(
  transactionStatusSchema,
  z.object({ message: z.string() }).passthrough(),
)

export type TrackSwapUseCaseArgs = z.infer<typeof TrackSwapUseCaseArgsSchema>
export type TrackSwapUseCaseResult = ZodFunctionResult<typeof TrackSwapUseCaseResultSchema>

export async function trackSwapUseCase({
  hash,
  chainId,
  log,
}: TrackSwapUseCaseArgs): Promise<TrackSwapUseCaseResult> {
  const { success, error } = TrackSwapUseCaseResultSchema

  try {
    log?.info({ hash, chainId }, 'Tracking swap transaction')

    const response = await fetch('https://api.swapkit.dev/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.SWAPKIT_API_KEY ?? '',
      },
      body: JSON.stringify({ hash, chainId }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      log?.error({ status: response.status, body }, 'SwapKit track API returned error')

      let message = `Tracking failed: ${response.statusText}`
      try {
        const parsed = JSON.parse(body)
        if (parsed.message) message = parsed.message
      } catch {
        // body wasn't JSON, keep default message
      }

      return error({ message })
    }

    const data = await response.json()
    const parsed = transactionStatusSchema.safeParse(data)

    if (!parsed.success) {
      log?.error({ issues: parsed.error.issues.slice(0, 3) }, 'Track response did not match schema')
      return error({ message: 'Unexpected tracking response format' })
    }

    log?.info({ status: parsed.data.status }, 'Swap status received')

    return success(parsed.data)
  } catch (err) {
    log?.error({ err }, 'Error tracking swap transaction')
    captureError(err)
    return error({ message: 'Failed to track swap transaction' })
  }
}
