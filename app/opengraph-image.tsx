import { ImageResponse } from 'next/og'

export const alt = 'Cryptocurrency NZ — Swap tokens instantly across chains'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const BG = '#1c1c1e'
const CARD = '#262628'
const INPUT_BG = '#1a1a1c'
const BORDER = 'rgba(255,255,255,0.06)'
const TXT = '#e8e8ec'
const TXT_DIM = '#8a8a96'
const EMERALD = '#10b981'

function TokenPill({ symbol, chain }: { symbol: string; chain: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '6px 14px 6px 8px',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: symbol === 'ETH' ? '#627EEA' : '#2775CA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: 700,
          color: '#fff',
        }}
      >
        {symbol[0]}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: TXT, lineHeight: 1.2 }}>
          {symbol}
        </span>
        <span style={{ fontSize: '11px', color: TXT_DIM, lineHeight: 1.2 }}>
          {chain}
        </span>
      </div>
    </div>
  )
}

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BG,
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.6) 100%)',
          }}
        />

        {/* Emerald ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '650px', height: '550px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 65%)',
          }}
        />

        {/* Swap card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '400px',
            borderRadius: '24px',
            background: CARD,
            border: `1px solid ${BORDER}`,
            boxShadow: '0 0 80px rgba(5,150,105,0.04), 0 30px 60px rgba(0,0,0,0.45)',
            padding: '20px 12px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0 10px 10px', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: EMERALD }} />
            <span style={{ fontSize: '12px', color: TXT_DIM, fontFamily: 'monospace' }}>
              0x7a3f...c912
            </span>
          </div>

          {/* From */}
          <div style={{ display: 'flex', flexDirection: 'column', background: INPUT_BG, borderRadius: '16px', padding: '16px', gap: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 500, color: TXT_DIM }}>From:</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <TokenPill symbol="ETH" chain="Ethereum" />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <span style={{ fontSize: '28px', fontWeight: 600, color: TXT, letterSpacing: '-0.5px', lineHeight: 1 }}>1.0</span>
                <span style={{ fontSize: '11px', color: TXT_DIM }}>~$2,241.80</span>
              </div>
            </div>
          </div>

          {/* To */}
          <div style={{ display: 'flex', flexDirection: 'column', background: INPUT_BG, borderRadius: '16px', padding: '16px', gap: '12px', marginTop: '4px', position: 'relative' }}>
            {/* Swap button */}
            <div style={{ position: 'absolute', top: '-18px', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: CARD, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14m0 0l-6-6m6 6l6-6" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 500, color: TXT_DIM }}>To:</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <TokenPill symbol="USDC" chain="Ethereum" />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <span style={{ fontSize: '28px', fontWeight: 600, color: TXT, letterSpacing: '-0.5px', lineHeight: 1 }}>2,241.80</span>
                <span style={{ fontSize: '11px', color: TXT_DIM }}>~$2,241.80</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', marginTop: '14px', padding: '0 2px' }}>
            <div
              style={{
                width: '100%', height: '48px', borderRadius: '16px', background: EMERALD,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 28px rgba(16,185,129,0.20), 0 4px 8px rgba(0,0,0,0.2)',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Swap</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
