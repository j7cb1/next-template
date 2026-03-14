# Best Practices Frontend Architecture

## Overview

This documents best practices for Next.js with react-query, aiming for clear separation of concerns, optimized data fetching, and robust loading/error handling. The core idea is to perform initial data loading on the server and progressively enhance interactivity on the client.

## Core Pattern Components

Each logical feature is typically composed of the following file types:

1.  **`*-server.tsx` (Server Component)**

    - **Role:** The default entry point for the feature. Rendered primarily on the server.
    - **Responsibilities:**
        - Acts as a boundary for server-side logic.
        - Performs initial, critical data fetching using server-specific hooks (e.g., `usePrefetchedUserProfile`).
        - Wraps the client component(s) in:
            - `React.Suspense`: Handles the loading state, showing a corresponding `*-skeleton.tsx` component as a fallback.
            - `ErrorBoundary`: Catches runtime errors during rendering or data fetching, showing a `*-error.tsx` component as a fallback.
        - Uses `@tanstack/react-query`'s `HydrationBoundary`: Passes the prefetched server data to the client for hydration, avoiding client-side refetching on initial load.
    - **Refer to:** [Advanced Server-Side Rendering Guide](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)

2.  **`*-client.tsx` (Client Component)**

    - **Role:** Handles interactivity and client-side state. Marked with the `'use client'` directive.
    - **Responsibilities:**
        - Accesses data using client-side react-query hooks (e.g., `useUserProfile`), which leverage the data hydrated from the server via `HydrationBoundary`. These are tanstack-query/react-query hooks.
        - Initiates data mutations using dedicated hooks (e.g., `useMutateUserProfile`). These are tanstack-query/react-query hooks.
        - Renders the specific UI or Form component(s) (e.g., `UserSettingsForm`).

3.  **`*-skeleton.tsx` (Stateless Component)**

    - **Role:** Provides a placeholder UI to display while data is loading.
    - **Responsibilities:** Renders a non-interactive representation of the component's structure (e.g., using `Skeleton` components).
    - **Used By:** `*-server.tsx` as the `fallback` for `React.Suspense`. `*-client.tsx` when the `use-*` hook is in loading state.

4.  **`*-error.tsx` (Stateless Component)**

    - **Role:** Displays a user-friendly error message if something goes wrong within the component's boundary.
    - **Responsibilities:** Renders a simple error state, potentially with a retry mechanism if applicable (though often handled by `react-query` itself).
    - **Used By:** `*-server.tsx` as the `fallback` for `ErrorBoundary`. `*-client.tsx` when the `use-*` hook is in error state.
    - **Example:** `user-profile-card-error.tsx`, `user-settings-error.tsx`

## Data Flow

1.  **Request:** A page requests a feature component (e.g., `<UserProfileCardServer userId={...} />`).
2.  **Server:** The `*-server.tsx` component executes.
    - Data fetching via `usePrefetched*` occurs.
    - `Suspense` boundary is set up. If data fetching suspends, the `*-skeleton.tsx` is streamed to the client initially.
    - `ErrorBoundary` is set up.
3.  **Hydration:** Once server data is ready, it's passed via `HydrationBoundary` to the `*-client.tsx` component.
4.  **Client:**
    - React hydrates the `*-client.tsx` component using the server-rendered HTML and the data from `HydrationBoundary`.
    - Client-side hooks (`use*`) access the hydrated data via `react-query`'s cache.
    - The component becomes interactive.
    - Further data fetching or mutations are handled client-side via `useMutate*` hooks or `react-query`'s refetching mechanisms.

## Creating New User Components

1.  **Create Files:** Create the set of files following the naming convention: `feature-name-server.tsx`, `feature-name-client.tsx`, `feature-name-skeleton.tsx`, `feature-name-error.tsx`.
2.  **Server Component:** Implement data fetching in `*-server.tsx` using appropriate server hooks. Wrap the client component in `Suspense`, `ErrorBoundary`, and `HydrationBoundary`, providing the skeleton, error components, and prefetched data state.
3.  **Client Component:** Add the `'use client'` directive to `*-client.tsx`. Implement client-side logic, data access via client hooks, mutations, and state management. Render the UI/Form component, passing necessary data and callbacks.
4.  **UI/Form Component:** Add `'use client'` if interactive. Build the presentation layer, receiving props from the client component. Implement form logic if needed.
5.  **Skeleton/Error:** Create simple, stateless components for loading and error fallbacks.
6.  **Usage:** Import and use the `*-server.tsx` component in the desired page or layout.

## React 19 Component Guidelines

Components must follow React 19 patterns and Vercel best practices:

### Composition Patterns

- **No boolean prop proliferation** — Instead of adding `readOnly`, `isLoading`, `isError` flags, create explicit variant components (e.g., `TokenInputField` vs `TokenOutputField`).
- **No `forwardRef`** — React 19 passes `ref` as a regular prop. Use `{ ref, ...props }` in the function signature.
- **Use `use()` over `useContext()`** — React 19's `use()` can be called conditionally and is the preferred API.
- **Children over render props** — Prefer `children` composition over `renderX` props for flexibility.

### Performance

- **Extract inline animation objects** — Hoist animation config to `useMemo` or module-level constants to avoid re-creation on every render.
- **No barrel file imports** — Import directly from source files, not `index.ts` barrels.
- **Wrap server-side use-case functions with `React.cache()`** — Enables per-request deduplication across components.
- **Use `Promise.all()` for parallel fetches** — Never create sequential await waterfalls for independent data.
- **Prefer `useTransition`** — For non-urgent updates like debounced search, combine with `startTransition` for better UX feedback.

### Accessibility (Web Interface Guidelines)

- **Icon-only buttons need `aria-label`** — Every `<button>` with only an icon must have an accessible label.
- **Form inputs need `<label>` or `aria-label`** — No unlabelled inputs.
- **Decorative icons need `aria-hidden="true"`** — Prevent screen reader noise.
- **Honor `prefers-reduced-motion`** — All animations must provide reduced motion variants. Use Framer Motion's `reducedMotion="user"` prop or CSS `@media (prefers-reduced-motion: reduce)`.
- **Semantic HTML first** — Use `<button>` for actions, `<a>`/`<Link>` for navigation. Never `<div onClick>`.
- **Visible focus states** — Every interactive element needs `focus-visible:ring-*` or equivalent. Never `outline-none` without replacement.
- **`tabular-nums`** — Use `font-variant-numeric: tabular-nums` for number columns and financial data.
- **Images need dimensions** — Always set `width` and `height` on `<img>`. Use `loading="lazy"` for below-fold images.