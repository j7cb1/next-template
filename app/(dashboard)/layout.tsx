import { CurrencySelector } from '@/components/swap/currency-selector'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 relative">
      {/* Vignette */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.6) 100%)' }} />
      {/* Noise texture overlay */}
      <svg className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-[0.12]">
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
      {/* Currency selector - top right */}
      <div className="fixed top-4 right-4 z-10">
        <CurrencySelector />
      </div>
      {children}
    </main>
  )
}
