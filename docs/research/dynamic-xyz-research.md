# Dynamic.xyz Wallet Connection SDK - Research Document

> Last updated: 2026-02-12
> SDK Version: v4.x (latest ~4.47.x)
> Sources: Dynamic.xyz official docs, npm registry, GitHub

---

## Table of Contents

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Next.js App Router Integration](#nextjs-app-router-integration)
4. [Wallet Connection](#wallet-connection)
5. [Multi-Chain Support](#multi-chain-support)
6. [Getting Wallet Data (Signer, Provider, Balance)](#getting-wallet-data)
7. [React Hooks Reference](#react-hooks-reference)
8. [React Components Reference](#react-components-reference)
9. [Authentication Flow & JWT](#authentication-flow--jwt)
10. [Event Callbacks](#event-callbacks)
11. [Embedded Wallets](#embedded-wallets)
12. [SSR / Hydration Considerations](#ssr--hydration-considerations)
13. [Integration with SwapKit](#integration-with-swapkit)
14. [Configuration & Environment Variables](#configuration--environment-variables)
15. [Styling & Theming](#styling--theming)
16. [Key Architectural Decisions](#key-architectural-decisions)

---

## 1. Overview

Dynamic.xyz is a wallet infrastructure platform providing embedded wallets, external wallet connections, and multi-chain connectivity in one unified SDK. It supports EVM chains, Solana, Bitcoin, Cosmos, and more.

**Key value proposition**: One SDK for both embedded wallets (email/social login) and external wallets (MetaMask, Phantom, etc.) with multi-chain support and a polished UI out of the box.

**Dashboard**: [app.dynamic.xyz](https://app.dynamic.xyz) - Configure wallets, chains, auth methods, and get your environment ID.

---

## 2. Installation & Setup

### Required Packages

```bash
# Core SDK (required)
npm install @dynamic-labs/sdk-react-core

# Chain-specific wallet connectors (install what you need)
npm install @dynamic-labs/ethereum        # EVM chains (Ethereum, Polygon, Arbitrum, Base, etc.)
npm install @dynamic-labs/solana          # Solana
# npm install @dynamic-labs/bitcoin       # Bitcoin
# npm install @dynamic-labs/cosmos        # Cosmos
# npm install @dynamic-labs/starknet      # Starknet

# Optional: Smart wallet / Account Abstraction
# npm install @dynamic-labs/ethereum-aa   # ZeroDev smart wallets

# Optional: Ethers.js support (SDK uses Viem by default)
# npm install @dynamic-labs/ethers-v6     # If you need ethers signer

# Optional: Required polyfills for some environments
# npm install crypto-browserify stream-browserify process
```

### Package Notes

- `@dynamic-labs/sdk-react-core` - The `-core` suffix means it is the modular version. You pick which chain connectors to import, keeping bundle size small.
- `@dynamic-labs/ethereum` includes all EVM-compatible chains (L1s and L2s like Base, Arbitrum, Optimism, Polygon) plus Dynamic embedded wallets.
- `@dynamic-labs/solana` includes Solana wallet connectors (Phantom, Solflare, etc.).
- All `@dynamic-labs/*` packages should be on the same version to avoid compatibility issues.
- Latest version as of Feb 2026: ~4.47.x (actively maintained, frequent releases).

---

## 3. Next.js App Router Integration

### Step 1: Create a Providers Component

Create a client-side providers wrapper. This is critical for Next.js App Router because `DynamicContextProvider` requires client-side rendering.

```tsx
// components/providers/dynamic-provider.tsx
"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";

interface DynamicProviderProps {
  children: React.ReactNode;
}

export function DynamicProvider({ children }: DynamicProviderProps) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
        walletConnectors: [
          EthereumWalletConnectors,
          SolanaWalletConnectors,
        ],
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}
```

### Step 2: Wrap Your App in the Provider

```tsx
// app/layout.tsx
import { DynamicProvider } from "@/components/providers/dynamic-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DynamicProvider>
          {children}
        </DynamicProvider>
      </body>
    </html>
  );
}
```

### Important Notes

- **"use client" directive**: The `DynamicProvider` component MUST have `"use client"` at the top. Do NOT put `"use client"` on `layout.tsx` itself, as that forces the entire app to client-render.
- **Provider placement**: Do not place any Dynamic components above `<DynamicContextProvider>` in the tree.
- **Environment variable**: Must use `NEXT_PUBLIC_` prefix for client-side access in Next.js.

---

## 4. Wallet Connection

### Using DynamicWidget (Recommended)

The easiest way to add wallet connection is with the `DynamicWidget` component:

```tsx
"use client";

import { DynamicWidget } from "@dynamic-labs/sdk-react-core";

export function WalletConnect() {
  return <DynamicWidget />;
}
```

`DynamicWidget` provides:
- Connect wallet button
- Wallet selection modal (shows all supported wallets)
- Connected wallet info display
- User profile dropdown
- Network switching UI
- Send/receive UI

### Using DynamicConnectButton (Standalone)

For a standalone connect button with custom styling:

```tsx
"use client";

import { DynamicConnectButton } from "@dynamic-labs/sdk-react-core";

export function ConnectButton() {
  return (
    <DynamicConnectButton>
      Connect Wallet
    </DynamicConnectButton>
  );
}
```

### Programmatic Connect/Disconnect

```tsx
"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

export function WalletActions() {
  const { setShowAuthFlow, handleLogOut, primaryWallet } = useDynamicContext();

  const connect = () => setShowAuthFlow(true);
  const disconnect = () => handleLogOut();

  return (
    <div>
      {primaryWallet ? (
        <>
          <p>Connected: {primaryWallet.address}</p>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

---

## 5. Multi-Chain Support

### Enabling Multiple Chains

Import and add wallet connectors for each chain family:

```tsx
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
// import { BitcoinWalletConnectors } from "@dynamic-labs/bitcoin";
// import { CosmosWalletConnectors } from "@dynamic-labs/cosmos";

<DynamicContextProvider
  settings={{
    environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
    walletConnectors: [
      EthereumWalletConnectors,
      SolanaWalletConnectors,
      // BitcoinWalletConnectors,
      // CosmosWalletConnectors,
    ],
  }}
>
```

### Chain Configuration in Dashboard

Chains and networks can also be configured in the Dynamic dashboard at [app.dynamic.xyz](https://app.dynamic.xyz). You can:
- Enable/disable specific chains
- Set default chain
- Configure RPC URLs
- Enable testnets

### Switching Networks

```tsx
"use client";

import { useSwitchNetwork } from "@dynamic-labs/sdk-react-core";

export function NetworkSwitcher() {
  const switchNetwork = useSwitchNetwork();

  const handleSwitch = async () => {
    // Switch to Polygon (chainId 137)
    await switchNetwork({ networkId: 137 });
  };

  return <button onClick={handleSwitch}>Switch to Polygon</button>;
}
```

### Supported Chain Families

| Chain Family | Package | Includes |
|---|---|---|
| EVM | `@dynamic-labs/ethereum` | Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche, BSC, and all EVM L2s |
| Solana | `@dynamic-labs/solana` | Solana mainnet, devnet, testnet |
| Bitcoin | `@dynamic-labs/bitcoin` | Bitcoin mainnet |
| Cosmos | `@dynamic-labs/cosmos` | Cosmos Hub and Cosmos SDK chains |
| Starknet | `@dynamic-labs/starknet` | Starknet |

---

## 6. Getting Wallet Data

### Primary Wallet Access

```tsx
"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

export function WalletInfo() {
  const { primaryWallet } = useDynamicContext();

  if (!primaryWallet) return <p>No wallet connected</p>;

  return (
    <div>
      <p>Address: {primaryWallet.address}</p>
      <p>Chain: {primaryWallet.chain}</p>
      <p>Connector: {primaryWallet.connector?.name}</p>
    </div>
  );
}
```

### Getting a Viem Public Client (Read Data)

```tsx
const getBalance = async () => {
  if (!primaryWallet) return;

  const publicClient = await primaryWallet.connector?.getPublicClient();
  if (!publicClient) return;

  const balance = await publicClient.getBalance({
    address: primaryWallet.address as `0x${string}`,
  });

  return balance;
};
```

### Getting a Viem Wallet Client (Write Data / Sign Transactions)

This is the key method for getting a signer to pass to SwapKit or other transaction-signing SDKs.

```tsx
const getWalletClient = async () => {
  if (!primaryWallet) return;

  // Returns a Viem WalletClient
  const walletClient = await primaryWallet.connector?.getWalletClient();
  return walletClient;
};
```

### Getting an Ethers.js Signer (Alternative)

If you need an Ethers.js signer instead of Viem:

```bash
npm install @dynamic-labs/ethers-v6
```

```tsx
import { getEthersSigner } from "@dynamic-labs/ethers-v6";

const getSigner = async () => {
  if (!primaryWallet) return;
  const signer = await getEthersSigner(primaryWallet);
  return signer;
};
```

### Signing Messages

```tsx
const signMessage = async (message: string) => {
  if (!primaryWallet) return;

  const walletClient = await primaryWallet.connector?.getWalletClient();
  const signature = await walletClient?.signMessage({
    message,
    account: primaryWallet.address as `0x${string}`,
  });

  return signature;
};
```

### Sending Transactions

```tsx
const sendTransaction = async () => {
  if (!primaryWallet) return;

  const walletClient = await primaryWallet.connector?.getWalletClient();
  const txHash = await walletClient?.sendTransaction({
    to: "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`,
    value: BigInt("1000000000000000000"), // 1 ETH in wei
  });

  return txHash;
};
```

---

## 7. React Hooks Reference

### Core Hooks

| Hook | Package | Purpose |
|---|---|---|
| `useDynamicContext` | `@dynamic-labs/sdk-react-core` | Access full Dynamic context (primaryWallet, user, auth state, etc.) |
| `useIsLoggedIn` | `@dynamic-labs/sdk-react-core` | Boolean - whether user is authenticated |
| `useUserWallets` | `@dynamic-labs/sdk-react-core` | Array of all connected wallets for current user |
| `useSwitchNetwork` | `@dynamic-labs/sdk-react-core` | Function to switch the active network |
| `useSendBalance` | `@dynamic-labs/sdk-react-core` | Trigger the send balance UI |
| `useWalletOptions` | `@dynamic-labs/sdk-react-core` | Start process of connecting to a specific wallet |
| `useWalletConnectorEvent` | `@dynamic-labs/sdk-react-core` | Listen for wallet events (account change, chain change, disconnect) |
| `useExternalAuth` | `@dynamic-labs/sdk-react-core` | External authentication integration |
| `useAuthenticateConnectedUser` | `@dynamic-labs/sdk-react-core` | Authenticate an already-connected wallet user |

### useDynamicContext - Key Properties

```tsx
const {
  // Wallet
  primaryWallet,           // The primary connected wallet object
  // Auth
  setShowAuthFlow,         // (show: boolean) => void - Show/hide auth modal
  handleLogOut,            // () => Promise<void> - Log out user
  // User
  user,                    // Current authenticated user object
  // UI
  setShowDynamicUserProfile, // (show: boolean) => void - Show/hide profile
  // Auth Token
  authToken,               // JWT auth token (string | undefined)
} = useDynamicContext();
```

### useIsLoggedIn

```tsx
import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core";

const isLoggedIn = useIsLoggedIn();
// Returns: boolean
```

### useUserWallets

```tsx
import { useUserWallets } from "@dynamic-labs/sdk-react-core";

const userWallets = useUserWallets();
// Returns: Wallet[] - array of all wallets connected by the user

userWallets.map((wallet) => ({
  id: wallet.id,
  address: wallet.address,
  chain: wallet.chain,
  connector: wallet.connector?.name,
}));
```

### useSendBalance

```tsx
import { useSendBalance } from "@dynamic-labs/sdk-react-core";

const { open } = useSendBalance();

// Open send UI with pre-filled values
open({
  recipientAddress: "0x...",
  value: "0.1",
});
```

---

## 8. React Components Reference

| Component | Purpose |
|---|---|
| `DynamicContextProvider` | Root provider - wraps your app, configures SDK |
| `DynamicWidget` | All-in-one widget: connect button + profile + network switcher |
| `DynamicConnectButton` | Standalone connect wallet button (accepts custom children) |
| `DynamicUserProfile` | User profile dialog/dropdown with wallet info |
| `DynamicEmbeddedWidget` | Embedded version of the widget (inline, not modal) |
| `DynamicNav` | Navigation component for wallet management |

### DynamicWidget Props

```tsx
<DynamicWidget
  innerButtonComponent={<span>Custom Button Text</span>}
  // variant="modal" | "dropdown"
/>
```

### DynamicConnectButton

```tsx
<DynamicConnectButton>
  <span className="custom-class">Connect Your Wallet</span>
</DynamicConnectButton>
```

### DynamicUserProfile

Should be placed as high as possible in the component tree to ensure it is always rendered.

```tsx
<DynamicUserProfile />
```

---

## 9. Authentication Flow & JWT

### How Auth Works

1. User clicks connect wallet (or email/social login)
2. Dynamic SDK handles the wallet signature or social auth
3. On success, Dynamic backend issues a **JWT token**
4. JWT is stored in `localStorage` and accessible via `useDynamicContext().authToken`
5. JWT can be sent to your backend for server-side verification

### Accessing the Auth Token

```tsx
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const { authToken } = useDynamicContext();

// Or using the utility function:
import { getAuthToken } from "@dynamic-labs/sdk-react-core";
const token = getAuthToken();
```

### JWT Payload Contents

The JWT contains:
- Wallet public address (proof of ownership)
- User identity data
- Environment ID
- Expiration timestamp
- Additional fields from onboarding (if configured)

### Server-Side Verification

Validate Dynamic's JWT using their JWKS endpoint:

```
https://app.dynamic.xyz/api/v0/sdk/{environmentId}/.well-known/jwks
```

Use a standard JWKS library (like `jose` or `jwks-rsa`) to validate the token server-side.

### Token Refresh

- Session keys are automatically refreshed when expired, as long as the JWT is valid
- The SDK handles token refresh automatically
- You can also use the API endpoint to manually refresh tokens

---

## 10. Event Callbacks

Configure event callbacks in the `DynamicContextProvider` settings:

```tsx
<DynamicContextProvider
  settings={{
    environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
    walletConnectors: [EthereumWalletConnectors],
    events: {
      onAuthSuccess: (args) => {
        console.log("Auth success:", args.user);
        // Redirect, sync with your backend, etc.
      },
      onAuthFailure: (args) => {
        console.log("Auth failed:", args);
      },
      onLogout: (args) => {
        console.log("User logged out:", args);
      },
      onAuthFlowOpen: () => {
        console.log("Auth flow opened");
      },
      onAuthFlowClose: () => {
        console.log("Auth flow closed");
      },
      onAuthFlowCancel: () => {
        console.log("Auth flow cancelled");
      },
      onAuthInit: () => {
        console.log("Auth initialized");
      },
      onEmbeddedWalletCreated: (args) => {
        console.log("Embedded wallet created:", args);
      },
    },
  }}
>
```

### Available Events

| Event | When Triggered |
|---|---|
| `onAuthSuccess` | User successfully authenticated |
| `onAuthFailure` | Authentication failed |
| `onAuthInit` | Auth flow initialized |
| `onAuthFlowOpen` | Auth modal opened |
| `onAuthFlowClose` | Auth modal closed |
| `onAuthFlowCancel` | User cancelled auth flow |
| `onLogout` | User logged out (explicit or token expired) |
| `onEmbeddedWalletCreated` | New embedded wallet created for user |

> **Note**: In SDK v4+, use the `events` prop (not the deprecated `eventsCallbacks` prop from v3).

---

## 11. Embedded Wallets

Dynamic supports embedded (MPC-based) wallets for users who don't have an external wallet. This enables email/social login flows.

### Setup

1. **Dashboard Configuration**: Go to [app.dynamic.xyz](https://app.dynamic.xyz) > Embedded Wallets
2. Enable "Create on Sign up" toggle
3. Select which chains to create embedded wallets on

### Supported Auth Methods for Embedded Wallets

- Email (magic link or OTP)
- Google
- Apple
- Discord
- GitHub
- Twitter/X
- Facebook
- Telegram
- Twitch
- Farcaster
- SMS

### How It Works

1. User authenticates via email or social login
2. User is prompted to create a passkey (biometrics)
3. Dynamic creates an MPC-based wallet for the user
4. Wallet is secured by TSS-MPC (Threshold Signature Scheme - Multi-Party Computation)
5. User can sign transactions using their passkey (no seed phrase needed)

### Enabling Email Login in Code

Email and social login methods are primarily configured via the Dynamic dashboard. The SDK respects the dashboard configuration automatically.

```tsx
<DynamicContextProvider
  settings={{
    environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
    walletConnectors: [EthereumWalletConnectors],
    // Embedded wallet options can be configured here if needed
  }}
>
```

---

## 12. SSR / Hydration Considerations

### Critical Rules for Next.js App Router

1. **All Dynamic components must be client-side only**. Always use `"use client"` directive.
2. **Create a separate providers file** - Never put `"use client"` on `layout.tsx` directly.
3. **Dynamic SDK relies on browser APIs** (localStorage, window) - It cannot run on the server.
4. **Hydration mismatch prevention**: Since wallet state only exists client-side, use conditional rendering or `useEffect` to avoid hydration mismatches.

### Pattern for Avoiding Hydration Issues

```tsx
"use client";

import { useState, useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

export function WalletDisplay() {
  const { primaryWallet } = useDynamicContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // or a skeleton/placeholder

  return (
    <div>
      {primaryWallet ? (
        <span>{primaryWallet.address}</span>
      ) : (
        <span>Not connected</span>
      )}
    </div>
  );
}
```

### Using next/dynamic for Heavy Components

```tsx
import dynamic from "next/dynamic";

const DynamicWidget = dynamic(
  () => import("@dynamic-labs/sdk-react-core").then((mod) => mod.DynamicWidget),
  { ssr: false }
);
```

---

## 13. Integration with SwapKit

There is no direct, documented integration between Dynamic.xyz and SwapKit. However, the integration pattern is straightforward since both work with standard wallet primitives.

### Strategy: Pass Viem Wallet Client from Dynamic to SwapKit

The key integration point is getting the wallet client (signer) from Dynamic and using it with SwapKit for transaction signing.

```tsx
"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

export function useSwapWallet() {
  const { primaryWallet } = useDynamicContext();

  const getWalletClient = async () => {
    if (!primaryWallet) return null;
    return primaryWallet.connector?.getWalletClient();
  };

  const getPublicClient = async () => {
    if (!primaryWallet) return null;
    return primaryWallet.connector?.getPublicClient();
  };

  const getAddress = () => {
    return primaryWallet?.address ?? null;
  };

  const getChainId = () => {
    return primaryWallet?.chain ? Number(primaryWallet.chain) : null;
  };

  return {
    primaryWallet,
    getWalletClient,
    getPublicClient,
    getAddress,
    getChainId,
    isConnected: !!primaryWallet,
  };
}
```

### Integration Pattern with SwapKit

SwapKit typically needs:
1. **Wallet address** - from `primaryWallet.address`
2. **Chain/network** - from `primaryWallet.chain`
3. **Signer/WalletClient** - from `primaryWallet.connector?.getWalletClient()`

The general flow:
1. User connects wallet via Dynamic
2. Get the Viem wallet client from Dynamic
3. Pass wallet client to SwapKit for transaction construction
4. SwapKit returns a transaction to sign
5. Use Dynamic's wallet client to sign and broadcast

```tsx
// Pseudo-code for the integration flow
const walletClient = await primaryWallet.connector?.getWalletClient();

// SwapKit constructs the swap transaction
const swapTx = await swapKit.buildSwapTransaction({
  from: primaryWallet.address,
  // ... swap parameters
});

// Sign and send via the Dynamic wallet client
const txHash = await walletClient.sendTransaction(swapTx);
```

### For Ethers.js-based SwapKit Integration

If SwapKit requires an Ethers.js signer:

```bash
npm install @dynamic-labs/ethers-v6
```

```tsx
import { getEthersSigner } from "@dynamic-labs/ethers-v6";

const signer = await getEthersSigner(primaryWallet);
// Pass signer to SwapKit
```

---

## 14. Configuration & Environment Variables

### Required Environment Variables

```env
# .env.local

# Required: Your Dynamic environment ID (from dashboard)
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your-environment-id-here

# The NEXT_PUBLIC_ prefix is required for Next.js client-side access
```

### Getting Your Environment ID

1. Go to [app.dynamic.xyz](https://app.dynamic.xyz)
2. Sign up / log in
3. Create a new project (or select existing)
4. Navigate to **Dashboard > Developer > API**
5. Copy the **Environment ID**

### Dashboard Configuration

The Dynamic dashboard ([app.dynamic.xyz](https://app.dynamic.xyz)) controls:

| Setting | Location | Purpose |
|---|---|---|
| Environment ID | Developer > API | Identifies your project |
| Enabled Chains | Chains & Networks | Which blockchains to support |
| Wallet Providers | Wallets | Which wallets to show (MetaMask, Phantom, etc.) |
| Auth Methods | Log in & User Profile | Email, social, wallet-only |
| Embedded Wallets | Embedded Wallets | Enable/configure embedded wallets |
| Design | Design | Theme, colors, branding |
| API Keys | Developer > API | Server-side API access (prefix: `dyn_`) |

### API Keys (for Server-Side Access)

For server-side API access (not needed for basic wallet connection):

```env
# Server-side only - do NOT use NEXT_PUBLIC_ prefix
DYNAMIC_API_KEY=dyn_your_api_key_here
```

API keys are created in the dashboard and start with the `dyn_` prefix. They are shown only once at creation time.

---

## 15. Styling & Theming

### CSS Variables

Dynamic uses a shadow DOM for style isolation. Override styles by targeting `.dynamic-shadow-dom`:

```css
.dynamic-shadow-dom {
  /* Button styles */
  --dynamic-connect-button-background: #000000;
  --dynamic-connect-button-color: #ffffff;

  /* Brand colors */
  --dynamic-brand-primary-color: #3b82f6;
  --dynamic-brand-secondary-color: #1e40af;

  /* Text */
  --dynamic-text-primary: #ffffff;
  --dynamic-text-size-button-primary: 16px;

  /* Font */
  --dynamic-font-family-primary: "Inter", sans-serif;
  --dynamic-font-family-numbers: "JetBrains Mono", monospace;

  /* Base colors (backgrounds) */
  --dynamic-base-1: #0f172a;
  --dynamic-base-2: #1e293b;
  --dynamic-base-3: #334155;
  --dynamic-base-4: #475569;
  --dynamic-base-5: #64748b;

  /* Border radius */
  --dynamic-border-radius: 8px;

  /* States */
  --dynamic-hover: rgba(255, 255, 255, 0.1);
  --dynamic-connection-green: #22c55e;

  /* Footer */
  --dynamic-footer-background: #0f172a;
  --dynamic-footer-text: #94a3b8;
}
```

### Key CSS Variable Categories

| Category | Variables | Purpose |
|---|---|---|
| Buttons | `--dynamic-connect-button-*` | Connect button appearance |
| Brand | `--dynamic-brand-*-color` | Primary/secondary brand colors |
| Text | `--dynamic-text-*` | Text colors and sizes |
| Fonts | `--dynamic-font-family-*` | Typography |
| Base | `--dynamic-base-1` through `--dynamic-base-5` | Background shades |
| Layout | `--dynamic-border-radius` | Border radius |
| States | `--dynamic-hover`, `--dynamic-connection-green` | Interactive states |
| Footer | `--dynamic-footer-*` | Footer area styling |

### Custom Button via innerButtonComponent

```tsx
<DynamicWidget
  innerButtonComponent={
    <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
      Connect
    </span>
  }
/>
```

### Dark/Light Mode

Customize via CSS variables within media queries or class selectors:

```css
/* Dark mode */
.dark .dynamic-shadow-dom {
  --dynamic-base-1: #0f172a;
  --dynamic-text-primary: #f8fafc;
}

/* Light mode */
.light .dynamic-shadow-dom {
  --dynamic-base-1: #ffffff;
  --dynamic-text-primary: #0f172a;
}
```

---

## 16. Key Architectural Decisions

### Why Dynamic.xyz for This Project

| Requirement | Dynamic.xyz Capability |
|---|---|
| Multi-chain wallet connection | Supports EVM, Solana, Bitcoin, Cosmos in one SDK |
| Embedded wallets (no extension needed) | MPC-based embedded wallets with email/social login |
| Clean React integration | First-class React hooks and components |
| Transaction signing | Exposes Viem wallet client and Ethers.js signer |
| Customizable UI | CSS variables + custom components |
| Next.js App Router support | Works with `"use client"` pattern |

### Considerations

1. **Bundle size**: Only import the chain connectors you need (modular architecture).
2. **Client-only**: All Dynamic SDK components must be client-side. Plan your architecture accordingly.
3. **Provider wrapping**: Use a separate `"use client"` provider component, not in layout.tsx directly.
4. **Viem as default**: Dynamic uses Viem natively. If SwapKit needs Ethers, install `@dynamic-labs/ethers-v6`.
5. **Dashboard config**: Many features (auth methods, chains, wallets) are configured in the dashboard, not just code.
6. **JWT auth**: Dynamic provides JWT tokens that can be validated server-side for API protection.

### Recommended Package Set for Crypto Swap Exchange

```bash
npm install @dynamic-labs/sdk-react-core @dynamic-labs/ethereum @dynamic-labs/solana
```

If Ethers.js is needed for SwapKit:
```bash
npm install @dynamic-labs/ethers-v6
```

---

## Sources

- [Dynamic.xyz Official Site](https://www.dynamic.xyz/)
- [Dynamic.xyz Documentation](https://docs.dynamic.xyz/)
- [Dynamic.xyz React Quickstart](https://www.dynamic.xyz/docs/react-sdk/quickstart)
- [Dynamic.xyz Hooks Introduction](https://docs.dynamic.xyz/react-sdk/hooks/hooks-introduction)
- [Dynamic.xyz useDynamicContext](https://docs.dynamic.xyz/react-sdk/hooks/usedynamiccontext)
- [Dynamic.xyz Enabling Chains](https://docs.dynamic.xyz/chains/enabling-chains)
- [Dynamic.xyz CSS Variables](https://docs.dynamic.xyz/design-customizations/css/css-variables)
- [Dynamic.xyz Embedded Wallets](https://docs.dynamic.xyz/embedded-wallets/dynamic-embedded-wallets)
- [Dynamic.xyz Multi-Chain Wallet Adapter](https://www.dynamic.xyz/features/multi-chain-wallet-adapter)
- [Dynamic.xyz Using EVM Wallets](https://www.dynamic.xyz/docs/wallets/using-wallets/evm/using-evm-wallets)
- [Dynamic.xyz Using Ethers](https://docs.dynamic.xyz/adding-dynamic/using-ethers)
- [Dynamic.xyz Accessing Connected Wallets](https://www.dynamic.xyz/docs/wallets/using-wallets/accessing-wallets)
- [Dynamic.xyz Components](https://docs.dynamic.xyz/react-sdk/components/components-introduction)
- [Dynamic.xyz GitHub](https://github.com/dynamic-labs)
- [@dynamic-labs/sdk-react-core on npm](https://www.npmjs.com/package/@dynamic-labs/sdk-react-core)
- [@dynamic-labs/ethereum on npm](https://www.npmjs.com/package/@dynamic-labs/ethereum)
- [@dynamic-labs/solana on npm](https://www.npmjs.com/package/@dynamic-labs/solana)
