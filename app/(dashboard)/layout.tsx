import { CurrencySelector } from '@/components/swap/currency-selector'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { ReactiveGrid } from '@/components/ui/reactive-grid'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="min-h-[100dvh] flex items-center justify-center px-4 py-4 sm:py-12 relative overflow-hidden">
      {/* Vignette – dark mode only */}
      <div className="pointer-events-none fixed inset-0 z-0 hidden dark:block" style={{ background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.6) 100%)' }} />
      {/* Flickering grid — reacts to UI loading states */}
      <div
        className="fixed inset-0 z-0"
        style={{ maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)' }}
      >
        <ReactiveGrid />
      </div>
      {/* Top-right controls */}
      <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
        <AnimatedThemeToggler className="flex items-center justify-center size-8 rounded-full bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none" />
        <CurrencySelector />
      </div>
      {children}
    </main>
  )
}
