# Session Context

> Last updated: 2026-03-08
> Template version: 1.0.0
> Changes since last update: Full best practices audit (TanStack Query, Composition, React Perf, Design, Web Guidelines)

## Quick Orientation

**Next.js Base Template** with authentication, clean architecture, and AI-friendly documentation. Built with **Next.js 16 + React 19 + TypeScript + Drizzle ORM + PostgreSQL + NextAuth v5**. Uses Clean Architecture with use-cases pattern, TanStack Query for caching, and shadcn/ui components.

**Key domains**: Users (extensible - add your own domains)

---

## Directory Structure

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login, Signup pages
│   │   ├── login/         # Login page
│   │   └── signup/        # Signup page
│   ├── (dashboard)/       # Protected routes
│   │   ├── layout.tsx     # Dashboard shell
│   │   ├── page.tsx       # Dashboard home
│   │   ├── users/         # User management
│   │   └── settings/      # Settings page
│   ├── api/auth/          # NextAuth API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── dashboard/         # Shell, sidebar, header, user-menu
│   └── ui/               # shadcn/ui primitives
├── repositories/          # Data access (Drizzle ORM)
│   ├── drizzle/          # schema.ts, get-drizzle.ts
│   └── users/            # User repos
├── use-cases/            # Business logic
│   ├── auth/             # validateCredentialsUseCase
│   └── users/            # User CRUD use cases
├── utilities/            # Shared utils
│   ├── function-result.ts # FunctionResult pattern
│   ├── roles.ts          # admin|support|member
│   ├── permissions.ts    # Permission checks
│   └── error.ts          # Error capture
├── services/logger/      # Pino logger with redaction
├── lib/                  # Core libraries
│   ├── query-client.ts   # TanStack Query singleton
│   └── types/            # TypeScript augmentations
├── config/navigation.ts  # Sidebar nav config
├── hooks/                # React hooks
├── auth.ts              # NextAuth v5 config
├── proxy.ts             # Auth middleware
├── docker/              # Docker compose (PostgreSQL)
└── docs/                # Pattern documentation
```

---

## Core Modules

### Authentication
- **Config**: `auth.ts` - NextAuth v5 with Credentials provider
- **Middleware**: `proxy.ts` - Route protection
- **Roles**: `utilities/roles.ts` - admin (3) > support (2) > member (1)
- **Session**: JWT with `{ id, role }`

### Use Cases Pattern
- **Structure**: `*-query-key.ts` → `*-use-case.ts` → `*-action.ts`
- **Result type**: `{ data, error }` via `utilities/function-result.ts`
- **Caching**: TanStack Query on server via `lib/query-client.ts`

### Repositories Pattern
- **DB**: PostgreSQL via Drizzle ORM
- **Schema**: `repositories/drizzle/schema.ts`
- **Soft delete**: Use `deletedAt` timestamp

---

## Key Patterns

| Pattern | Location | Purpose |
|---------|----------|---------|
| FunctionResult | `utilities/function-result.ts` | `{ data, error }` returns |
| Use Case | `use-cases/*/` | Business logic encapsulation |
| Repository | `repositories/*/` | Data access isolation |
| Soft Delete | All main tables | `deletedAt` timestamp |
| Server Actions | `*-action.ts` | Client → server bridge |
| Role-Based Access | `utilities/permissions.ts` | Permission checks |
| Query Key Factory | `*-query-key.ts` | Centralized cache keys (no empty string fallbacks) |
| Mutation Invalidation | `use-*.ts` hooks | Always invalidate related queries after mutations |
| React 19 APIs | All components | No forwardRef, use() over useContext() |
| Accessibility | All UI components | aria-label, aria-hidden, focus-visible, prefers-reduced-motion |
| Animation | Framer Motion + CSS | Hoisted configs, reduced motion support |

---

## Database Schema

```sql
users (
  id          UUID PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(255),
  passwordHash VARCHAR(255),
  role        user_role DEFAULT 'member',
  createdAt   TIMESTAMP DEFAULT NOW(),
  updatedAt   TIMESTAMP DEFAULT NOW(),
  deletedAt   TIMESTAMP  -- Soft delete
)

-- Roles: 'admin' | 'support' | 'member'
```

---

## Entry Points

| Entry | File | Purpose |
|-------|------|---------|
| Dashboard | `app/(dashboard)/layout.tsx` | Protected shell with sidebar |
| Auth Config | `auth.ts` | NextAuth config, session handling |
| DB Schema | `repositories/drizzle/schema.ts` | Table definitions |
| Middleware | `proxy.ts` | Auth route protection |

---

## Quick Reference

```bash
# Development
npm run dev              # Start dev server
npm run db:studio        # Drizzle Studio (DB GUI)

# Database
npm run db:push          # Push schema changes
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations

# Docker
docker compose -f docker/docker-compose.yml up -d  # Start PostgreSQL
```

**Creating a new use case**:
1. `use-cases/{domain}/get-{entity}-query-key.ts` - cache key
2. `use-cases/{domain}/get-{entity}-use-case.ts` - logic
3. `use-cases/{domain}/get-{entity}-action.ts` - server action

**Pattern docs**: `docs/project-pattern/use-cases.md`, `repositories.md`, `front-end.md`

**Adding new domain**: See `docs/TEMPLATE_USAGE.md`

---

## Deep Dive References

For detailed information, see:
- `@context/architecture.md` - Full architecture overview
- `@context/modules/use-cases.md` - Use case pattern details
- `@context/modules/repositories.md` - Repository pattern details
- `@context/modules/auth.md` - Authentication system
- `@context/relationships.md` - Component dependencies
- `@context/patterns.md` - All codebase patterns
