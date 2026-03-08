'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query-client'
import { DynamicProvider } from '@/components/providers/dynamic-provider'
import { PostHogProvider } from '@/components/providers/posthog-provider'

type ProvidersProps = {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient()

  return (
    <PostHogProvider>
      <DynamicProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </DynamicProvider>
    </PostHogProvider>
  )
}
