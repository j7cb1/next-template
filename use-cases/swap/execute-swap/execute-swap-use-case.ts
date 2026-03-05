import { z } from 'zod'
import { Logger } from 'pino'
import { createResultSchema, ZodFunctionResult } from '@/utilities/function-result'
import { swapResponseSchema } from '@/repositories/swap/swap-schema'
import { captureError } from '@/utilities/error'

export const ExecuteSwapUseCaseArgsSchema = z.object({
  routeId: z.string().min(1),
  sourceAddress: z.string().min(1),
  destinationAddress: z.string().min(1),
  log: z.custom<Logger | undefined>(),
})

export const ExecuteSwapUseCaseResultSchema = createResultSchema(
  swapResponseSchema,
  z.object({ message: z.string() }).passthrough(),
)

export type ExecuteSwapUseCaseArgs = z.infer<typeof ExecuteSwapUseCaseArgsSchema>
export type ExecuteSwapUseCaseResult = ZodFunctionResult<typeof ExecuteSwapUseCaseResultSchema>

export async function executeSwapUseCase({
  routeId,
  sourceAddress,
  destinationAddress,
  log,
}: ExecuteSwapUseCaseArgs): Promise<ExecuteSwapUseCaseResult> {
  const { success, error } = ExecuteSwapUseCaseResultSchema

  try {
    log?.info({ routeId, sourceAddress, destinationAddress }, 'Building swap transaction')

    const response = await fetch('https://api.swapkit.dev/v3/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.SWAPKIT_API_KEY ?? '',
      },
      body: JSON.stringify({ routeId, sourceAddress, destinationAddress }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      log?.error({ status: response.status, body }, 'SwapKit swap API returned error')

      // Extract human-readable message from JSON error body
      let message = `Swap failed: ${response.statusText}`
      try {
        const parsed = JSON.parse(body)
        if (parsed.message) message = parsed.message
      } catch {
        // body wasn't JSON, keep default message
      }

      return error({ message })
    }

    const data = await response.json()
    const parsed = swapResponseSchema.safeParse(data)

    if (!parsed.success) {
      log?.error({ issues: parsed.error.issues.slice(0, 3) }, 'Swap response did not match schema')
      return error({ message: 'Unexpected swap response format' })
    }

    log?.info({ txType: parsed.data.txType }, 'Swap transaction built')

    return success(parsed.data)
  } catch (err) {
    log?.error({ err }, 'Error building swap transaction')
    captureError(err)
    return error({ message: 'Failed to build swap transaction' })
  }
}
