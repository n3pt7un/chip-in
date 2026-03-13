import { useEffect, useRef, useState } from 'react'

interface PotDisplayProps {
  pot: number
  round: number
}

export function PotDisplay({ pot, round }: PotDisplayProps) {
  const [pulse, setPulse] = useState(false)
  const prevPot = useRef(pot)

  useEffect(() => {
    if (pot !== prevPot.current) {
      setPulse(true)
      prevPot.current = pot
      const t = setTimeout(() => setPulse(false), 200)
      return () => clearTimeout(t)
    }
  }, [pot])

  return (
    <div className="flex flex-col items-center py-10">
      <p className="text-xs font-medium uppercase tracking-widest text-text-muted mb-1">
        Round {round} · Pot
      </p>
      <p className={`text-6xl font-bold text-accent tabular-nums transition-transform duration-200 ${pulse ? 'scale-105' : 'scale-100'}`}>
        {pot.toLocaleString()}
      </p>
    </div>
  )
}
