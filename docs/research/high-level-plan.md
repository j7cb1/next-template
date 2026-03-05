# Crypto Swap Exchange - High-Level Project Plan

> Last updated: 2026-02-12
> Status: Planning
> Based on: SwapKit SDK research, Dynamic.xyz research, Architecture patterns analysis

---

## 1. Project Overview

### Vision

Build a crypto swap exchange feature within the existing Next.js base template, enabling users to swap tokens across 30+ blockchains with best-route finding, real-time price estimates, and full transaction lifecycle tracking.

### Core Value Proposition

- **Cross-chain swaps**: Swap tokens across different blockchains (e.g., BTC to ETH) in a single transaction, powered by THORChain, Chainflip, Maya Protocol, and NEAR Intents
- **Best route optimization**: Automatically find the best rate across multiple liquidity providers (THORChain, Chainflip, Maya, 1inch, Jupiter)
- **Non-custodial**: Users retain control of their assets; all signing happens client-side via their own wallets
- **Multi-wallet support**: Connect via MetaMask, Phantom, Ledger, embedded wallets (email/social login), and 50+ wallet providers through Dynamic.xyz

### Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 + React 19 + TypeScript | Application framework |
| Swap Engine | SwapKit SDK v4 (`@swapkit/sdk`) | Token swap quotes, execution, tracking |
| Wallet Connection | Dynamic.xyz SDK v4 (`@dynamic-labs/*`) | Multi-chain wallet connection, signing, embedded wallets |
| Server State | TanStack Query | Caching, polling, server-state management |
| UI Components | shadcn/ui + Tailwind CSS | Component library |
| Forms | react-hook-form + Zod | Form validation |
| Auth | NextAuth v5 (existing) | User authentication |
| Database | PostgreSQL + Drizzle ORM (existing) | Transaction history persistence |
| Architecture | Clean Architecture (use-cases pattern) | Business logic separation |

---

## 2. Core Features

### 2.1 Token Swap with Best Route Finding
- Request quotes from all available liquidity providers simultaneously
- Display multiple routes tagged as RECOMMENDED, CHEAPEST, or FASTEST
- Support cross-chain swaps (e.g., BTC to ETH), single-chain swaps, and cross-chain DEX aggregation (swap + bridge)
- 10,000+ supported tokens across 30+ blockchains

### 2.2 Real-Time Price Estimates and Quotes
- Live token price display with 30-second polling
- Swap quotes refreshed every 15 seconds
- Debounced quote fetching (500ms) to avoid excessive API calls during user input
- Display expected output, minimum output (with slippage), fees breakdown, and estimated execution time

### 2.3 Multi-Chain Wallet Connection via Dynamic.xyz
- Support EVM chains (Ethereum, Polygon, Arbitrum, Base, etc.), Solana, Bitcoin, and Cosmos
- External wallets: MetaMask, Phantom, Ledger, WalletConnect, Keplr, etc.
- Embedded wallets: Email and social login (Google, Apple, Discord, GitHub) via MPC-based wallets
- Network switching UI
- Wallet balance display

### 2.4 Transaction State Tracking
- Full transaction lifecycle: submitting -> pending -> swapping -> confirmed / failed / refunded
- Adaptive polling: 5-second intervals while pending, stops on terminal state
- Transaction hash with block explorer link
- Estimated time remaining
- Support for cross-chain swap tracking (multi-leg transactions)

### 2.5 Token Search and Selection
- Searchable token selector dialog with client-side filtering
- Token display: icon, name, symbol, chain, and user balance
- Recent tokens section (persisted in localStorage)
- Grouped by chain for multi-chain support

### 2.6 Slippage Configuration
- Preset options: 0.1%, 0.5%, 1%, custom
- Default: 0.5% (adjustable)
- Display minimum received amount accounting for slippage
- Automatic refund if slippage exceeds limit during execution

### 2.7 Transaction History
- Store completed swap metadata (hash, tokens, amounts, status, timestamps) in PostgreSQL
- Display past swaps with status, amounts, and block explorer links
- Filterable by token, status, date range

---

## 3. Technical Architecture Summary

### 3.1 How SwapKit, Dynamic.xyz, and Next.js Patterns Fit Together

The architecture follows a clear separation between server-side and client-side responsibilities:

**Server Side** (Server Actions / API Routes):
- Quote fetching via SwapKit REST API (`POST /v3/quote`) -- protects API key
- Transaction tracking via SwapKit REST API (`POST /track`)
- Token list caching and prefetching via `HydrationBoundary`
- Transaction history persistence (PostgreSQL)

**Client Side** (`"use client"` components):
- Dynamic.xyz wallet connection and management
- SwapKit SDK initialization (dynamic import to avoid SSR issues)
- Swap execution and transaction signing (via Dynamic.xyz wallet client)
- Token approval for ERC-20 tokens
- Real-time UI updates via TanStack Query polling

### 3.2 Integration Points

1. **Dynamic.xyz -> SwapKit**: Wallet address and Viem wallet client from Dynamic.xyz are passed to SwapKit for transaction construction and signing
2. **SwapKit REST API -> Server Actions**: Quote and tracking API calls go through Next.js server actions to protect the API key
3. **SwapKit SDK -> Client Components**: SDK initialized client-side via dynamic import for swap execution
4. **TanStack Query -> All Data**: Single source of truth for all server state (quotes, prices, balances, tx status)

### 3.3 Data Flow Diagram

```
+------------------+     +-------------------+     +------------------+
|   Dynamic.xyz    |     |   Next.js Server  |     |   SwapKit API    |
|   (Wallet SDK)   |     |   Actions         |     |   (REST)         |
+--------+---------+     +--------+----------+     +--------+---------+
         |                         |                         |
   wallet address,           quotes, tracking,          token lists,
   chain, signer             token lists                quotes, swap
         |                         |                    data, tracking
         v                         v                         |
+------------------------------------------------------------------+
|                    SwapWidgetClient                               |
|                                                                   |
|  +------------------+  +------------------+  +------------------+ |
|  | Token Selector   |  | Swap Form        |  | Quote Display    | |
|  | (search, select) |  | (amounts, config)|  | (rate, fees)     | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                   |
|  +------------------+  +------------------+  +------------------+ |
|  | Wallet Status    |  | Token Balance    |  | Status Dialog    | |
|  | (Dynamic.xyz)    |  | (per-token)      |  | (tx lifecycle)   | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
         |                         |                         |
         v                         v                         v
+------------------------------------------------------------------+
|                    TanStack Query Cache                           |
|                                                                   |
|  ['swap','supported-tokens']  ['swap','quote',from,to,amt,slip]  |
|  ['swap','token-price',id]    ['swap','token-balance',addr]      |
|  ['swap','transaction',hash]                                      |
+------------------------------------------------------------------+
         |                         |
         v                         v
+------------------+     +-------------------+
|   SwapKit SDK    |     |   PostgreSQL       |
|   (Client-side)  |     |   (tx history)     |
+------------------+     +-------------------+
```

---

## 4. Implementation Phases

### Phase 1: Foundation (Estimated: Sprint 1-2)

**Goal**: Wallet connection working, SwapKit integrated, base component structure in place.

**Milestone**: User can connect a wallet and see their address displayed in the swap page.

| Task | Details |
|------|---------|
| Install Dynamic.xyz packages | `@dynamic-labs/sdk-react-core`, `@dynamic-labs/ethereum`, `@dynamic-labs/solana` |
| Create `DynamicProvider` component | Client-side provider wrapping the app in `components/providers/` |
| Add provider to root layout | Wrap app without making layout.tsx a client component |
| Configure Dynamic.xyz dashboard | Enable chains (EVM, Solana), configure wallets, get environment ID |
| Install SwapKit SDK | `@swapkit/sdk` for client-side, `@swapkit/api` for server-side |
| Create SwapKit initialization hook | `useSwapKit()` hook with dynamic import and `useEffect` init |
| Create swap page route | `app/(dashboard)/swap/page.tsx` |
| Create component file structure | All swap component files (widget, form, selector, quote, status) |
| Create use-case file structure | All use-case directories with query-key, use-case, action, hook files |
| Add swap to navigation | Update `config/navigation.ts` with swap nav item |
| Implement `get-supported-tokens` use case | Server action fetching token list from SwapKit API |
| Set up environment variables | `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`, `SWAPKIT_API_KEY`, `NEXT_PUBLIC_SWAPKIT_API_KEY` |
| Create Zod schemas | Token, Quote, SwapParams, TransactionStatus schemas in `repositories/swap/` |

**Key files created:**
```
components/providers/dynamic-provider.tsx
components/swap/swap-widget-server.tsx
components/swap/swap-widget-client.tsx
components/swap/swap-widget-skeleton.tsx
components/swap/wallet-status.tsx
use-cases/swap/get-supported-tokens/*
repositories/swap/swap-schema.ts
hooks/use-swap-kit.ts
app/(dashboard)/swap/page.tsx
```

---

### Phase 2: Core Swap (Estimated: Sprint 3-4)

**Goal**: Full swap flow working -- user can select tokens, get a quote, and execute a swap.

**Milestone**: User can successfully swap tokens and see the transaction hash.

| Task | Details |
|------|---------|
| Build token selector dialog | Searchable list with icons, names, balances; recent tokens from localStorage |
| Build swap form | Two token rows (From/To), amount input, direction toggle, slippage config, Max button |
| Implement `get-swap-quote` use case | Server action calling SwapKit `POST /v3/quote`, with debounced client hook |
| Build quote display component | Exchange rate, price impact (color-coded), fees breakdown, route info, refresh countdown |
| Implement `get-token-balances` use case | Fetch wallet balances via SwapKit SDK / RPC |
| Build token balance display | Inline balance shown in swap form for selected tokens |
| Implement `execute-swap` use case | Prepare tx server-side, sign client-side via Dynamic.xyz wallet client, broadcast |
| Handle ERC-20 token approval | Check allowance, prompt approval before swap if needed |
| Implement `get-token-price` use case | Fetch current token prices for USD display |
| Build swap confirmation step | Pre-sign modal showing final amounts, fees, and route before user confirms |
| Add `useDebounce` hook | Debounce amount input (500ms) before triggering quote fetch |

**Key files created:**
```
components/swap/token-selector-client.tsx
components/swap/token-selector-skeleton.tsx
components/swap/swap-form.tsx
components/swap/swap-quote-display.tsx
components/swap/swap-quote-skeleton.tsx
components/swap/swap-confirmation.tsx
components/swap/token-balance.tsx
use-cases/swap/get-swap-quote/*
use-cases/swap/execute-swap/*
use-cases/swap/get-token-price/*
use-cases/swap/get-token-balances/*
hooks/use-debounce.ts
```

---

### Phase 3: Transaction Management (Estimated: Sprint 5-6)

**Goal**: Full transaction lifecycle tracking, error recovery, and history persistence.

**Milestone**: User can track swap progress in real-time and view past transactions.

| Task | Details |
|------|---------|
| Implement `get-transaction-status` use case | Server action calling SwapKit `POST /track`, adaptive polling hook |
| Build transaction status dialog | Step indicators (submitting -> pending -> confirmed/failed), tx hash link, ETA |
| Build step progress component | Visual step indicator with active/completed/failed states |
| Add retry logic for failed swaps | Retry button that re-fetches quote and allows re-execution |
| Handle refund status | Display refund information when slippage exceeded |
| Create `swap_transactions` DB table | Store tx metadata: hash, fromToken, toToken, fromAmount, toAmount, status, timestamps |
| Create transaction history repository | CRUD operations for swap_transactions table |
| Create transaction history use case | Fetch paginated history for current user |
| Build transaction history UI | Table/list view with filters (token, status, date) |
| Implement error categorization | Map SwapKit errors to user-friendly messages (insufficient balance, no route, slippage, etc.) |
| Add toast notifications | Success/failure/info toasts for swap lifecycle events |

**Key files created:**
```
components/swap/swap-status-dialog.tsx
components/swap/swap-status-steps.tsx
components/swap/transaction-history.tsx
use-cases/swap/get-transaction-status/*
use-cases/swap/get-transaction-history/*
use-cases/swap/save-transaction/*
repositories/swap/swap-transaction-repository.ts
repositories/drizzle/schema.ts (updated with swap_transactions)
```

**Database addition:**
```sql
swap_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId          UUID NOT NULL REFERENCES users(id),
  txHash          VARCHAR(255),
  fromToken       VARCHAR(255) NOT NULL,
  toToken         VARCHAR(255) NOT NULL,
  fromAmount      VARCHAR(255) NOT NULL,
  toAmount        VARCHAR(255),
  expectedAmount  VARCHAR(255),
  slippage        DECIMAL(5,2),
  provider        VARCHAR(100),
  status          swap_status DEFAULT 'pending',
  chainId         VARCHAR(50),
  blockExplorerUrl VARCHAR(500),
  errorMessage    TEXT,
  createdAt       TIMESTAMP DEFAULT NOW(),
  updatedAt       TIMESTAMP DEFAULT NOW(),
  completedAt     TIMESTAMP
)

-- Status enum: 'pending' | 'swapping' | 'completed' | 'failed' | 'refunded'
```

---

### Phase 4: Polish and Optimization (Estimated: Sprint 7-8)

**Goal**: Production-ready quality with optimized performance, responsive design, and edge case handling.

**Milestone**: Feature is fully polished, performant, and ready for production deployment.

| Task | Details |
|------|---------|
| Optimize bundle size | Use granular SwapKit imports (only needed plugins/wallets), verify tree-shaking |
| Implement loading skeletons | Skeleton components for all async states (widget, quote, token list, history) |
| Add skeleton/loading for wallet connection | Hydration-safe rendering with mounted state check |
| Mobile responsiveness | Responsive swap form, token selector dialog, transaction history |
| Optimize caching | Tune staleTime/gcTime values based on real usage patterns |
| Add `refetchIntervalInBackground: false` | Pause polling when tab is not visible |
| Performance audit | Lighthouse audit, bundle analysis, identify and fix bottlenecks |
| Dynamic.xyz theming | Match swap widget styling to existing dashboard theme (CSS variables) |
| Accessibility audit | Keyboard navigation, screen reader support, ARIA labels |
| Edge case testing | Zero balance, very small amounts, very large amounts, unsupported token pairs |
| Rate limit handling | Exponential backoff for SwapKit API calls, user-facing rate limit messages |
| Quote expiration handling | Warn user when quote is about to expire (60s route ID window), auto-refresh |
| Network error recovery | Graceful degradation when APIs are unavailable, retry mechanisms |

---

## 5. Infrastructure Requirements

### 5.1 Environment Variables

```env
# Dynamic.xyz (Required)
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=   # From app.dynamic.xyz dashboard
DYNAMIC_API_KEY=dyn_...               # Server-side only, for JWT verification

# SwapKit (Required)
SWAPKIT_API_KEY=                       # Server-side only, for API calls
NEXT_PUBLIC_SWAPKIT_API_KEY=           # Client-side, for SDK initialization

# SwapKit (Optional)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=  # For WalletConnect integration
NEXT_PUBLIC_BLOCKCHAIR_API_KEY=        # For UTXO chain support (Bitcoin, etc.)
NEXT_PUBLIC_ALCHEMY_KEY=               # Custom RPC URLs for better reliability

# Existing (already configured)
DATABASE_URL=                          # PostgreSQL connection string
NEXTAUTH_SECRET=                       # NextAuth session secret
```

### 5.2 API Keys and Accounts

| Service | Dashboard URL | Key Type | Purpose |
|---------|--------------|----------|---------|
| Dynamic.xyz | app.dynamic.xyz | Environment ID + API key | Wallet connection, embedded wallets |
| SwapKit | dashboard.swapkit.dev | API key | Quote fetching, swap execution, tracking |
| WalletConnect | cloud.walletconnect.com | Project ID | WalletConnect wallet support (optional) |
| Alchemy | dashboard.alchemy.com | API key | Custom RPC endpoints (optional) |

### 5.3 New NPM Packages

```bash
# Dynamic.xyz wallet connection
npm install @dynamic-labs/sdk-react-core @dynamic-labs/ethereum @dynamic-labs/solana

# SwapKit swap engine
npm install @swapkit/sdk

# Optional: Ethers.js bridge for Dynamic <-> SwapKit
npm install @dynamic-labs/ethers-v6
```

### 5.4 Database Changes

- Add `swap_transactions` table (see Phase 3 for schema)
- Add `swap_status` enum type: `'pending' | 'swapping' | 'completed' | 'failed' | 'refunded'`
- Run migration: `npm run db:generate && npm run db:migrate`

### 5.5 Docker / Deployment

- No new containers required -- PostgreSQL (existing) is sufficient
- SwapKit and Dynamic.xyz are external SaaS services (no self-hosting)
- Deployment target: Vercel (compatible with server actions and serverless)
- Note: WebSocket-based features are NOT used initially (polling only), so serverless deployment is fully compatible

---

## 6. Data Flow

### 6.1 Complete User Flow: Wallet Connection -> Token Selection -> Quote -> Swap -> Track

#### Step 1: Wallet Connection

```
User visits /swap page
  -> DynamicProvider is already mounted (wraps entire app)
  -> User clicks "Connect Wallet" button
  -> Dynamic.xyz opens wallet selection modal
  -> User selects wallet (MetaMask, Phantom, email, etc.)
  -> Dynamic.xyz authenticates and returns wallet session
  -> primaryWallet available via useDynamicContext()
  -> SwapWidgetClient reads wallet address and chain
  -> Token balances start fetching via useTokenBalances(address)
```

#### Step 2: Token Selection

```
User clicks "From" token selector
  -> TokenSelectorClient dialog opens
  -> Token list already loaded (prefetched on server, cached 1 hour)
  -> User types to search -> client-side filtering (no API call)
  -> User selects a token (e.g., ETH)
  -> onSelect callback updates SwapWidgetClient state
  -> Balance for selected token displayed inline
  -> User repeats for "To" token (e.g., BTC)
```

#### Step 3: Quote Fetching

```
User types amount in "From" field (e.g., "1.0")
  -> Input debounced (500ms)
  -> useSwapQuote hook fires with { fromToken: "ETH.ETH", toToken: "BTC.BTC", amount: "1.0", slippage: 0.5 }
  -> Server action calls SwapKit POST /v3/quote (API key protected)
  -> SwapKit returns routes from all providers (THORChain, Chainflip, etc.)
  -> Best route displayed: expected output, fees, estimated time, price impact
  -> Quote auto-refreshes every 15 seconds
  -> Countdown timer shows time until next refresh
```

#### Step 4: Swap Execution

```
User clicks "Swap" button
  -> Client validates: sufficient balance, valid amount, wallet connected
  -> Swap confirmation dialog shows final details
  -> User confirms
  -> SwapStatusDialog opens in "Submitting" state
  -> Server action calls SwapKit POST /v3/swap with routeId + addresses
  -> SwapKit returns unsigned transaction data
  -> Dynamic.xyz wallet client signs the transaction
  -> Transaction broadcast to blockchain
  -> Transaction hash returned
  -> Swap metadata saved to PostgreSQL via save-transaction use case
```

#### Step 5: Transaction Tracking

```
Transaction hash received
  -> SwapStatusDialog transitions to "Pending" state
  -> useTransactionStatus starts polling SwapKit POST /track every 5 seconds
  -> Status progression: pending -> swapping -> completed
  -> On "completed":
    - Dialog shows success with tx hash link to block explorer
    - Token balances invalidated and refetched
    - Transaction record updated in PostgreSQL
    - "Swap Again" button available
  -> On "failed" or "refunded":
    - Dialog shows error details
    - Retry button available
    - Transaction record updated with error message
```

---

## 7. Security Considerations

### 7.1 Private Key Handling

- **Private keys NEVER touch the server.** All key material stays in the user's wallet (browser extension, hardware wallet, or Dynamic.xyz embedded wallet).
- SwapKit SDK runs client-side for any operation requiring wallet access.
- Dynamic.xyz embedded wallets use TSS-MPC (Threshold Signature Scheme) -- no single party holds the full key.

### 7.2 Transaction Signing

- All transaction signing happens **exclusively client-side** via the Dynamic.xyz wallet client.
- Flow: Server builds unsigned transaction -> Client signs -> Client or server broadcasts.
- SwapKit's `/v3/swap` endpoint returns transaction data (not signed transactions).
- Users see a confirmation dialog with exact amounts before signing.

### 7.3 API Key Protection

- `SWAPKIT_API_KEY` is server-side only (no `NEXT_PUBLIC_` prefix) -- used in server actions for quote and tracking API calls.
- `NEXT_PUBLIC_SWAPKIT_API_KEY` is used for client-side SDK initialization (limited scope, read-only operations).
- `DYNAMIC_API_KEY` is server-side only -- used for JWT verification.
- Server actions act as a proxy layer, preventing direct client access to sensitive API endpoints.

### 7.4 Input Validation

- All swap parameters validated with Zod schemas before API calls.
- Token identifiers validated against the supported tokens list (prevent injection of arbitrary contract addresses).
- Amount validation: positive numbers, within balance limits, reasonable decimal precision.
- Address format validation per chain type (EVM hex, Bitcoin base58/bech32, Solana base58).

### 7.5 Slippage Protection

- Default slippage set to 0.5% (conservative).
- Maximum custom slippage capped (e.g., 50%) to prevent user error.
- If actual price movement exceeds slippage tolerance, the transaction is automatically refunded by the liquidity provider (THORChain, Chainflip).
- `expectedBuyAmountMaxSlippage` displayed prominently so users understand worst-case output.

### 7.6 Additional Measures

- Rate limiting on server actions to prevent abuse of quote API.
- SwapKit performs AML compliance screening on addresses when source/destination addresses are provided.
- THORChain/Maya reject Type 4 (EIP-7702) transactions -- ensure only Legacy (Type 0) and EIP-1559 (Type 2) transactions are used.
- Validate route ID is fresh (< 60 seconds) before executing swap.

---

## 8. Risks and Mitigations

### 8.1 API Rate Limits

| Risk | SwapKit API or Dynamic.xyz API rate limits hit during high usage |
|------|------|
| **Impact** | Quote fetching fails, degraded user experience |
| **Mitigation** | Debounce quote requests (500ms), cache quotes (10s staleTime), use `refetchIntervalInBackground: false` to pause polling when tab hidden, implement exponential backoff retry in TanStack Query |

### 8.2 Price Volatility Between Quote and Execution

| Risk | Price moves significantly between when the quote is shown and when the swap executes |
|------|------|
| **Impact** | User receives less than expected, or swap is refunded |
| **Mitigation** | Auto-refresh quotes every 15 seconds, display "Minimum received" with slippage factored in, warn users about price impact > 3%, route IDs expire after 60 seconds forcing fresh quotes |

### 8.3 Network Congestion

| Risk | Blockchain congestion causes slow confirmations or failed transactions |
|------|------|
| **Impact** | Long wait times, stuck transactions |
| **Mitigation** | Display estimated time prominently, support FeeOption.Fast for higher gas, adaptive polling with timeout (10 minutes max), show block explorer link so users can monitor independently |

### 8.4 Cross-Chain Complexity

| Risk | Cross-chain swaps involve multiple blockchains with different confirmation times and failure modes |
|------|------|
| **Impact** | User confusion, difficult error handling |
| **Mitigation** | Multi-leg transaction display in status dialog, clear status descriptions for each leg, SwapKit tracking API provides per-leg status, handle "refunded" status with clear messaging |

### 8.5 Wallet Compatibility

| Risk | Some wallets may not support all chains or transaction types |
|------|------|
| **Impact** | Swap fails at signing step |
| **Mitigation** | Dynamic.xyz handles wallet capability detection, filter available tokens based on connected wallet's supported chains, show clear error if wallet can't sign for selected chain, support multiple simultaneous wallet connections |

### 8.6 SwapKit SDK Bundle Size

| Risk | Full `@swapkit/sdk` package includes all chain toolboxes, inflating bundle |
|------|------|
| **Impact** | Slow page loads, poor Lighthouse score |
| **Mitigation** | Use dynamic import (`import()`) for SwapKit SDK, use granular imports in Phase 4 (`SwapKit()` with only needed plugins/wallets), code splitting per route |

### 8.7 Route ID Expiration

| Risk | Route ID from quote expires (60 seconds) before user confirms swap |
|------|------|
| **Impact** | Swap API call fails with expired route |
| **Mitigation** | Display countdown timer on quote, auto-refresh quote before expiration, re-fetch quote immediately before swap execution if > 30 seconds old, clear error message with "Get New Quote" action if expired |

### 8.8 THORChain Smart Contract Limitations

| Risk | THORChain rejects EIP-7702 transactions and has a 50-log limit on inbound transactions |
|------|------|
| **Impact** | Loss of funds if wrong transaction type is used |
| **Mitigation** | Enforce Legacy (Type 0) or EIP-1559 (Type 2) transaction types for THORChain routes, validate transaction format before signing, SwapKit SDK handles this internally but add client-side checks as safety net |

---

## 9. Testing Strategy

### 9.1 Unit Tests

| Target | What to Test | Tools |
|--------|-------------|-------|
| Use cases | Business logic in isolation (quote validation, error categorization, result formatting) | Vitest + mock SwapKit API responses |
| Repositories | Swap transaction CRUD operations | Vitest + test database |
| Zod schemas | Schema validation for all swap entities (Token, Quote, SwapParams, etc.) | Vitest |
| Utility functions | Debounce, token formatting, address validation, amount parsing | Vitest |

### 9.2 Integration Tests

| Target | What to Test | Tools |
|--------|-------------|-------|
| Server actions | Quote action returns correct shape, handles API errors, validates inputs | Vitest + MSW (Mock Service Worker) for SwapKit API |
| Swap flow | Full flow from quote to swap execution to status tracking (mocked APIs) | Vitest + React Testing Library |
| Database operations | Transaction save/read/update with real test database | Vitest + Docker PostgreSQL |

### 9.3 E2E Tests

| Critical Path | Steps | Tools |
|--------------|-------|-------|
| Connect wallet | Load page -> click connect -> select wallet -> verify address shown | Playwright + Mock wallet |
| Get a quote | Select tokens -> enter amount -> verify quote displayed | Playwright |
| Execute swap | Full flow with mocked SwapKit API and wallet signing | Playwright |
| Track transaction | Verify status dialog updates through lifecycle | Playwright |

### 9.4 Manual Testing Checklist

- [ ] Connect each supported wallet type (MetaMask, Phantom, embedded)
- [ ] Swap between same-chain tokens (ETH -> USDC on Ethereum)
- [ ] Swap between cross-chain tokens (ETH -> BTC)
- [ ] Test with insufficient balance (verify error message)
- [ ] Test with no route available (verify error message)
- [ ] Test slippage exceeded scenario (verify refund tracking)
- [ ] Test wallet disconnection during swap
- [ ] Test on mobile devices (responsive layout)
- [ ] Test dark/light mode theming

---

## 10. Success Metrics

### 10.1 Functional Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Swap success rate | > 95% of initiated swaps complete | Track completed vs failed in swap_transactions table |
| Quote accuracy | < 2% deviation between quoted and actual received amount | Compare expectedBuyAmount vs actual toAmount |
| Route coverage | Support top 20 token pairs by volume | Verify quotes return for top pairs |

### 10.2 Performance Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Page load (LCP) | < 2.5 seconds | Lighthouse audit on /swap page |
| Time to first quote | < 3 seconds after amount entry | Measure from input debounce end to quote render |
| Bundle size (swap chunk) | < 200KB gzipped | Next.js build analyzer |
| Quote refresh latency | < 1 second | Measure server action round-trip time |

### 10.3 User Experience Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Swap completion rate | > 70% of users who get a quote proceed to swap | Analytics funnel: quote displayed -> swap clicked -> tx confirmed |
| Wallet connection success | > 90% | Track Dynamic.xyz onAuthSuccess vs onAuthFailure events |
| Error recovery rate | > 50% of failed swaps are retried successfully | Track retry attempts after failure |
| Time from page load to first swap | < 60 seconds for returning users | Analytics timing |

### 10.4 Reliability Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| API availability | > 99.5% uptime for quote fetching | Monitor server action error rates |
| Error rate | < 5% of API calls result in errors | Server-side logging with Pino |
| Transaction tracking accuracy | 100% of submitted txs are trackable | Verify all saved tx hashes resolve via /track endpoint |

---

## Appendix A: Package Version Reference

| Package | Version | Purpose |
|---------|---------|---------|
| `@swapkit/sdk` | ^4.2.11 | Swap engine SDK |
| `@dynamic-labs/sdk-react-core` | ^4.47.x | Wallet connection core |
| `@dynamic-labs/ethereum` | ^4.47.x | EVM wallet connectors |
| `@dynamic-labs/solana` | ^4.47.x | Solana wallet connectors |
| `@dynamic-labs/ethers-v6` | ^4.47.x | Ethers.js bridge (optional) |

## Appendix B: Key API Endpoints (SwapKit)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v3/quote` | POST | Get swap quotes with routes |
| `/v3/swap` | POST | Build swap transaction from route |
| `/track` | POST | Track transaction status |
| `/tokens` | GET | List supported tokens |
| `/providers` | GET | List available liquidity providers |

## Appendix C: Research Documents

Detailed research documents are available at:
- `docs/research/swapkit-research.md` -- SwapKit SDK API reference, code examples, limitations
- `docs/research/dynamic-xyz-research.md` -- Dynamic.xyz wallet SDK, hooks, components, integration patterns
- `docs/research/architecture-patterns.md` -- Component structure, use cases, caching strategy, state management, data flows
