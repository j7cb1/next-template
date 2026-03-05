import { ErrorBoundary } from 'react-error-boundary'
import { SwapWidgetClient } from './swap-widget-client'
import { SwapWidgetError } from './swap-widget-error'

export function SwapWidgetServer() {
  return (
    <ErrorBoundary fallback={<SwapWidgetError />}>
      <SwapWidgetClient />
    </ErrorBoundary>
  )
}
