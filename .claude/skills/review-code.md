# Review Code Skill

Reviews code changes against Vercel's React best practices and project patterns.

## Usage

```
/review-code
```

Run after making changes to review them for compliance.

## Instructions

1. **Identify modified files** - Check git status or recent edits
2. **Load Vercel best practices** - Use the `vercel-react-best-practices` skill for reference
3. **Load project patterns** - Read `docs/project-pattern/` and `.claude/context/patterns.md`
4. **Review each file** against the checklists below
5. **Report issues** with specific line references and fixes
6. **Apply fixes** for any violations found

## Vercel Best Practices Checklist

### Critical (Always Check)

- [ ] **No waterfalls** (`async-parallel`) - Use `Promise.all()` for independent async operations
- [ ] **No barrel imports** (`bundle-barrel-imports`) - Import directly from source files, or ensure `optimizePackageImports` is configured in `next.config.ts`
- [ ] **Server components by default** (`server-*`) - Only use `'use client'` when necessary

### High Priority

- [ ] **No useEffect for derived state** (`rerender-derived-state-no-effect`) - Derive state during render using refs, not useEffect
- [ ] **Minimize client serialization** (`server-serialization`) - Pass only necessary data to client components
- [ ] **Parallel data fetching** (`server-parallel-fetching`) - Restructure to avoid sequential fetches when possible

### Medium Priority

- [ ] **Stable callbacks** (`rerender-functional-setstate`) - Use functional setState for callbacks passed to children
- [ ] **Lazy state initialization** (`rerender-lazy-state-init`) - Pass function to useState for expensive initial values
- [ ] **Primitive dependencies** (`rerender-dependencies`) - Use primitives in useEffect dependencies when possible

## Project Patterns Checklist

### File Structure

- [ ] **Direct imports** - No barrel file (`index.ts`) imports; import from component file directly
- [ ] **'use client' directive** - Client components marked with `'use client'`
- [ ] **Type-only imports** - Use `import type` for type imports

### Use Case Pattern

- [ ] **FunctionResult** - Returns `{ data, error }` via `success()` / `error()`
- [ ] **Schema validation** - Uses Zod schemas for args and results
- [ ] **Cache keys** - Read operations have `*-query-key.ts` file
- [ ] **Cache invalidation** - Write operations invalidate related queries
- [ ] **Error capture** - Uses `captureError(err)` in catch blocks

### Component Pattern

- [ ] **Server/Client split** - Complex features use `*-server.tsx` + `*-client.tsx` pattern
- [ ] **Loading states** - Uses `*-skeleton.tsx` for Suspense fallbacks
- [ ] **Error states** - Uses `*-error.tsx` for ErrorBoundary fallbacks
- [ ] **HydrationBoundary** - Server components pass prefetched data via HydrationBoundary

### Repository Pattern

- [ ] **No business logic** - Repos are pure data access
- [ ] **Soft delete filtering** - Queries filter `deletedAt IS NULL`
- [ ] **Zod validation** - Uses drizzle-zod schemas

## Common Issues & Fixes

### useEffect for prop sync (WRONG)

```typescript
// WRONG - causes extra render
useEffect(() => {
  setValue(prop.value)
}, [prop.value])

// CORRECT - derive during render
const prevRef = useRef(prop.value)
if (prevRef.current !== prop.value) {
  prevRef.current = prop.value
  setValue(prop.value)
}
```

### Sequential fetches (WRONG)

```typescript
// WRONG - waterfall
const user = await getUser(id)
const orders = await getOrders(id)

// CORRECT - parallel
const [user, orders] = await Promise.all([
  getUser(id),
  getOrders(id),
])
```

### Missing cache invalidation (WRONG)

```typescript
// WRONG - no invalidation
return useMutation({
  mutationFn: updateEntity,
})

// CORRECT - invalidate related queries
return useMutation({
  mutationFn: updateEntity,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['entities'] })
  },
})
```

## Output Format

Report findings as:

| Category | Status | File:Line | Notes |
|----------|--------|-----------|-------|
| Vercel: async-parallel | Pass/Fail | path:123 | Description |
| Project: FunctionResult | Pass/Fail | path:456 | Description |

Then apply fixes for any failures.
