import { useMemo } from 'react'
import type { CSSProperties } from 'react'

interface ChipDenomination {
  value: number
  bg: string
  stripe: string
  label: string
}

const DENOMINATIONS: ChipDenomination[] = [
  { value: 500, bg: '#7C3AED', stripe: '#A78BFA', label: '500' },
  { value: 100, bg: '#1a1a1a', stripe: '#555', label: '100' },
  { value: 25,  bg: '#28C76F', stripe: '#52E89A', label: '25' },
  { value: 5,   bg: '#EF4444', stripe: '#F87171', label: '5' },
  { value: 1,   bg: '#E5E7EB', stripe: '#9CA3AF', label: '1' },
]

function Chip({ denom, size = 28, style }: { denom: ChipDenomination; size?: number; style?: CSSProperties }) {
  const r = size / 2
  const cx = r
  const cy = r
  const stripeWidth = size * 0.18
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={style}
    >
      <defs>
        <clipPath id={`chip-clip-${denom.value}`}>
          <circle cx={cx} cy={cy} r={r - 1} />
        </clipPath>
      </defs>
      {/* Base circle */}
      <circle cx={cx} cy={cy} r={r - 1} fill={denom.bg} />
      {/* Stripe pattern */}
      <rect
        x={cx - stripeWidth / 2}
        y={0}
        width={stripeWidth}
        height={size}
        fill={denom.stripe}
        clipPath={`url(#chip-clip-${denom.value})`}
        opacity={0.7}
      />
      <rect
        x={0}
        y={cy - stripeWidth / 2}
        width={size}
        height={stripeWidth}
        fill={denom.stripe}
        clipPath={`url(#chip-clip-${denom.value})`}
        opacity={0.7}
      />
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r - 1} fill="none" stroke={denom.stripe} strokeWidth={size * 0.08} />
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke={denom.stripe} strokeWidth={1} opacity={0.6} />
    </svg>
  )
}

interface ChipStackProps {
  amount: number
  maxChips?: number   // cap how many chips to render (default 8)
  chipSize?: number   // px size of each chip (default 28)
  className?: string
}

export default function ChipStack({ amount, maxChips = 8, chipSize = 28, className = '' }: ChipStackProps) {
  const chips = useMemo(() => {
    if (amount <= 0) return []
    const result: ChipDenomination[] = []
    let remaining = amount
    for (const denom of DENOMINATIONS) {
      const count = Math.floor(remaining / denom.value)
      for (let i = 0; i < count && result.length < maxChips; i++) result.push(denom)
      remaining -= count * denom.value
      if (result.length >= maxChips) break
    }
    return result
  }, [amount, maxChips])

  if (chips.length === 0) return null

  const overlap = chipSize * 0.45  // how much chips overlap when stacked

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ height: chipSize }}
      aria-label={`${amount} chips`}
    >
      <div
        className="relative flex items-center"
        style={{ width: chips.length > 1 ? chipSize + (chips.length - 1) * overlap : chipSize, height: chipSize }}
      >
        {chips.map((chip, i) => (
          <Chip
            key={i}
            denom={chip}
            size={chipSize}
            style={{
              position: 'absolute',
              left: i * overlap,
              zIndex: i,
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
            }}
          />
        ))}
      </div>
    </div>
  )
}
