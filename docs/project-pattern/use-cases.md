# Use Case Pattern

## Quick Start

Creating a new use case? You need **4 files**:

1. **`get-entity-query-key.ts`** — TanStack Query cache key
2. **`get-entity-use-case.ts`** — Business logic
3. **`get-entity-action.ts`** — Server action wrapper (handles logger setup)
4. **`use-entity.ts`** — React Query hook for client-side usage

**Critical rule:** Each use case independently fetches ALL its dependencies. Never pass fetched data as parameters.

## Folder Structure

```
use-cases/{domain}/
├── get-{entity}-query-key.ts
├── get-{entity}-use-case.ts
├── get-{entity}-action.ts
└── use-{entity}.ts
```

**Example:** `use-cases/users/get-user-by-email/`

## File Structures

### 1. Query Key (`get-{entity}-query-key.ts`)

Defines the React Query cache key.

```typescript
export const getUserByEmailQueryKey = (email: string) => ['user', 'email', email]
```

### 2. Use Case (`get-entity-use-case.ts`)

Core business logic with caching, logging, and result handling.

```typescript
import { Logger } from 'pino'
import { z } from 'zod'
import { createResultSchema, ZodFunctionResult } from '@/utilities/function-result'
import { getQueryClient } from '@/lib/query-client'
import { getUserByEmailRepo } from '@/repositories/users/get-user-by-email-repo'
import { selectUserSchema } from '@/repositories/users/user-schema'
import { getUserByEmailQueryKey } from './get-user-by-email-query-key'
import { captureError } from '@/utilities/error'

// Args schema
export const GetUserByEmailUseCaseArgsSchema = z.object({
  email: z.string().email(),
  log: z.custom<Logger | undefined>(),
})

// Result schema
export const GetUserByEmailUseCaseResultSchema = createResultSchema(
  selectUserSchema.nullable(),
  z.object({ message: z.string() }).passthrough()
)

// Export types
export type GetUserByEmailUseCaseArgs = z.infer<typeof GetUserByEmailUseCaseArgsSchema>
export type GetUserByEmailUseCaseResult = ZodFunctionResult<typeof GetUserByEmailUseCaseResultSchema>

export async function getUserByEmailUseCase({
  email,
  log,
}: GetUserByEmailUseCaseArgs): Promise<GetUserByEmailUseCaseResult> {
  const { success, error } = GetUserByEmailUseCaseResultSchema

  try {
    log?.info({ email }, 'Get user by email')

    const queryClient = getQueryClient()
    const queryKey = getUserByEmailQueryKey(email)

    const user = await queryClient.fetchQuery({
      queryKey,
      queryFn: () => getUserByEmailRepo({ email }),
    })

    log?.info({ email }, 'Retrieved user')
    return success(user)
  } catch (err) {
    log?.error({ err, email }, 'Error fetching user by email')
    captureError(err)
    return error({ message: 'Failed to fetch user' })
  }
}
```

### 3. Action (`get-entity-action.ts`)

Server action wrapper that sets up logging.

```typescript
'use server'

import { auth } from '@/auth'
import { getUserByEmailUseCase } from './get-user-by-email-use-case'
import { getLogger, LoggerModule } from '@/services/logger/logger'

export async function getUserByEmailAction(email: string) {
  const session = await auth()
  if (!session) {
    return { data: null, error: { message: 'Unauthorized' } }
  }

  const log = getLogger({ module: LoggerModule.App })

  return getUserByEmailUseCase({ email, log })
}
```

### 4. React Query Hook (`use-entity.ts`)

Client-side hook.

```typescript
import { useQuery } from '@tanstack/react-query'
import { getUserByEmailAction } from './get-user-by-email-action'
import { getUserByEmailQueryKey } from './get-user-by-email-query-key'

export function useUserByEmail(email: string, enabled = true) {
  return useQuery({
    queryKey: getUserByEmailQueryKey(email),
    queryFn: async () => {
      const { data, error } = await getUserByEmailAction(email)
      if (error) {
        throw error
      }
      return data
    },
    enabled: !!email && enabled,
  })
}
```

## Result Pattern

Use `createResultSchema` from `@/utilities/function-result` for consistent error/success handling. All use cases return `{ data, error }`.

```typescript
// utilities/function-result.ts
export function createResultSchema<TDataSchema extends z.ZodType, TErrorSchema extends z.ZodType>(
  dataSchema: TDataSchema,
  errorSchema: TErrorSchema
) {
  return {
    success: (data: z.infer<TDataSchema>) => ({ data, error: null }),
    error: (error: z.infer<TErrorSchema>) => ({ data: null, error }),
  }
}
```

## Logging

- Pass `log` as a parameter (`Logger | undefined`) to use cases
- Actions set up the logger via `getLogger` from `@/services/logger/logger`
- Log at start and completion of operations
- Include relevant context (IDs, error details) in logs

## Independent Data Fetching

Each use case independently fetches ALL its dependencies. Never pass fetched data as parameters.

```typescript
// ✅ Correct — each child fetches independently
const [result1, result2] = await Promise.all([
  childUseCase1({ entityId, log }),
  childUseCase2({ entityId, log }),
])

// ❌ Wrong — don't pass data through parameters
const data = await fetchData({ entityId })
const [result1, result2] = await Promise.all([
  childUseCase1({ data, log }),
  childUseCase2({ data, log }),
])
```

**Why:** TanStack Query automatically deduplicates requests with identical query keys. Multiple calls to the same use case with the same parameters = only 1 DB query. This keeps use cases loosely coupled, testable, and composable.

## Key Patterns

### Caching

- Use `getQueryClient()` for server-side caching
- Query keys should be consistent and hierarchical
- TanStack Query deduplicates requests automatically
- Wrap use-case functions with `React.cache()` for per-request deduplication on the server

### Query Keys (TanStack Query Best Practices)

- **Always use arrays** — `['entity', id]` not `'entity-${id}'`
- **Include all dependencies** — Every variable the query depends on must be in the key
- **Hierarchical organization** — `['entity', subEntity?, filters?]` enables targeted invalidation
- **Use factory functions** — Centralize in `*-query-key.ts` files to prevent typos
- **Never use empty string fallbacks** — When a dependency is undefined, use a unique pending key (e.g., `['entity', 'pending']`) instead of `['entity', '']` to avoid cache collisions
- **All key parts must be JSON-serializable** — No functions or class instances in keys

```typescript
// ✅ Correct — unique pending key
queryKey: walletAddress && identifier
  ? ['wallet', 'balance', walletAddress, identifier]
  : ['wallet', 'balance', 'pending'],

// ❌ Wrong — empty string fallback causes cache collisions
queryKey: ['wallet', 'balance', walletAddress ?? '', identifier ?? ''],
```

### Mutations (TanStack Query Best Practices)

- **Always invalidate related queries after mutations** — Use `queryClient.invalidateQueries()` in `onSuccess`/`onSettled`
- **Implement optimistic updates** for responsive UI where appropriate
- **Provide rollback context** from `onMutate` for optimistic updates
- **Handle errors gracefully** — Show user-facing error messages via toast
- **Use `isPending`** for mutation loading states

```typescript
// ✅ Correct — invalidate cache after mutation
const queryClient = useQueryClient()
return useMutation({
  mutationFn: executeSwap,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] })
    queryClient.invalidateQueries({ queryKey: ['swap', 'quote'] })
  },
})
```

### QueryClient Defaults

Set explicit defaults in `lib/query-client.ts`:

```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // 1 minute default
      gcTime: 10 * 60 * 1000,     // 10 minutes - explicit, not framework default
    },
  },
})
```

Configure per-query overrides based on data volatility:

| Data Type | staleTime | gcTime | Rationale |
|-----------|-----------|--------|-----------|
| Reference data (token lists) | 1 hour | 24 hours | Rarely changes |
| Prices/quotes | 30 seconds | 5 minutes | Time-sensitive |
| Wallet balances | 15 seconds | 5 minutes | Updates periodically |
| Transaction status | 0 (always fresh) | 5 minutes | Real-time |

### Concurrent Data Fetching

Use `Promise.all` to fetch data in parallel wherever possible.

```typescript
const [userResult, profileResult] = await Promise.all([
  getUserByIdUseCase({ userId, log }),
  getProfileUseCase({ userId, log }),
])
```

### Error Handling

- Use `createResultSchema` for consistent error/success patterns
- Always include `captureError(err)` in catch blocks
- Provide meaningful error messages
- Include relevant context in error logs
- Configure retry logic per query — disable retries for time-sensitive data (quotes), use 1-2 retries for balance checks

### Type Safety

- Export Args and Result types for external use
- Use Zod schemas for runtime validation
- Validate both input arguments and return data

## Naming Conventions

- Use kebab-case for file names
- Prefix functions with action (e.g., `get-`, `update-`, `create-`, `delete-`)
- Use full descriptive names (e.g., `get-user-by-email-use-case.ts`)

## File Organization

- Keep query keys separate from hooks for reusability
- Group by domain hierarchy
- Repositories handle data access, use cases handle business logic
