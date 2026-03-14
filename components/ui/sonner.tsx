"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { IconCircleCheck, IconInfoCircle, IconAlertTriangle, IconAlertOctagon, IconLoader } from "@tabler/icons-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      icons={{
        success: <IconCircleCheck className="size-4 text-emerald-400" />,
        info: <IconInfoCircle className="size-4 text-blue-400" />,
        warning: <IconAlertTriangle className="size-4 text-amber-400" />,
        error: <IconAlertOctagon className="size-4 text-red-400" />,
        loading: <IconLoader className="size-4 animate-spin text-emerald-400" />,
      }}
      style={{
        '--normal-bg': 'var(--card)',
        '--normal-text': 'var(--card-foreground)',
        '--normal-border': 'var(--border)',
        '--success-bg': 'var(--card)',
        '--success-text': 'var(--card-foreground)',
        '--success-border': 'var(--border)',
        '--error-bg': 'var(--card)',
        '--error-text': 'var(--card-foreground)',
        '--error-border': 'var(--border)',
        '--border-radius': '1rem',
      } as React.CSSProperties}
      toastOptions={{
        classNames: {
          toast: 'backdrop-blur-md !shadow-lg !shadow-black/10 !text-sm !font-medium',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
