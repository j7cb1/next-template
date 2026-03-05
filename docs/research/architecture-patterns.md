# Crypto Swap Feature - Architecture Patterns

> Last updated: 2026-02-12
> Based on: Existing codebase patterns analysis + Next.js/TanStack Query best practices research

## Table of Contents

1. [Component Structure](#1-component-structure)
2. [Use Cases](#2-use-cases)
3. [Data Flow](#3-data-flow)
4. [Caching Strategy](#4-caching-strategy)
5. [File/Folder Structure](#5-filefolder-structure)
6. [State Management](#6-state-management)
7. [Real-time Updates](#7-real-time-updates)
8. [Error Handling](#8-error-handling)

---

## 1. Component Structure

Following the existing `*-server.tsx` / `*-client.tsx` / `*-skeleton.tsx` / `*-error.tsx` pattern from `docs/project-pattern/front-end.md`.

### 1.1 Swap Page (Entry Point)

```
app/(dashboard)/swap/page.tsx                    # Server Component - page route
```

The page is a Server Component that composes the swap feature components. It does NOT prefetch volatile data (prices/quotes) on the server -- those are client-only due to their real-time nature. It DOES prefetch stable data (supported tokens list) via `HydrationBoundary`.

```tsx
// app/(dashboard)/swap/page.tsx
import { PageHeader } from '@/components/dashboard/page-header'
import { SwapWidgetServer } from '@/components/swap/swap-widget-server'

export default async function SwapPage() {
  return (
    <div>
      <PageHeader title="Swap" description="Exchange tokens" />
      <div className="mt-6 max-w-lg mx-auto">
        <SwapWidgetServer />
      </div>
    </div>
  )
}
```

### 1.2 Swap Widget (Main Container)

The top-level swap feature component, following the server/client/skeleton/error pattern:

| File | Role |
|------|------|
| `swap-widget-server.tsx` | Server Component: prefetches supported tokens, wraps in Suspense + ErrorBoundary + HydrationBoundary |
| `swap-widget-client.tsx` | Client Component: orchestrates the swap form, manages swap state (selected tokens, amounts), coordinates child components |
| `swap-widget-skeleton.tsx` | Loading placeholder for the entire swap widget |
| `swap-widget-error.tsx` | Error fallback for the swap widget |

### 1.3 Token Selector

A dialog/popover for selecting a token from the supported list:

| File | Role |
|------|------|
| `token-selector-client.tsx` | Client Component: manages search/filter state, renders token list, handles selection. Uses `useSupportedTokens` hook. Opens as a Dialog. |
| `token-selector-skeleton.tsx` | Skeleton for token list loading inside the dialog |

Key features:
- Search input with client-side filtering (tokens are already loaded)
- Recent tokens section (stored in localStorage)
- Token icon, name, symbol, and balance display
- Grouped by chain if multi-chain is supported

### 1.4 Swap Form

The core interactive form where users input amounts and configure swap:

| File | Role |
|------|------|
| `swap-form.tsx` | Client Component (`'use client'`): The form UI. Uses `react-hook-form` for amount inputs and slippage settings. Receives `onSubmit`, `isSubmitting`, token data, and quote data as props. |

Key features:
- Two token input rows (From / To) with amount fields
- Swap direction toggle button (flip From/To)
- Slippage tolerance setting (0.1%, 0.5%, 1%, custom)
- "Max" button to fill the From amount with full balance
- Connect wallet prompt when no wallet connected

### 1.5 Quote Display

Shows the current quote details:

| File | Role |
|------|------|
| `swap-quote-display.tsx` | Client Component: Shows exchange rate, price impact, estimated fees, minimum received. Receives quote data as props. Auto-updates when quote refreshes. |
| `swap-quote-skeleton.tsx` | Skeleton for quote loading state |

Key features:
- Exchange rate (e.g., "1 ETH = 2,450.32 USDC")
- Price impact percentage with color coding (green < 1%, yellow 1-3%, red > 3%)
- Network/gas fee estimate
- Minimum received (accounting for slippage)
- Route information (which DEX/path)
- Auto-refresh countdown indicator

### 1.6 Transaction Status Tracker

Shows swap transaction progress:

| File | Role |
|------|------|
| `swap-status-dialog.tsx` | Client Component: Dialog that shows transaction lifecycle. Uses `useTransactionStatus` hook with polling. |
| `swap-status-steps.tsx` | Client Component: Step-by-step progress indicator (submitting -> pending -> confirmed / failed) |

Key features:
- Step indicators: Submitting > Pending > Confirmed (or Failed)
- Transaction hash link to block explorer
- Estimated time remaining
- Retry button on failure
- "Swap Again" button on success

### 1.7 Token Balance Display

Shows user's balance for selected tokens:

| File | Role |
|------|------|
| `token-balance.tsx` | Client Component: Inline display of user's balance for a given token. Uses `useTokenBalance` hook. |

### 1.8 Wallet Connection Status

Displays wallet connection state and address:

| File | Role |
|------|------|
| `wallet-status.tsx` | Client Component: Shows connected wallet address (truncated) or "Connect Wallet" button. Integrates with Dynamic.xyz. |

---

## 2. Use Cases

Following the existing pattern: `query-key.ts` -> `use-case.ts` -> `action.ts` -> `use-*.ts` hook.

### 2.1 get-supported-tokens

Fetches the list of tokens available for swapping. Stable data, cached long.

```
use-cases/swap/get-supported-tokens/
  get-supported-tokens-query-key.ts
  get-supported-tokens-use-case.ts
  get-supported-tokens-action.ts
  use-supported-tokens.ts
  use-prefetched-supported-tokens.ts   # Server-side prefetch hook
```

**Query Key**: `['swap', 'supported-tokens']`

**Use Case Logic**:
- Calls SwapKit SDK to get list of supported tokens
- Returns array of `{ symbol, name, chain, address, decimals, logoUrl }`
- No auth required (public data)

**Hook** (`use-supported-tokens.ts`):
```typescript
useQuery({
  queryKey: getSupportedTokensQueryKey(),
  queryFn: () => getSupportedTokensAction(),
  staleTime: 1000 * 60 * 60,     // 1 hour
  gcTime: 1000 * 60 * 60 * 24,   // 24 hours
})
```

### 2.2 get-token-price

Fetches current price for a specific token. Volatile data, short cache.

```
use-cases/swap/get-token-price/
  get-token-price-query-key.ts
  get-token-price-use-case.ts
  get-token-price-action.ts
  use-token-price.ts
```

**Query Key**: `['swap', 'token-price', tokenIdentifier]`

**Use Case Logic**:
- Calls SwapKit SDK / price API for current token price in USD
- Returns `{ price, change24h, lastUpdated }`

**Hook** (`use-token-price.ts`):
```typescript
useQuery({
  queryKey: getTokenPriceQueryKey(tokenId),
  queryFn: () => getTokenPriceAction(tokenId),
  staleTime: 1000 * 30,           // 30 seconds
  refetchInterval: 1000 * 30,     // Poll every 30 seconds
  enabled: !!tokenId,
})
```

### 2.3 get-swap-quote

Fetches a swap quote for given token pair and amount. Most volatile, very short cache.

```
use-cases/swap/get-swap-quote/
  get-swap-quote-query-key.ts
  get-swap-quote-use-case.ts
  get-swap-quote-action.ts
  use-swap-quote.ts
```

**Query Key**: `['swap', 'quote', fromToken, toToken, amount, slippage]`

**Use Case Logic**:
- Validates input (tokens exist, amount > 0)
- Calls SwapKit SDK `getQuote()` or equivalent
- Returns `{ expectedOutput, minimumOutput, priceImpact, fees, route, estimatedTime, expiry }`

**Hook** (`use-swap-quote.ts`):
```typescript
useQuery({
  queryKey: getSwapQuoteQueryKey({ fromToken, toToken, amount, slippage }),
  queryFn: () => getSwapQuoteAction({ fromToken, toToken, amount, slippage }),
  staleTime: 1000 * 10,           // 10 seconds
  refetchInterval: 1000 * 15,     // Poll every 15 seconds
  enabled: !!fromToken && !!toToken && !!amount && amount > 0,
  retry: 1,                       // Limited retries for quotes
})
```

**Important**: Quote queries are debounced on the client side -- the hook should accept a `debounceMs` option (default 500ms) to avoid firing on every keystroke when the user is typing an amount.

### 2.4 execute-swap

Executes the actual token swap. This is a **mutation**, not a query.

```
use-cases/swap/execute-swap/
  execute-swap-use-case.ts
  execute-swap-action.ts
  use-execute-swap.ts
```

**Use Case Logic**:
- Validates the swap parameters
- Calls SwapKit SDK to build and execute the swap transaction
- Interacts with the user's wallet for signing (via Dynamic.xyz)
- Returns `{ transactionHash, status }`

**Hook** (`use-execute-swap.ts`):
```typescript
useMutation({
  mutationFn: (params) => executeSwapAction(params),
  onSuccess: (data) => {
    // Invalidate balances for both tokens
    queryClient.invalidateQueries({ queryKey: ['swap', 'token-balance'] })
    // Invalidate the quote
    queryClient.invalidateQueries({ queryKey: ['swap', 'quote'] })
  },
})
```

**Note on wallet interaction**: The actual transaction signing happens client-side via the wallet provider (Dynamic.xyz). The server action prepares the transaction data, but the signing and broadcasting may need to happen in the client. This means `execute-swap` may be split:
1. Server action: `prepare-swap-action.ts` -- builds the unsigned transaction
2. Client-side: wallet signs the transaction
3. Server action: `submit-swap-action.ts` -- submits the signed transaction (or this happens client-side directly)

### 2.5 get-transaction-status

Polls for the status of a submitted swap transaction.

```
use-cases/swap/get-transaction-status/
  get-transaction-status-query-key.ts
  get-transaction-status-use-case.ts
  get-transaction-status-action.ts
  use-transaction-status.ts
```

**Query Key**: `['swap', 'transaction', transactionHash]`

**Use Case Logic**:
- Calls SwapKit SDK or blockchain RPC to check transaction status
- Returns `{ status: 'pending' | 'confirmed' | 'failed', confirmations, blockExplorerUrl }`

**Hook** (`use-transaction-status.ts`):
```typescript
useQuery({
  queryKey: getTransactionStatusQueryKey(txHash),
  queryFn: () => getTransactionStatusAction(txHash),
  enabled: !!txHash,
  refetchInterval: (query) => {
    // Adaptive polling: faster initially, slower as time passes
    const status = query.state.data?.data?.status
    if (status === 'confirmed' || status === 'failed') return false // Stop polling
    return 1000 * 5  // Poll every 5 seconds while pending
  },
})
```

### 2.6 get-token-balances

Fetches the user's token balances from their connected wallet.

```
use-cases/swap/get-token-balances/
  get-token-balances-query-key.ts
  get-token-balances-use-case.ts
  get-token-balances-action.ts
  use-token-balances.ts
```

**Query Key**: `['swap', 'token-balance', walletAddress]`

**Use Case Logic**:
- Queries the user's wallet balance for all supported tokens (or specific tokens)
- Returns `Array<{ token, balance, balanceUsd }>`

**Hook** (`use-token-balances.ts`):
```typescript
useQuery({
  queryKey: getTokenBalancesQueryKey(walletAddress),
  queryFn: () => getTokenBalancesAction(walletAddress),
  staleTime: 1000 * 60,           // 1 minute
  refetchInterval: 1000 * 60,     // Poll every minute
  enabled: !!walletAddress,
})
```

---

## 3. Data Flow

### 3.1 Wallet Connection Flow

```
User clicks "Connect Wallet"
  -> Dynamic.xyz SDK opens wallet modal
  -> User selects wallet provider (MetaMask, WalletConnect, etc.)
  -> Dynamic.xyz returns wallet session (address, chain, provider)
  -> Wallet state stored in Dynamic.xyz context (DynamicContextProvider)
  -> SwapWidgetClient reads wallet state via useDynamicContext()
  -> Token balances fetched via useTokenBalances(walletAddress)
  -> Wallet status shown in WalletStatus component
```

### 3.2 Token Selection Flow

```
User clicks token selector button (From or To)
  -> TokenSelectorClient dialog opens
  -> Token list loaded from useSupportedTokens() (already cached/prefetched)
  -> User searches/filters tokens (client-side filtering)
  -> User selects a token
  -> TokenSelectorClient calls onSelect(token) callback
  -> SwapWidgetClient updates selectedFromToken or selectedToToken state
  -> Token balance fetched for selected token
  -> If both tokens selected + amount entered -> quote auto-fetched
```

### 3.3 Quote Flow

```
User enters amount in "From" field (or selects "Max")
  -> Input debounced (500ms)
  -> useSwapQuote hook fires with { fromToken, toToken, amount, slippage }
  -> Server action calls SwapKit SDK for quote
  -> Quote data returned: { expectedOutput, priceImpact, fees, route }
  -> SwapQuoteDisplay renders the quote details
  -> Quote auto-refreshes every 15 seconds via refetchInterval
  -> Countdown timer shows time until next refresh
```

### 3.4 Swap Execution Flow

```
User clicks "Swap" button
  -> Form validation (sufficient balance, valid amount)
  -> SwapStatusDialog opens in "Submitting" state
  -> executeSwap mutation fires
    1. Server action prepares the transaction (unsigned)
    2. Client-side: wallet signs the transaction via Dynamic.xyz provider
    3. Transaction submitted to the blockchain
  -> transactionHash returned
  -> SwapStatusDialog transitions to "Pending" state
  -> useTransactionStatus starts polling
  -> On "confirmed":
    - SwapStatusDialog shows success
    - Token balances invalidated and refetched
    - Quote cache invalidated
  -> On "failed":
    - SwapStatusDialog shows failure with error details
    - Retry button available
```

### 3.5 Complete Data Flow Diagram

```
                          Dynamic.xyz
                         (Wallet SDK)
                              |
                    wallet state (address, chain, signer)
                              |
                              v
  +-----------------------------------------------------------------+
  |                   SwapWidgetClient                               |
  |                                                                  |
  |  State:                                                          |
  |  - fromToken, toToken (selected tokens)                          |
  |  - amount (user input)                                           |
  |  - slippage (user preference)                                    |
  |  - activeTxHash (for status tracking)                            |
  |                                                                  |
  |  Hooks:                                                          |
  |  - useSupportedTokens()      -> token list                       |
  |  - useTokenBalances(address) -> balances                         |
  |  - useSwapQuote(...)         -> quote data                       |
  |  - useExecuteSwap()          -> mutation                         |
  |  - useTransactionStatus(hash)-> tx status                        |
  |                                                                  |
  |  +------------------+  +------------------+  +-----------------+ |
  |  | TokenSelector    |  | SwapForm         |  | SwapQuoteDisplay| |
  |  | (From)           |  | (amounts,        |  | (rate, impact,  | |
  |  |                  |  |  direction,       |  |  fees, route)   | |
  |  | TokenSelector    |  |  slippage)        |  |                 | |
  |  | (To)             |  |                  |  |                 | |
  |  +------------------+  +------------------+  +-----------------+ |
  |                                                                  |
  |  +------------------+  +------------------+                      |
  |  | WalletStatus     |  | SwapStatusDialog |                      |
  |  | (address, chain) |  | (tx lifecycle)   |                      |
  |  +------------------+  +------------------+                      |
  +-----------------------------------------------------------------+
                              |
                    Server Actions
                              |
                              v
  +-----------------------------------------------------------------+
  |                      Use Cases Layer                             |
  |                                                                  |
  |  getSupportedTokensUseCase  -> SwapKit SDK / token registry      |
  |  getTokenPriceUseCase       -> SwapKit SDK / price API           |
  |  getSwapQuoteUseCase        -> SwapKit SDK getQuote()            |
  |  executeSwapUseCase         -> SwapKit SDK + wallet signing      |
  |  getTransactionStatusUseCase-> SwapKit SDK / blockchain RPC      |
  |  getTokenBalancesUseCase    -> SwapKit SDK / wallet provider     |
  +-----------------------------------------------------------------+
                              |
                              v
  +-----------------------------------------------------------------+
  |                    SwapKit SDK / External APIs                    |
  |                                                                  |
  |  - Token lists, prices, quotes                                   |
  |  - Transaction building, submission, status                      |
  |  - Multi-chain routing (THORChain, 1inch, etc.)                  |
  +-----------------------------------------------------------------+
```

---

## 4. Caching Strategy

### 4.1 Cache Tiers

| Data Type | staleTime | gcTime | refetchInterval | Invalidation |
|-----------|-----------|--------|-----------------|--------------|
| Supported tokens list | 1 hour | 24 hours | none | Manual (rare) |
| Token prices | 30 seconds | 5 minutes | 30 seconds | On quote fetch |
| Swap quote | 10 seconds | 1 minute | 15 seconds | On token/amount change |
| Token balances | 1 minute | 5 minutes | 1 minute | After swap execution |
| Transaction status | 0 (always fresh) | 10 minutes | Adaptive (5s pending, stop on final) | None |

### 4.2 Server-Side Prefetching

Only **stable data** is prefetched on the server via `HydrationBoundary`:

```typescript
// swap-widget-server.tsx
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query-client'
import { getSupportedTokensQueryKey } from '@/use-cases/swap/get-supported-tokens/get-supported-tokens-query-key'
import { getSupportedTokensAction } from '@/use-cases/swap/get-supported-tokens/get-supported-tokens-action'

export async function SwapWidgetServer() {
  const queryClient = getQueryClient()

  // Prefetch stable data only
  await queryClient.prefetchQuery({
    queryKey: getSupportedTokensQueryKey(),
    queryFn: () => getSupportedTokensAction(),
  })

  // Do NOT prefetch prices/quotes -- they're too volatile for SSR
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<SwapWidgetSkeleton />}>
        <ErrorBoundary fallback={<SwapWidgetError />}>
          <SwapWidgetClient />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  )
}
```

### 4.3 Client-Side Cache Management

**Quote debouncing**: Amount input changes are debounced (500ms) before triggering a quote fetch. This prevents excessive API calls while the user is typing.

```typescript
// In swap-widget-client.tsx
const [debouncedAmount] = useDebounce(amount, 500)

const quoteQuery = useSwapQuote({
  fromToken,
  toToken,
  amount: debouncedAmount,
  slippage,
})
```

**Post-swap invalidation**: After a successful swap, invalidate related caches:
```typescript
// In use-execute-swap.ts onSuccess
queryClient.invalidateQueries({ queryKey: ['swap', 'token-balance'] })
queryClient.invalidateQueries({ queryKey: ['swap', 'quote'] })
queryClient.invalidateQueries({ queryKey: ['swap', 'token-price'] })
```

### 4.4 Query Key Hierarchy

All swap-related queries use the `['swap', ...]` prefix for easy bulk invalidation:

```
['swap', 'supported-tokens']                           # Token list
['swap', 'token-price', tokenId]                       # Individual token price
['swap', 'quote', fromToken, toToken, amount, slippage] # Specific quote
['swap', 'token-balance', walletAddress]                # Wallet balances
['swap', 'transaction', txHash]                         # Transaction status
```

---

## 5. File/Folder Structure

### 5.1 Complete File Tree

```
app/
  (dashboard)/
    swap/
      page.tsx                                # Server Component - swap page route

components/
  swap/
    swap-widget-server.tsx                    # Server: prefetch tokens, Suspense/ErrorBoundary
    swap-widget-client.tsx                    # Client: orchestrates swap state and child components
    swap-widget-skeleton.tsx                  # Skeleton for full swap widget
    swap-widget-error.tsx                     # Error fallback for swap widget
    swap-form.tsx                             # Client: form UI (amounts, direction, slippage)
    swap-quote-display.tsx                    # Client: shows quote details
    swap-quote-skeleton.tsx                   # Skeleton for quote loading
    swap-status-dialog.tsx                    # Client: transaction status dialog
    swap-status-steps.tsx                     # Client: step progress indicator
    token-selector-client.tsx                 # Client: token search/select dialog
    token-selector-skeleton.tsx               # Skeleton for token list in dialog
    token-balance.tsx                         # Client: inline balance display
    wallet-status.tsx                         # Client: wallet connection status

use-cases/
  swap/
    get-supported-tokens/
      get-supported-tokens-query-key.ts
      get-supported-tokens-use-case.ts
      get-supported-tokens-action.ts
      use-supported-tokens.ts
      use-prefetched-supported-tokens.ts
    get-token-price/
      get-token-price-query-key.ts
      get-token-price-use-case.ts
      get-token-price-action.ts
      use-token-price.ts
    get-swap-quote/
      get-swap-quote-query-key.ts
      get-swap-quote-use-case.ts
      get-swap-quote-action.ts
      use-swap-quote.ts
    execute-swap/
      execute-swap-use-case.ts
      execute-swap-action.ts
      use-execute-swap.ts
    get-transaction-status/
      get-transaction-status-query-key.ts
      get-transaction-status-use-case.ts
      get-transaction-status-action.ts
      use-transaction-status.ts
    get-token-balances/
      get-token-balances-query-key.ts
      get-token-balances-use-case.ts
      get-token-balances-action.ts
      use-token-balances.ts

repositories/
  swap/
    swap-schema.ts                            # Zod schemas for swap entities (Token, Quote, etc.)
    # Note: Swap data comes from external APIs (SwapKit SDK), not from our DB.
    # These schemas define the shape of external API responses for type safety.

config/
  navigation.ts                               # Add swap nav item

hooks/
  use-debounce.ts                             # Debounce hook for amount input
```

### 5.2 Navigation Addition

```typescript
// config/navigation.ts
import { IconArrowsExchange } from '@tabler/icons-react'

export const navigationItems: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: IconDashboard },
  { title: 'Swap', url: '/swap', icon: IconArrowsExchange },
  { title: 'Users', url: '/users', icon: IconUsers, minRole: 'admin' },
  { title: 'Settings', url: '/settings', icon: IconSettings },
]
```

---

## 6. State Management

### 6.1 State Ownership

The `SwapWidgetClient` component is the **single source of truth** for all swap-related local state. It uses React `useState` for UI state and TanStack Query hooks for server state.

```typescript
// swap-widget-client.tsx - state overview
'use client'

function SwapWidgetClient() {
  // === Local UI State (React useState) ===
  const [fromToken, setFromToken] = useState<Token | null>(null)
  const [toToken, setToToken] = useState<Token | null>(null)
  const [amount, setAmount] = useState<string>('')
  const [slippage, setSlippage] = useState<number>(0.5)        // Default 0.5%
  const [activeTxHash, setActiveTxHash] = useState<string | null>(null)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)

  // === Wallet State (Dynamic.xyz context) ===
  const { primaryWallet } = useDynamicContext()
  const walletAddress = primaryWallet?.address

  // === Server State (TanStack Query) ===
  const tokensQuery = useSupportedTokens()
  const balancesQuery = useTokenBalances(walletAddress)
  const [debouncedAmount] = useDebounce(amount, 500)
  const quoteQuery = useSwapQuote({
    fromToken: fromToken?.identifier,
    toToken: toToken?.identifier,
    amount: debouncedAmount,
    slippage,
  })
  const swapMutation = useExecuteSwap()
  const txStatusQuery = useTransactionStatus(activeTxHash)

  // === Derived State ===
  const fromBalance = balancesQuery.data?.find(b => b.token === fromToken?.identifier)
  const toBalance = balancesQuery.data?.find(b => b.token === toToken?.identifier)
  const canSwap = !!fromToken && !!toToken && !!amount && !!walletAddress && !swapMutation.isPending

  // === Handlers ===
  const handleSwapDirection = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setAmount('')  // Clear amount when swapping direction
  }

  const handleSubmitSwap = async () => {
    // ... validation and mutation call
  }

  // Renders child components with props
}
```

### 6.2 State Flow Between Components

```
SwapWidgetClient (owns all state)
  |
  |-- fromToken, toToken       --> TokenSelector (via onSelect callback)
  |-- amount, slippage         --> SwapForm (via onChange callbacks)
  |-- quoteQuery.data          --> SwapQuoteDisplay (read-only props)
  |-- walletAddress            --> WalletStatus (read-only)
  |-- fromBalance, toBalance   --> TokenBalance (read-only)
  |-- activeTxHash, txStatus   --> SwapStatusDialog (read-only + onClose callback)
```

### 6.3 Wallet State

Wallet state is managed by **Dynamic.xyz** through its `DynamicContextProvider`. This provider wraps the app (added to `components/providers.tsx`). Components access wallet state via Dynamic's hooks:

```typescript
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'

const { primaryWallet, user, setShowAuthFlow } = useDynamicContext()
```

The wallet provider is **not** stored in our own state -- Dynamic.xyz manages it entirely. We only read from it.

### 6.4 Recent Tokens (Persistent)

Recent token selections are stored in `localStorage` for persistence across sessions:

```typescript
// Simple localStorage utility (no global state needed)
const RECENT_TOKENS_KEY = 'swap:recent-tokens'
const MAX_RECENT = 5

function getRecentTokens(): string[] {
  const stored = localStorage.getItem(RECENT_TOKENS_KEY)
  return stored ? JSON.parse(stored) : []
}

function addRecentToken(tokenId: string) {
  const recent = getRecentTokens().filter(t => t !== tokenId)
  recent.unshift(tokenId)
  localStorage.setItem(RECENT_TOKENS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}
```

---

## 7. Real-time Updates

### 7.1 Recommended Approach: Polling via refetchInterval

For this application, **polling via TanStack Query's `refetchInterval`** is the recommended approach rather than WebSockets or SSE. Rationale:

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Polling (refetchInterval)** | Simple, works with existing architecture, no infra changes, automatic retry/error handling via TanStack Query | Slightly higher latency, more HTTP requests | **Recommended** |
| **WebSocket** | Lowest latency, bidirectional, efficient for high-frequency updates | Requires WebSocket server, doesn't fit Next.js server actions pattern, connection management complexity, not compatible with serverless | Too complex for initial build |
| **SSE (Server-Sent Events)** | Unidirectional streaming, simpler than WebSocket, works with HTTP | Requires long-lived server connections, doesn't fit serverless, limited browser connections | Not ideal for serverless |

### 7.2 Polling Configuration by Data Type

```typescript
// Token prices: moderate polling
useQuery({
  refetchInterval: 1000 * 30,           // Every 30 seconds
  refetchIntervalInBackground: false,   // Pause when tab hidden
})

// Swap quotes: aggressive polling (user is actively trading)
useQuery({
  refetchInterval: 1000 * 15,           // Every 15 seconds
  refetchIntervalInBackground: false,
})

// Transaction status: adaptive polling
useQuery({
  refetchInterval: (query) => {
    const status = query.state.data?.data?.status
    if (status === 'confirmed' || status === 'failed') return false
    return 1000 * 5                     // Every 5 seconds while pending
  },
})

// Token balances: slow polling
useQuery({
  refetchInterval: 1000 * 60,           // Every 60 seconds
  refetchIntervalInBackground: false,
})
```

### 7.3 Optimizations

- **`refetchIntervalInBackground: false`**: Stop polling when the tab is not visible (saves API calls)
- **`enabled` flag**: Only poll when the data is actually needed (e.g., only fetch quote when both tokens + amount are set)
- **Conditional refetchInterval**: Use a function to dynamically adjust polling (e.g., stop polling transaction status once confirmed)
- **Focus refetching**: TanStack Query refetches on window focus by default -- this is helpful for catching up on price changes when the user returns to the tab

### 7.4 Future Enhancement: WebSocket Upgrade

If real-time requirements increase (e.g., order book, live trade feed), WebSocket can be added as a **cache updater** alongside polling:

```typescript
// Future pattern: WebSocket pushes updates into TanStack Query cache
useEffect(() => {
  const ws = new WebSocket(priceWsUrl)
  ws.onmessage = (event) => {
    const priceUpdate = JSON.parse(event.data)
    queryClient.setQueryData(
      getTokenPriceQueryKey(priceUpdate.tokenId),
      { data: priceUpdate, error: null }
    )
  }
  return () => ws.close()
}, [])
```

This approach keeps TanStack Query as the single source of truth while WebSocket just pushes updates into the cache. Polling serves as automatic fallback if WebSocket disconnects.

---

## 8. Error Handling

### 8.1 Error Categories

| Error Category | Examples | Handling Strategy |
|----------------|----------|-------------------|
| **Network errors** | API timeout, connection refused | Retry with TanStack Query (3 retries default), show toast |
| **Quote errors** | No route found, insufficient liquidity | Show inline error in quote display, suggest different pair |
| **Wallet errors** | Not connected, wrong chain, rejected signature | Show contextual prompt (connect wallet, switch chain) |
| **Swap failures** | Transaction reverted, slippage exceeded | Show in status dialog with retry, suggest higher slippage |
| **Validation errors** | Insufficient balance, amount too small | Inline form validation, disable submit button |
| **Rate limit errors** | Too many API calls | Exponential backoff via TanStack Query retry |

### 8.2 Error Handling by Layer

**Use Case Layer** (following existing FunctionResult pattern):
```typescript
// All use cases return { data, error } -- never throw
export async function getSwapQuoteUseCase(args): Promise<GetSwapQuoteUseCaseResult> {
  const { success, error } = GetSwapQuoteUseCaseResultSchema
  try {
    // ... logic
    return success(quoteData)
  } catch (err) {
    log?.error({ err }, 'Failed to get swap quote')
    captureError(err)

    // Categorize the error for better UI handling
    if (isInsufficientLiquidityError(err)) {
      return error({ message: 'Insufficient liquidity for this pair', code: 'INSUFFICIENT_LIQUIDITY' })
    }
    if (isNoRouteError(err)) {
      return error({ message: 'No swap route found', code: 'NO_ROUTE' })
    }
    return error({ message: 'Failed to get quote', code: 'UNKNOWN' })
  }
}
```

**Hook Layer** (transforms FunctionResult into TanStack Query expectations):
```typescript
// Hooks throw on error so TanStack Query can handle retry/error states
export function useSwapQuote(params) {
  return useQuery({
    queryKey: getSwapQuoteQueryKey(params),
    queryFn: async () => {
      const { data, error } = await getSwapQuoteAction(params)
      if (error) throw error  // Let TanStack Query handle it
      return data
    },
    retry: (failureCount, error) => {
      // Don't retry validation/business errors
      if (error.code === 'INSUFFICIENT_LIQUIDITY' || error.code === 'NO_ROUTE') return false
      return failureCount < 2  // Retry network errors up to 2 times
    },
  })
}
```

**Component Layer** (user-facing error display):
```typescript
// swap-widget-client.tsx
{quoteQuery.isError && (
  <SwapQuoteError
    error={quoteQuery.error}
    onRetry={() => quoteQuery.refetch()}
  />
)}
```

### 8.3 Swap Execution Error Recovery

```typescript
// In use-execute-swap.ts
useMutation({
  mutationFn: executeSwapAction,
  onError: (error) => {
    if (error.code === 'SLIPPAGE_EXCEEDED') {
      toast.error('Price moved too much. Try increasing slippage tolerance.')
    } else if (error.code === 'USER_REJECTED') {
      toast.info('Transaction cancelled.')
    } else if (error.code === 'INSUFFICIENT_GAS') {
      toast.error('Insufficient gas for transaction.')
    } else {
      toast.error('Swap failed. Please try again.')
    }
  },
})
```

### 8.4 ErrorBoundary Strategy

Following the existing pattern, each major component has an error boundary:

```typescript
// swap-widget-server.tsx
<ErrorBoundary fallback={<SwapWidgetError />}>
  <Suspense fallback={<SwapWidgetSkeleton />}>
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SwapWidgetClient />
    </HydrationBoundary>
  </Suspense>
</ErrorBoundary>
```

The `SwapWidgetError` component provides a "Try Again" button that resets the error boundary, giving users a way to recover from unexpected errors.

---

## Appendix: Key Design Decisions

### A.1 Why No Database Tables for Swap

The swap feature does not require its own database tables because:
- Token data comes from SwapKit SDK / external APIs
- Transaction history is on-chain (queryable via blockchain)
- User preferences (slippage, recent tokens) are stored client-side in localStorage
- Wallet connections are managed by Dynamic.xyz

If transaction history tracking or analytics are needed later, a `swap_transactions` table can be added to store transaction metadata (hash, tokens, amounts, status, timestamps).

### A.2 Why SwapWidgetClient Owns All State

Centralizing state in `SwapWidgetClient` rather than distributing it across child components:
- Eliminates prop drilling issues (only 1 level deep to child components)
- Makes the data flow explicit and predictable
- Allows coordinated updates (e.g., swapping direction updates both tokens simultaneously)
- Follows the existing codebase pattern where `*-client.tsx` is the orchestrator

### A.3 Why Polling Over WebSocket

For the initial implementation:
- Matches the existing server action architecture
- Works with Vercel serverless deployment
- TanStack Query provides built-in retry, error handling, and cache management
- Quote data only needs 10-15 second freshness (not sub-second)
- Simpler to implement, test, and debug
- Can be upgraded to WebSocket later without changing the component architecture (just swap the data source feeding the TanStack Query cache)

### A.4 Server vs Client Data Fetching Split

| Data | Where Fetched | Rationale |
|------|--------------|-----------|
| Supported tokens | Server (prefetch) + Client (revalidate) | Stable data, benefits from SSR for fast first paint |
| Prices | Client only | Too volatile for SSR, would be stale by hydration time |
| Quotes | Client only | Depends on user input, can't be prefetched |
| Balances | Client only | Requires wallet connection (client-side only) |
| Transaction status | Client only | Depends on swap execution (client-side event) |
