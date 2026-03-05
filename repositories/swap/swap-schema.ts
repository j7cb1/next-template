import { z } from 'zod'

// Token from SwapKit API — no .passthrough(), strips extra fields to keep payload lean
export const tokenSchema = z.object({
  identifier: z.string(),
  chain: z.string(),
  ticker: z.string(),
  name: z.string().optional(),
  decimals: z.number(),
  logoURI: z.string().optional(),
  address: z.string().optional(),
})

export type Token = z.infer<typeof tokenSchema>

// Provider group wrapping tokens in the /tokens response
export const tokenProviderSchema = z.object({
  provider: z.string(),
  tokens: z.array(tokenSchema),
}).passthrough()

export type TokenProvider = z.infer<typeof tokenProviderSchema>

// Fee in a quote route
export const feeSchema = z.object({
  type: z.string(),
  asset: z.string(),
  amount: z.string(),
  chain: z.string().optional(),
})

export type Fee = z.infer<typeof feeSchema>

// Estimated time breakdown
export const estimatedTimeSchema = z.object({
  inbound: z.number().optional(),
  swap: z.number().optional(),
  outbound: z.number().optional(),
  total: z.number(),
})

// Swap leg (individual step in a multi-step swap)
export const swapLegSchema = z.object({
  provider: z.string().optional(),
  sellAsset: z.string().optional(),
  buyAsset: z.string().optional(),
  sellAmount: z.string().optional(),
  buyAmount: z.string().optional(),
}).passthrough()

// Asset metadata returned in quote route
export const quoteAssetMetaSchema = z.object({
  asset: z.string(),
  price: z.number().optional(),
  image: z.string().optional(),
}).passthrough()

export const quoteMetaSchema = z.object({
  assets: z.array(quoteAssetMetaSchema).optional(),
  tags: z.array(z.string()).optional(),
}).passthrough()

// Quote route from SwapKit /v3/quote
export const quoteRouteSchema = z.object({
  routeId: z.string(),
  providers: z.array(z.string()),
  sellAsset: z.string(),
  buyAsset: z.string(),
  sellAmount: z.string(),
  expectedBuyAmount: z.string(),
  expectedBuyAmountMaxSlippage: z.string(),
  fees: z.array(feeSchema),
  estimatedTime: estimatedTimeSchema,
  totalSlippageBps: z.number().optional(),
  legs: z.array(swapLegSchema).optional(),
  warnings: z.array(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  meta: quoteMetaSchema.optional(),
}).passthrough()

export type QuoteRoute = z.infer<typeof quoteRouteSchema>

// Full quote response
export const quoteResponseSchema = z.object({
  quoteId: z.string().optional(),
  routes: z.array(quoteRouteSchema),
  providerErrors: z.array(z.any()).optional(),
  error: z.string().optional(),
})

export type QuoteResponse = z.infer<typeof quoteResponseSchema>

// EVM transaction object returned by SwapKit /v3/swap
export const evmTxSchema = z.object({
  to: z.string(),
  data: z.string().optional(),
  value: z.string().optional(),
  gas: z.string().optional(),
  gasPrice: z.string().optional(),
}).passthrough()

// Swap execution response from /v3/swap
export const swapResponseSchema = z.object({
  tx: evmTxSchema,
  txType: z.string(),
  targetAddress: z.string().optional(),
  inboundAddress: z.string().optional(),
})

export type SwapResponse = z.infer<typeof swapResponseSchema>

// Swap request parameters
export const swapParamsSchema = z.object({
  sellAsset: z.string().min(1),
  buyAsset: z.string().min(1),
  sellAmount: z.string().min(1),
  slippage: z.number().min(0).max(50).default(0.5),
  sourceAddress: z.string().optional(),
  destinationAddress: z.string().optional(),
  providers: z.array(z.string()).optional(),
})

export type SwapParams = z.infer<typeof swapParamsSchema>

// Transaction status values
export const transactionStatusEnum = z.enum([
  'not_started',
  'pending',
  'swapping',
  'completed',
  'refunded',
  'failed',
  'unknown',
])

export type TransactionStatusValue = z.infer<typeof transactionStatusEnum>

// Transaction tracking response
export const transactionStatusSchema = z.object({
  chainId: z.string().optional(),
  hash: z.string(),
  status: transactionStatusEnum,
  fromAsset: z.string().optional(),
  fromAmount: z.string().optional(),
  toAsset: z.string().optional(),
  toAmount: z.string().optional(),
  fromAddress: z.string().optional(),
  toAddress: z.string().optional(),
  provider: z.string().optional(),
  completedAt: z.string().optional(),
  legs: z.array(swapLegSchema).optional(),
}).passthrough()

export type TransactionStatus = z.infer<typeof transactionStatusSchema>
