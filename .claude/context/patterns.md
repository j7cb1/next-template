# Codebase Patterns

> Last updated: 2026-03-08

## FunctionResult Pattern

**Purpose**: Consistent error handling without exceptions across all use cases.

**Implementation**: `utilities/function-result.ts:1-73`

```typescript
// Type definition
type FunctionResult<TData, TError> =
  | { data: TData; error: null }
  | { data: null; error: TError }

// Helper functions
success<TData>(data) → { data, error: null }
err<TError>(error) → { data: null, error }

// Schema-based (for Zod validation)
createResultSchema(dataSchema, errorSchema) → Union schema with success/error helpers
```

**Usage**:
```typescript
// In use cases
const { success, error } = GetEntityUseCaseResultSchema
try {
  const entity = await getEntityRepo(id)
  return success(entity)
} catch (err) {
  return error({ message: 'Failed to get entity' })
}

// In components
const { data, error } = await getEntityAction(id)
if (error) {
  toast.error(error.message)
  return
}
// Use data safely
```

---

## Use Case Pattern

**Purpose**: Encapsulate business logic in testable, cacheable units.

**Implementation**: `use-cases/*/` (see `docs/project-pattern/use-cases.md`)

**Structure**:
```
use-cases/{domain}/
├── get-{entity}-query-key.ts    # Cache key
├── get-{entity}-use-case.ts     # Logic
├── get-{entity}-action.ts       # Server action
└── use-{entity}.ts              # React hook (optional)
```

**Key Rules**:
1. Each use case fetches its own dependencies
2. Never pass fetched data as parameters
3. Use TanStack Query for server-side caching
4. Always return `{ data, error }`

---

## Repository Pattern

**Purpose**: Isolate database access behind a clean interface.

**Implementation**: `repositories/*/` (see `docs/project-pattern/repositories.md`)

```typescript
// Schema with drizzle-zod
export const selectEntitySchema = createSelectSchema(entities)
export const insertEntitySchema = createInsertSchema(entities)

// Repository function
export async function getEntityByIdRepo(id: string) {
  const db = getDrizzle()
  const [entity] = await db
    .select()
    .from(entities)
    .where(eq(entities.id, id))
    .limit(1)
  return entity ?? null
}
```

**Key Rules**:
1. Only repositories import `getDrizzle()`
2. Validate with Zod schemas
3. No business logic - pure data access
4. Always filter soft-deleted records

---

## Soft Delete Pattern

**Purpose**: Never permanently delete data; maintain audit trail.

**Implementation**: All main entities have `deletedAt` timestamp

```typescript
// Schema (repositories/drizzle/schema.ts)
export const products = pgTable('products', {
  // ...
  deletedAt: timestamp('deleted_at'),  // null = active
})

// In queries - always filter
const active = await db
  .select()
  .from(products)
  .where(isNull(products.deletedAt))

// Soft delete
await db
  .update(products)
  .set({ deletedAt: new Date() })
  .where(eq(products.id, productId))
```

---

## Server Action Pattern

**Purpose**: Bridge between client components and server-side use cases.

**Implementation**: `use-cases/*-action.ts`

```typescript
'use server'

import { getLogger, LoggerModule } from '@/services/logger/logger'

export async function getEntityAction(entityId: string) {
  const log = getLogger({ module: LoggerModule.Entity })
  return getEntityUseCase({ entityId, log })
}
```

**Key Rules**:
1. Always mark with `'use server'`
2. Create logger at action level, pass to use case
3. Return use case result directly
4. No additional error handling (use case handles it)

---

## Role-Based View Pattern

**Purpose**: Show different UI based on user role (admin vs reseller).

**Implementation**: `components/licenses/` split into `admin/` and `reseller/`

```typescript
// licenses-page-client.tsx
export function LicensesPageClient() {
  const { data: session } = useSession()
  const isInternal = !session?.user?.resellerId

  if (isInternal) {
    return <AdminLicensesView />
  }
  return <ResellerLicensesView resellerId={session.user.resellerId} />
}
```

---

## Component File Structure Pattern

**Purpose**: Consistent organization for feature components.

**Implementation**: Each feature domain in `components/`

```
components/{domain}/
├── {domain}-page-client.tsx        # Main page wrapper
├── {domain}-table-client.tsx       # Data table
├── {domain}-table-skeleton.tsx     # Loading state
├── {domain}-table-error.tsx        # Error state
├── create-{entity}-dialog.tsx      # Create modal
├── edit-{entity}-dialog.tsx        # Edit modal
└── delete-{entity}-dialog.tsx      # Delete confirmation
```

---

## Query Key Pattern

**Purpose**: Consistent cache keys for TanStack Query.

**Implementation**: `use-cases/*-query-key.ts`

**Rules** (from TanStack Query best practices audit):
1. Always use arrays for keys
2. Include all variables the query depends on
3. Organize hierarchically: `['entity', subEntity?, filters?]`
4. Use factory functions in dedicated `*-query-key.ts` files
5. **Never use empty string fallbacks** — use unique pending keys instead
6. All key parts must be JSON-serializable

```typescript
// Hierarchical keys
export const getProductsQueryKey = () => ['products']
export const getProductQueryKey = (id: string) => ['products', id]

// With filters
export const getLicensesQueryKey = (filters?: LicenseFilters) =>
  ['licenses', filters ?? {}]

// ✅ Correct — unique pending key when dependencies are undefined
export const getBalanceQueryKey = (address?: string, token?: string) =>
  address && token ? ['wallet', 'balance', address, token] : ['wallet', 'balance', 'pending']

// ❌ Wrong — empty string fallback causes cache collisions
export const getBalanceQueryKeyBad = (address?: string) =>
  ['wallet', 'balance', address ?? '']
```

## Mutation Invalidation Pattern

**Purpose**: Keep cache fresh after data mutations.

**Rules**: Always invalidate related queries after mutations using `onSuccess`/`onSettled`.

```typescript
const queryClient = useQueryClient()
return useMutation({
  mutationFn: executeAction,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['related-entity'] })
  },
})
```

---

## Form Pattern

**Purpose**: Consistent form handling with React Hook Form + Zod.

**Implementation**: See `docs/project-pattern/front-end-forms.md`

```typescript
const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email(),
})

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: '', email: '' },
})

const onSubmit = form.handleSubmit(async (data) => {
  const { error } = await createEntityAction(data)
  if (error) {
    toast.error(error.message)
    return
  }
  toast.success('Created!')
})
```

---

## Logging Pattern

**Purpose**: Structured logging with context.

**Implementation**: `services/logger/logger.ts`

```typescript
import { getLogger, LoggerModule } from '@/services/logger/logger'

const log = getLogger({ module: LoggerModule.Licenses })

log.info({ licenseId }, 'Creating license')
log.error({ err, licenseId }, 'Failed to create license')
```

**Rules**:
1. Create logger in actions, pass to use cases
2. Always include relevant IDs in context
3. Log at start and completion of operations

---

## React 19 Component Pattern

**Purpose**: Follow React 19 APIs and Vercel composition best practices.

**Rules**:
1. **No `forwardRef`** — Pass `ref` as a regular prop in React 19
2. **Use `use()` over `useContext()`** — React 19's `use()` API is preferred
3. **No boolean prop proliferation** — Create explicit variant components instead
4. **Children over render props** — Use `children` for composition

```typescript
// ✅ React 19 — ref as prop, use() for context
function FormItem({ className, ref, ...props }: Props & { ref?: React.Ref<HTMLDivElement> }) {
  const context = use(FormItemContext)
  return <div ref={ref} className={cn('space-y-2', className)} {...props} />
}

// ❌ Pre-React 19 — avoid these patterns
const FormItem = React.forwardRef<HTMLDivElement, Props>(({ className, ...props }, ref) => {
  const context = React.useContext(FormItemContext)
  return <div ref={ref} />
})
```

---

## Accessibility Pattern

**Purpose**: Web Interface Guidelines compliance for all UI components.

**Rules**:
1. Icon-only buttons must have `aria-label`
2. Form inputs must have `<label>` or `aria-label`
3. Decorative icons must have `aria-hidden="true"`
4. All animations must honor `prefers-reduced-motion`
5. Use semantic HTML (`<button>` for actions, `<a>`/`<Link>` for navigation)
6. Every interactive element needs visible `focus-visible` state
7. Use `tabular-nums` for number columns and financial data
8. Images need explicit `width`/`height`; below-fold images use `loading="lazy"`

---

## Animation Pattern

**Purpose**: Performant, accessible animations.

**Rules**:
1. Extract animation objects to `useMemo` or module-level constants (avoid inline re-creation)
2. Use Framer Motion's `reducedMotion="user"` or CSS `@media (prefers-reduced-motion: reduce)`
3. Animate only `transform`/`opacity` for compositor-friendly performance
4. Never use `transition: all` — list properties explicitly
5. Animations should be interruptible

```typescript
// ✅ Correct — hoisted animation config
const GLOW_ANIMATION = { boxShadow: ['0 0 20px ...', '0 0 28px ...', '0 0 20px ...'] }
const GLOW_TRANSITION = { duration: 2.5, repeat: Infinity }

<motion.button animate={canSwap ? GLOW_ANIMATION : undefined} transition={GLOW_TRANSITION} />

// ❌ Wrong — inline object recreated every render
<motion.button animate={canSwap ? { boxShadow: [...] } : { boxShadow: 'none' }} />
```
