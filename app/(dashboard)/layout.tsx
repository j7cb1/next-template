import { CurrencySelector } from '@/components/swap/currency-selector'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { DotPattern } from '@/components/ui/dot-pattern'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 relative">
      {/* Vignette – dark mode only */}
      <div className="pointer-events-none fixed inset-0 z-0 hidden dark:block" style={{ background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.6) 100%)' }} />
      {/* Dot pattern – light mode only */}
      <div className="fixed inset-0 z-0 dark:hidden" style={{ maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)' }}>
        <DotPattern width={24} height={24} cr={0.6} className="text-neutral-400/40" />
      </div>
      {/* Noise texture overlay – dark mode only */}
      <svg className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-[0.12] hidden dark:block">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.25" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="0.10" intercept="0.05" />
            <feFuncG type="linear" slope="0.10" intercept="0.05" />
            <feFuncB type="linear" slope="0.10" intercept="0.05" />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
      {/* Top-right controls */}
      <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
        <AnimatedThemeToggler className="flex items-center justify-center size-8 rounded-full bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none" />
        <CurrencySelector />
      </div>
      {children}
    </main>
  )
}
