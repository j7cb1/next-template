# Frontend Architecture Forms

This document outlines the best practices for creating forms in the frontend architecture.

## Overview

Forms are a crucial part of user interaction. This section details how to integrate forms effectively within our Next.js frontend architecture, leveraging `react-hook-form`, `zod`, and `@tanstack/react-query` for a robust and maintainable approach.

## Form Component Structure

Forms generally follow the core pattern outlined in the main `frontend-architecture.md`, with specific roles for each component type:

1.  **`*-client.tsx` (Client Component)**

    - **Role:** Orchestrates form logic and data submission. Marked with `'use client'`.
    - **Responsibilities:**
        - Receives initial data hydrated from the server component (if applicable).
        - Uses `@tanstack/react-query` mutation hooks (e.g., `useMutateUserProfile`) to handle form submissions.
        - Manages the submission state (`isPending`/`isSubmitting` from the mutation hook).
        - Renders the `*-form.tsx` (or `*-form.tsx`) component.
        - Passes necessary props to the form UI:
            - `initialValues` (hydrated or default state).
            - `onSubmit` function (which calls the `mutateAsync` function from the mutation hook).
            - `isSubmitting` state.
        - Handles loading/error states related to data fetching before rendering the form UI.

2.  **`*-form.tsx` (UI Component)**
    - **Role:** Renders the actual form elements and handles user input. Marked with `'use client'`.
    - **Responsibilities:**
        - Uses `react-hook-form` (`useForm`) for form state management (values, validation, dirty state, etc.).
        - Uses `@hookform/resolvers/zod` for schema-based validation, defining the schema often in a separate `*-schema.ts` file (co-located with repository types if applicable).
        - **Refer to:** [Shadcn Form](https://ui.shadcn.com/docs/components/form)
        - Handles submission feedback within its submit handler:
            - Includes error catching (`try/catch`) around the `onSubmit` call.
            - Resets the form using `form.reset()` on successful submission.
        - Uses UI components (e.g., from `@/components/ui/`) for form elements.

## Key Libraries and Practices

- **Form Management:** Use `react-hook-form`.
- **Validation:** Use `zod` and `@hookform/resolvers/zod`. Entities are defined in the repositories folder.
- **Data Submission:** Use `@tanstack/react-query` mutation hooks (`useMutation`, potentially wrapped in custom hooks like `useMutate*`).
- **UI Components:** Use shared components from `@/components/ui/` (Shadcn).
- **State Separation:** Keep form state (`react-hook-form`) separate from server/submission state (`react-query`).
- **Component Separation:** Separate the form rendering/input logic (`*-form.tsx`) from the submission/data logic (`*-client.tsx`).

## Form Accessibility (Web Interface Guidelines)

- Every `<input>` must have a `<label htmlFor="...">` or `aria-label`
- Use correct `type` (`email`, `tel`, `url`, `number`) and `inputmode` attributes
- Never block paste (`onPaste` + `preventDefault`)
- Add `spellCheck={false}` on emails, codes, usernames
- Add `autocomplete` and meaningful `name` attributes
- Submit button stays enabled until request starts; show spinner during submission
- Display errors inline next to fields; focus first error on submit
- Placeholders should end with `…` and show example patterns
- Warn before navigation with unsaved changes (`beforeunload` or router guard)

## Form Mutation Best Practices (TanStack Query)

- Always invalidate related queries after successful mutation
- Use `isPending` from mutation hook for loading states
- Handle errors in both `onError` callback and component-level try/catch
- For optimistic updates, provide rollback context from `onMutate`

```typescript
// ✅ Correct mutation with invalidation
const queryClient = useQueryClient()
const mutation = useMutation({
  mutationFn: updateEntityAction,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['entity'] })
    toast.success('Updated!')
  },
  onError: (err) => {
    toast.error(err.message || 'Update failed')
  },
})
```

## Example Flow (User Settings Form)

5.  `UserSettingsClient` renders `<UserSettingsFormUi initialSettings={...} onSubmit={handleSubmit} isSubmitting={mutation.isPending} />`.
6.  `UserSettingsForm` initializes `useForm` with `initialSettings` and `zodResolver`. It renders the form inputs.
7.  User interacts, fills the form. `react-hook-form` tracks state.
8.  User clicks "Save Changes".
9.  `UserSettingsForm`'s `form.handleSubmit` triggers its internal `handleFormSubmit`.
10. `handleFormSubmit` calls the `onSubmit` prop (passed from `UserSettingsClient`), which in turn calls the mutation hook.
11. `isSubmitting` becomes true (button disables, spinner shows).
12. Mutation hook runs. On success:
    - `handleFormSubmit` shows success toast, calls `form.reset(newData)`.
13. On error:
    - `handleFormSubmit` catches error, shows error toast.
14. `isSubmitting` becomes false.