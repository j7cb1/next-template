# SwapKit SDK Research Document

> Last updated: 2026-02-12
> SDK Version: @swapkit/sdk v4.2.11
> Sources: docs.swapkit.dev, swapkit.github.io/SwapKit, github.com/swapkit/SwapKit

---

## Table of Contents

1. [Overview](#1-overview)
2. [Installation & Setup](#2-installation--setup)
3. [Core SDK Architecture](#3-core-sdk-architecture)
4. [Getting Price Quotes](#4-getting-price-quotes)
5. [Executing Swaps](#5-executing-swaps)
6. [Transaction Tracking](#6-transaction-tracking)
7. [Supported Chains & Tokens](#7-supported-chains--tokens)
8. [Routing & Providers](#8-routing--providers)
9. [API vs SDK](#9-api-vs-sdk)
10. [Error Handling](#10-error-handling)
11. [Next.js Considerations](#11-nextjs-considerations)
12. [Asset Identifier Format](#12-asset-identifier-format)
13. [Pricing & Monetization](#13-pricing--monetization)
14. [Limitations & Gotchas](#14-limitations--gotchas)
15. [Implementation Recommendations](#15-implementation-recommendations)

---

## 1. Overview

SwapKit is a comprehensive SDK and API for building cross-chain crypto swap applications. It is developed by THORSwap and provides non-custodial DeFi tools to swap 10,000+ crypto assets across 30+ blockchains. The SDK powers the THORSwap frontend and is open-source.

**Key capabilities:**
- Cross-chain token swaps (e.g., BTC to ETH natively)
- Single-chain DEX aggregation (via 1inch, Jupiter)
- Multi-chain wallet management
- Transaction tracking across chains
- AML compliance screening on addresses
- Affiliate fee monetization

**Liquidity sources:** THORChain, Chainflip, Maya Protocol, NEAR Intents

---

## 2. Installation & Setup

### 2.1 Package Installation

The main package is `@swapkit/sdk` which bundles all wallets, core, api, and types.

```bash
# Any package manager works
npm install @swapkit/sdk
pnpm add @swapkit/sdk
yarn add @swapkit/sdk
bun add @swapkit/sdk
```

**Current version:** 4.2.11 (as of Feb 2026)

**Individual packages** (if you only need specific parts):
- `@swapkit/api` (v2.9.8) - API client only
- `@swapkit/tokens` - Token lists

### 2.2 Requirements

- Node.js 18+ or Bun
- TypeScript recommended

### 2.3 Basic Initialization

```typescript
import { createSwapKit } from "@swapkit/sdk";

// Minimal setup (works for development)
const swapKit = createSwapKit();
```

### 2.4 Production Configuration

```typescript
import { createSwapKit } from "@swapkit/sdk";

const swapKit = createSwapKit({
  config: {
    apiKeys: {
      swapKit: "your-swapkit-api-key",        // Required for production
      walletConnectProjectId: "your-wc-id",   // For WalletConnect
      blockchair: "your-blockchair-key",       // For UTXO chains
    },
    rpcUrls: {
      ETH: "https://eth-mainnet.g.alchemy.com/v2/your-key",
      AVAX: "https://api.avax.network/ext/bc/C/rpc",
    },
  },
});
```

### 2.5 Environment Variables Needed

```env
NEXT_PUBLIC_SWAPKIT_API_KEY=your-swapkit-api-key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-wc-project-id
NEXT_PUBLIC_BLOCKCHAIR_API_KEY=your-blockchair-key  # Optional, for UTXO chains
NEXT_PUBLIC_ALCHEMY_KEY=your-alchemy-key            # Optional, for custom RPCs
```

### 2.6 Runtime Configuration Updates (v4 Feature)

SwapKit v4 allows updating configuration without recreating the client:

```typescript
import { SKConfig, Chain } from "@swapkit/sdk";

// Update individual settings at runtime
SKConfig.setRpcUrl(Chain.Ethereum, "https://new-rpc-url");
SKConfig.setApiKey("swapKit", "new-api-key");

// Or bulk update
SKConfig.set({
  rpcUrls: {
    [Chain.Ethereum]: "https://...",
    [Chain.Arbitrum]: "https://...",
  },
  apiKeys: {
    blockchair: "key",
    swapKit: "key",
  },
  envs: {
    isStagenet: false,
    isDev: false,
  },
});
```

---

## 3. Core SDK Architecture

### 3.1 Two Approaches

SwapKit offers two implementation patterns:

#### All-in-One (Recommended for backends and simple frontends)

```typescript
import { createSwapKit } from "@swapkit/sdk";
const swapKit = createSwapKit();
```

Includes all wallets, plugins, and chains automatically.

#### Granular / Modular (Recommended for frontends - smaller bundle)

```typescript
import { SwapKit, ThorchainPlugin, keystoreWallet, ledgerWallet } from "@swapkit/sdk";

const swapKit = SwapKit({
  plugins: {
    ...ThorchainPlugin,
  },
  wallets: {
    ...keystoreWallet,
    ...ledgerWallet,
  },
});
```

### 3.2 Key Exports

```typescript
import {
  createSwapKit,   // All-in-one client factory
  SwapKit,         // Granular client factory
  SwapKitApi,      // Static API methods (getSwapQuote, etc.)
  Chain,           // Chain enum (Chain.Ethereum, Chain.Bitcoin, etc.)
  AssetValue,      // Asset value helper
  WalletOption,    // Wallet enum (METAMASK, KEPLR, LEDGER, etc.)
  FeeOption,       // Fee option enum (Fast, Average, etc.)
  SwapKitError,    // Typed error class
  SKConfig,        // Runtime configuration
  getToolbox,      // Direct chain toolbox access
} from "@swapkit/sdk";
```

### 3.3 Plugin System

SwapKit v4 uses a plugin architecture. Available plugins include:
- `ThorchainPlugin` - THORChain swap operations
- `EVMPlugin` - EVM chain operations
- Custom plugins via `createPlugin` helper

### 3.4 Wallet System

Wallet connectors available:
- `keystoreWallet` - Keystore/mnemonic
- `ledgerWallet` - Ledger hardware
- `evmWallet` - MetaMask, injected EVM wallets
- `keplrWallet` - Keplr (Cosmos)
- `phantomWallet` - Phantom (Solana)
- `xamanWallet` - Xaman (XRP)

---

## 4. Getting Price Quotes

### 4.1 Via SDK (SwapKitApi)

```typescript
import { SwapKitApi, Chain } from "@swapkit/sdk";

const quoteParams = {
  sellAsset: "ETH.ETH",
  sellAmount: "1",                          // Human-readable amount
  buyAsset: "BTC.BTC",
  sourceAddress: "0x...",                    // Optional (enables address screening)
  destinationAddress: "bc1q...",             // Optional
  slippage: 3,                              // Percentage (3 = 3%)
  providers: ["THORCHAIN", "CHAINFLIP"],     // Optional, defaults to all
};

const { routes } = await SwapKitApi.getSwapQuote(quoteParams);
const bestRoute = routes[0];

console.log(`Expected output: ${bestRoute.expectedBuyAmount}`);
console.log(`Expected output (max slippage): ${bestRoute.expectedBuyAmountMaxSlippage}`);
console.log(`Estimated time: ${bestRoute.estimatedTime.total} seconds`);
console.log(`Fees:`, bestRoute.fees);
```

### 4.2 Via REST API Directly

```bash
curl -X POST "https://api.swapkit.dev/v3/quote" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "sellAsset": "ETH.USDC-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "buyAsset": "BTC.BTC",
    "sellAmount": "300",
    "slippage": 2
  }'
```

### 4.3 Quote Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sellAsset` | string | Yes | Asset being sold (Chain.Ticker format) |
| `buyAsset` | string | Yes | Asset being purchased |
| `sellAmount` | string | Yes | Amount (decimals with dot separator) |
| `sourceAddress` | string | No | Sender address (enables AML screening) |
| `destinationAddress` | string | No | Receiver address (enables AML screening) |
| `slippage` | number | No | Max slippage as percentage (e.g., 5 = 5%) |
| `providers` | string[] | No | Filter providers (defaults to all) |
| `affiliateFee` | number | No | Affiliate fee in basis points (0-1000, max 10%) |
| `cfBoost` | boolean | No | Enable Chainflip boost for better rates |
| `maxExecutionTime` | number | No | Max execution time in seconds (filters slow routes) |

### 4.4 Quote Response Structure

```typescript
interface QuoteResponse {
  quoteId: string;           // UUID for this quote request
  routes: QuoteRoute[];      // Array of available routes
  providerErrors?: QuoteError[];  // Optional provider-specific errors
  error?: string;            // Root-level error for invalid requests
}

interface QuoteRoute {
  routeId: string;                    // UUID for this route (used in /swap)
  providers: string[];                // e.g., ["THORCHAIN"]
  sellAsset: string;
  buyAsset: string;
  sellAmount: string;                 // In smallest units
  expectedBuyAmount: string;          // Estimated output
  expectedBuyAmountMaxSlippage: string;  // Worst-case with slippage
  fees: Fee[];                        // All applicable fees
  estimatedTime: {
    inbound: number;
    swap: number;
    outbound: number;
    total: number;                    // In seconds
  };
  totalSlippageBps: number;           // Expected slippage in basis points
  legs: SwapLeg[];                    // Individual steps in the swap
  warnings: Warning[];
  meta: RouteMeta;                    // Asset details, pricing, images
  tags: string[];                     // "RECOMMENDED" | "CHEAPEST" | "FASTEST"
  nextActions: NextAction;            // Instructions for /swap call
}
```

### 4.5 Fee Types in Quote

| Fee Type | Description | Deducted From |
|----------|-------------|---------------|
| `inbound` | Transfer fee for sell asset from wallet | User's wallet |
| `network` | Blockchain transaction processing | Output |
| `affiliate` | Payment to affiliate | Output |
| `service` | SwapKit's operational fee | Output |
| `outbound` | Transfer cost for buy asset to destination | Output |
| `liquidity` | Provider's facilitation fee | Output |

### 4.6 Important Notes

- **Quotes are cached for 5 minutes** on the API side
- **Route IDs expire after 60 seconds** - must call /swap within this window
- Routes are tagged: `RECOMMENDED`, `CHEAPEST`, or `FASTEST`
- The `nextActions` field in the response tells you exactly what API call to make next

---

## 5. Executing Swaps

### 5.1 Full Swap Flow

1. Get a quote (see Section 4)
2. Display routes to user with pricing
3. User selects a route
4. Check token approval (EVM tokens only)
5. Execute the swap
6. Track the transaction

### 5.2 Token Approval (EVM Only)

Before swapping non-native EVM tokens, check and approve spending:

```typescript
import { AssetValue } from "@swapkit/sdk";

const assetValue = AssetValue.from({
  asset: "ETH.USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  value: 1000,
});

// Check if already approved
const isApproved = await swapKit.isAssetValueApproved(assetValue, contractAddress);

if (!isApproved) {
  // Approve the token for spending
  await swapKit.approveAssetValue(assetValue, contractAddress);
}
```

### 5.3 Execute Swap via SDK

```typescript
import { createSwapKit, FeeOption, SwapKitApi } from "@swapkit/sdk";

const swapKit = createSwapKit();

// Get quote first
const { routes } = await SwapKitApi.getSwapQuote({
  sellAsset: "ETH.ETH",
  buyAsset: "BTC.BTC",
  sellAmount: "0.1",
  sourceAddress: swapKit.getAddress(Chain.Ethereum),
  destinationAddress: swapKit.getAddress(Chain.Bitcoin),
  slippage: 3,
});

// Execute the swap
const txHash = await swapKit.swap({
  route: routes[0],               // The selected route from the quote
  feeOptionKey: FeeOption.Fast,    // Fast, Average, or other fee tiers
});

console.log(`Transaction hash: ${txHash}`);
```

### 5.4 Execute Swap via REST API

```bash
# Step 1: Get quote (see Section 4.2)
# Step 2: Use the routeId from the quote response

curl -X POST "https://api.swapkit.dev/v3/swap" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "routeId": "eed91159-86bd-4674-9558-48f7e4f8bac0",
    "sourceAddress": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "destinationAddress": "357a3So9CbsNfBBgFYACGvxxS6tMaDoa1P"
  }'
```

### 5.5 /v3/swap Response

The response includes:
- `tx` - Transaction data (string or object depending on chain type)
- `targetAddress` - Deposit address or contract address
- `inboundAddress` - Address monitoring incoming funds
- `txType` - Format specification: `"PSBT"` (UTXO), `"EVM"` (Ethereum/L2s), etc.
- Updated pricing for user confirmation before signing

### 5.6 Transaction Formats by Chain Type

| Sell Asset Chain | Transaction Format |
|------------------|--------------------|
| EVM chains (ETH, ARB, AVAX, etc.) | Standard Ethereum transaction object |
| Bitcoin, Litecoin, Dogecoin | PSBT (Partially Signed Bitcoin Transaction) hex string |
| Cosmos-based chains | Cosmos TxBody |
| Bitcoin Cash | Inputs/outputs for TransactionBuilder |
| XRP | Payment transaction |
| Solana | Solana transaction |

### 5.7 Validations During /swap

The `/swap` endpoint automatically performs:
1. **Balance verification** - Confirms sufficient funds
2. **Transaction building** - Constructs the transaction (may fail if fees exceed balance)
3. **Address screening** - AML compliance check on all addresses

---

## 6. Transaction Tracking

### 6.1 Track Endpoint

```bash
curl -X POST "https://api.swapkit.dev/track" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "hash": "0xabcdef1234567890...",
    "chainId": "ETH"
  }'
```

### 6.2 Transaction Status Values

| Status | Meaning |
|--------|---------|
| `not_started` | Swap hasn't initiated yet |
| `pending` | Detected in mempool, awaiting confirmation |
| `swapping` | Swap is in progress (cross-chain processing) |
| `completed` | Successfully finished |
| `refunded` | Reversed due to slippage limits exceeded |
| `failed` | Inbound contract error |
| `unknown` | Other/unrecognized scenarios |

### 6.3 Track Response Structure

```typescript
interface TrackResponse {
  chainId: string;
  hash: string;
  block: number;
  type: string;
  fromAsset: string;
  fromAmount: string;
  toAsset: string;
  toAmount: string;
  fromAddress: string;
  toAddress: string;
  provider: string;
  status: TransactionStatus;       // See status values above
  completedAt?: string;
  legs: TransactionLeg[];          // Multi-step breakdown
  meta: TransactionMeta;           // Token images, etc.
}
```

### 6.4 Tracking UI

SwapKit provides a hosted tracking interface:
- Base URL: `https://track.swapkit.dev/`
- Direct link format: `https://track.swapkit.dev/?hash={{txHash}}`

### 6.5 Polling Strategy (Recommended)

```typescript
async function pollTransactionStatus(hash: string, chainId: string) {
  const maxAttempts = 60;  // ~10 minutes at 10s intervals
  const interval = 10000;  // 10 seconds

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch("https://api.swapkit.dev/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_SWAPKIT_API_KEY!,
      },
      body: JSON.stringify({ hash, chainId }),
    });

    const data = await response.json();

    if (data.status === "completed" || data.status === "failed" || data.status === "refunded") {
      return data;
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error("Transaction tracking timed out");
}
```

---

## 7. Supported Chains & Tokens

### 7.1 Chain Enum

```typescript
import { Chain } from "@swapkit/sdk";

// Available chains (30+ total)
Chain.Ethereum     // ETH
Chain.Bitcoin      // BTC
Chain.Solana       // SOL
Chain.Arbitrum     // ARB
Chain.Avalanche    // AVAX
Chain.BinanceSmartChain  // BSC
Chain.Cosmos       // GAIA
Chain.THORChain    // THOR
Chain.Maya         // MAYA
Chain.Optimism     // OP
Chain.Polygon      // MATIC
Chain.Base         // BASE
Chain.Litecoin     // LTC
Chain.Dogecoin     // DOGE
Chain.BitcoinCash  // BCH
Chain.Ripple       // XRP
Chain.Dash         // DASH
Chain.Kujira       // KUJI
Chain.Polkadot     // DOT
Chain.Chainflip    // FLIP
// ... and more
```

### 7.2 Token Support

- **10,000+ tokens** supported across all chains
- Native tokens (BTC, ETH, SOL, etc.)
- ERC-20 tokens on EVM chains
- SPL tokens on Solana
- Cosmos IBC tokens
- XRP Ledger tokens

### 7.3 Fetching Supported Tokens

```bash
# REST API endpoint to fetch supported tokens
curl "https://api.swapkit.dev/tokens" \
  -H "x-api-key: YOUR_API_KEY"
```

### 7.4 Fetching Available Providers

```bash
# REST API endpoint to list providers and their supported chains
curl "https://api.swapkit.dev/providers" \
  -H "x-api-key: YOUR_API_KEY"
```

---

## 8. Routing & Providers

### 8.1 Liquidity Providers

| Provider | Type | Supported Chains |
|----------|------|-----------------|
| **THORChain** | Cross-chain DEX | BTC, ETH, BNB, AVAX, ATOM, DOGE, BCH, LTC, Base, XRP, TRON |
| **Chainflip** | Cross-chain DEX | BTC, ETH, DOT, ARB, SOL |
| **Maya Protocol** | Cross-chain DEX | BTC, ETH, THOR, DASH, KUJI, ARB |
| **NEAR Intents** | Cross-chain routing | Growing list of chains |
| **1inch** | Single-chain aggregator | ETH, AVAX, ARB, BSC |
| **Jupiter** | Single-chain aggregator | SOL |

### 8.2 Swap Types

1. **Cross-Chain Swaps**: Direct asset exchanges between different blockchain networks in a single transaction. Powered by THORChain, NEAR Intents, Chainflip, and Maya Protocol.

2. **Single-Chain Swaps**: Transactions within one blockchain using 1inch (EVM chains) or Jupiter (Solana).

3. **Cross-Chain DEX Aggregation (Swap Ins)**: A single-chain swap followed by a cross-chain transfer. Example: swap USDC to ETH on Ethereum via 1inch, then bridge ETH to BTC via THORChain.

### 8.3 How Routing Works

When you request a quote without specifying `providers`, SwapKit queries all available providers and returns routes sorted by output amount. Each route is tagged:

- **RECOMMENDED** - Best overall route considering output and speed
- **CHEAPEST** - Route with maximum output value
- **FASTEST** - Route with shortest total execution time

You can filter providers in the quote request:

```typescript
const { routes } = await SwapKitApi.getSwapQuote({
  sellAsset: "ETH.ETH",
  buyAsset: "BTC.BTC",
  sellAmount: "1",
  providers: ["THORCHAIN"],  // Only get THORChain routes
});
```

---

## 9. API vs SDK

### 9.1 Comparison

| Feature | REST API | SDK |
|---------|----------|-----|
| **Quotes** | POST /v3/quote | SwapKitApi.getSwapQuote() |
| **Swap building** | POST /v3/swap | swapKit.swap() |
| **Tracking** | POST /track | Manual via API |
| **Wallet management** | Not included | Built-in (MetaMask, Ledger, etc.) |
| **Token approval** | Manual implementation | swapKit.approveAssetValue() |
| **Transaction signing** | Manual per chain | Handled by SDK wallet connectors |
| **Bundle size** | Zero (server-side only) | Large (includes all chain toolboxes) |
| **SSR-safe** | Yes | No (requires client-side) |

### 9.2 When to Use the REST API

- **Backend-only implementation** where you manage wallets/signing separately
- **Server-side quote fetching** for price display
- **Minimal bundle size** requirements
- **Integration with external wallet providers** (like Dynamic.xyz)

### 9.3 When to Use the SDK

- **Full-featured swap UI** with built-in wallet management
- **Need token approvals** handled automatically
- **Want unified interface** across all chains
- **Rapid prototyping** and development

### 9.4 Hybrid Approach (Recommended for Our Use Case)

Use the REST API for server-side operations (quotes, tracking) and the SDK client-side only for wallet interactions and swap execution:

```typescript
// Server-side: fetch quotes via REST API (Next.js server action)
"use server";
export async function getQuoteAction(params: QuoteParams) {
  const response = await fetch("https://api.swapkit.dev/v3/quote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.SWAPKIT_API_KEY!,  // Server-only env var
    },
    body: JSON.stringify(params),
  });
  return response.json();
}

// Client-side: execute swap via SDK
"use client";
const txHash = await swapKit.swap({
  route: selectedRoute,
  feeOptionKey: FeeOption.Fast,
});
```

---

## 10. Error Handling

### 10.1 Quote Errors

| Error Code | HTTP Status | Scenario |
|------------|-------------|----------|
| `noRoutesFound` | 404 | No valid swap path exists between the token pair |
| `blackListAsset` | 400 | Asset is blacklisted (scam token detected) |
| `apiKeyInvalid` / `unauthorized` | 401 | Missing, expired, or invalid API key |
| `invalidRequest` | 400 | Invalid or missing JSON body |

### 10.2 Swap Errors

| Error Type | Description |
|------------|-------------|
| `insufficientBalance` | Not enough funds for the sellAmount |
| `insufficientAllowance` | ERC-20 token not approved for spending |
| `unableToBuildTransaction` | Enough tokens but not enough for network fees |

Error response format:
```json
{
  "message": "Cannot build transaction. Insufficient balance for asset ETH.ETH amount 1.5",
  "error": "insufficientBalance",
  "data": {
    "chain": "ETH.ETH",
    "amount": "1.5",
    "address": "0x..."
  }
}
```

### 10.3 SDK Error Handling

```typescript
import { SwapKitError, FeeOption } from "@swapkit/sdk";

try {
  const txHash = await swapKit.swap({
    route: selectedRoute,
    feeOptionKey: FeeOption.Fast,
  });
} catch (error) {
  if (error instanceof SwapKitError) {
    console.error("SwapKit Error:", error.message);
    // Handle specific SwapKit errors
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### 10.4 Handling No Routes

```typescript
const quoteResponse = await SwapKitApi.getSwapQuote(params);

if (!quoteResponse.routes || quoteResponse.routes.length === 0) {
  // Check providerErrors for details
  if (quoteResponse.providerErrors) {
    console.log("Provider errors:", quoteResponse.providerErrors);
  }
  throw new Error("No swap routes available for this pair");
}
```

### 10.5 Slippage Handling

- Set slippage in the quote request (percentage, e.g., 3 = 3%)
- If actual slippage exceeds the limit during execution, the transaction is **refunded** (status: `refunded` in tracking)
- The `expectedBuyAmountMaxSlippage` field shows worst-case output
- Recommended default slippage: 2-3% for most pairs, 5%+ for volatile or low-liquidity pairs

---

## 11. Next.js Considerations

### 11.1 Client vs Server

The SwapKit SDK (`createSwapKit`, wallet connectors) is **client-side only** because:
- It interacts with browser wallet extensions (MetaMask, Keplr, etc.)
- It uses browser APIs for signing transactions
- Bundle includes chain-specific toolboxes with browser dependencies

**All swap UI components must use `"use client"` directive.**

### 11.2 Recommended Architecture for Next.js

```
Server Side (Server Actions / API Routes):
├── Quote fetching (REST API via fetch)
├── Transaction tracking (REST API via fetch)
├── Token list caching
└── API key storage (not exposed to client)

Client Side ("use client" components):
├── SwapKit SDK initialization
├── Wallet connection/management
├── Swap execution
├── Token approval
└── Balance queries
```

### 11.3 Dynamic Import for SDK

To avoid SSR issues, use dynamic imports:

```typescript
// components/swap/swap-provider.tsx
"use client";

import { useEffect, useState } from "react";

export function useSwapKit() {
  const [swapKit, setSwapKit] = useState<any>(null);

  useEffect(() => {
    async function initSwapKit() {
      const { createSwapKit } = await import("@swapkit/sdk");
      const client = createSwapKit({
        config: {
          apiKeys: {
            swapKit: process.env.NEXT_PUBLIC_SWAPKIT_API_KEY!,
          },
        },
      });
      setSwapKit(client);
    }
    initSwapKit();
  }, []);

  return swapKit;
}
```

### 11.4 Server Actions for Quotes

```typescript
// use-cases/swap/get-quote-action.ts
"use server";

export async function getSwapQuoteAction(params: {
  sellAsset: string;
  buyAsset: string;
  sellAmount: string;
  slippage?: number;
}) {
  const response = await fetch("https://api.swapkit.dev/v3/quote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.SWAPKIT_API_KEY!, // Server-only
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    return { data: null, error: `Quote failed: ${response.statusText}` };
  }

  const data = await response.json();
  return { data, error: null };
}
```

### 11.5 Avoiding Hydration Mismatches

- Do not render wallet-dependent data during SSR
- Use loading states for wallet balances
- Initialize SwapKit only inside `useEffect`

---

## 12. Asset Identifier Format

SwapKit uses a specific format for identifying assets, derived from THORChain notation.

### 12.1 Format

```
CHAIN.TICKER                          # Native assets
CHAIN.TICKER-CONTRACT_ADDRESS         # Tokens with contract addresses
```

### 12.2 Examples

```
BTC.BTC                               # Bitcoin
ETH.ETH                               # Ethereum
SOL.SOL                               # Solana
GAIA.ATOM                             # Cosmos Hub ATOM
THOR.RUNE                             # THORChain RUNE
ETH.USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48    # USDC on Ethereum
ETH.USDT-0xdAC17F958D2ee523a2206206994597C13D831ec7    # USDT on Ethereum
AVAX.USDC-0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E   # USDC on Avalanche
ARB.USDC-0xaf88d065e77c8cC2239327C5EDb3A432268e5831    # USDC on Arbitrum
```

### 12.3 AssetValue Helper

```typescript
import { AssetValue } from "@swapkit/sdk";

// Create asset values for use in operations
const eth = AssetValue.from({ asset: "ETH.ETH", value: 1 });
const btc = AssetValue.from({ asset: "BTC.BTC", value: 0.1 });
const usdc = AssetValue.from({
  asset: "ETH.USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  value: 1000,
});
```

---

## 13. Pricing & Monetization

### 13.1 SwapKit Fees

| Volume Tier | Fee Rate |
|-------------|----------|
| $0 - $500K | 0.15% (15 bps) |
| $500K - $1M | 0.12% (12 bps) |
| Above $1M | 0.10% (10 bps) |
| Stablecoin pairs | 0.01% (1 bps) |

### 13.2 API Access Pricing

- **Free** API access for development (all chains, assets, routes, providers)
- Fees are only applied on executed swaps
- Collected automatically via smart contract (SwapKit Router)

### 13.3 Getting an API Key

1. Register at `https://dashboard.swapkit.dev/`
2. Generate and name your API key
3. For partnership/enterprise: contact `partnerships.swapkit.dev`

### 13.4 Affiliate Monetization

Integrators can earn affiliate fees on swaps:

```typescript
// Include affiliate fee in quote request
const { routes } = await SwapKitApi.getSwapQuote({
  sellAsset: "ETH.ETH",
  buyAsset: "BTC.BTC",
  sellAmount: "1",
  affiliateFee: 50,  // 50 basis points = 0.5%
});
```

Affiliate identifiers are configured per provider:
- **THORName** (THORChain) - up to 3 characters
- **MAYAName** (Maya Protocol)
- **Chainflip Broker** (Chainflip)
- **NEAR Name** (NEAR)

Revenue is collected by including `x-api-key` header in `/swap` calls.

---

## 14. Limitations & Gotchas

### 14.1 Smart Contract Limitations

- **THORChain & Maya reject Type 4 (EIP-7702) transactions.** Only Legacy (Type 0) and EIP-1559 (Type 2) are supported. Non-compliance can cause loss of funds.
- **50 log limit:** Inbound transactions to THORChain/Maya have a maximum of 50 logs. Exceeding this means THORChain will not process the transaction. This impacts smart contract wrappers with complex logic.
- **Smart contract receivers filtered by default.** THORChain/Maya routes are hidden when sender or receiver is a smart contract due to strict gas limits. Use `allowSmartContractReceiver` parameter only if your contract meets THORChain's gas requirements.

### 14.2 XRP-Specific Constraints

- Only "Payment" transaction type works for transfers
- Classic addresses (r...) required; X-addresses are unsupported
- Only first memo entry in arrays is processed; max 250 characters

### 14.3 Route ID Expiration

- Route IDs from `/v3/quote` are **valid for only 60 seconds**
- Must call `/v3/swap` within this window
- Quotes are cached for 5 minutes on the API side

### 14.4 Bundle Size

- The `@swapkit/sdk` all-in-one package includes all chain toolboxes and wallets
- For production frontends, use the **granular approach** with only needed plugins/wallets
- Consider code splitting and dynamic imports

### 14.5 Chainflip-Specific

- Chainflip supports all EVM transaction types including Type 4 (unlike THORChain)
- Requires a broker URL configuration for channel creation

### 14.6 Cross-Chain Swap Timing

- Cross-chain swaps are NOT instant
- THORChain swaps can take 5-30+ minutes depending on chains involved
- Bitcoin confirmations add significant time (10-60 min)
- Always implement proper loading/pending states in the UI

### 14.7 Refunds

- If slippage exceeds the limit, the swap is refunded to the source address
- Refunds may take additional time (especially for UTXO chains)
- Track refund status via the `/track` endpoint

---

## 15. Implementation Recommendations

### 15.1 Recommended Architecture for This Project

Given the Next.js template with clean architecture patterns:

```
use-cases/swap/
├── get-swap-quote-query-key.ts       # TanStack Query cache key
├── get-swap-quote-use-case.ts        # Quote fetching logic (server)
├── get-swap-quote-action.ts          # Server action wrapper
├── execute-swap-use-case.ts          # Swap execution logic (client)
├── track-swap-use-case.ts            # Transaction tracking (server)
├── track-swap-action.ts              # Server action wrapper
└── types.ts                          # Swap-related TypeScript types

repositories/swap/
├── swap-api-repository.ts            # REST API calls to SwapKit
└── types.ts                          # API response types

components/swap/
├── swap-form.tsx                     # Main swap form (client component)
├── token-selector.tsx                # Token/chain selection
├── quote-display.tsx                 # Show quote details
├── swap-confirmation.tsx             # Pre-sign confirmation
└── transaction-status.tsx            # Track transaction progress
```

### 15.2 Key Design Decisions

1. **Use REST API for quotes** (server-side, protects API key)
2. **Use SDK only client-side** for wallet connection and swap execution
3. **Consider using Dynamic.xyz for wallet management** instead of SwapKit's built-in wallets (more flexible, better UX)
4. **Use TanStack Query** for quote polling/caching
5. **Implement proper error boundaries** around swap components
6. **Store transaction history** locally or in DB for user reference

### 15.3 Security Considerations

- Never expose the SwapKit API key on the client side
- Use server actions or API routes as a proxy for SwapKit API calls
- Validate all user inputs before passing to the API
- Implement rate limiting on quote requests to prevent abuse
- Always verify quote amounts client-side before showing to users

---

## References

- SwapKit Documentation: https://docs.swapkit.dev
- SwapKit SDK Docs: https://swapkit.github.io/SwapKit/
- SwapKit Website: https://swapkit.dev
- GitHub Repository: https://github.com/swapkit/SwapKit
- npm Package: https://www.npmjs.com/package/@swapkit/sdk
- API Dashboard: https://dashboard.swapkit.dev
- Transaction Tracker: https://track.swapkit.dev
- THORChain Asset Notation: https://dev.thorchain.org/concepts/asset-notation.html
