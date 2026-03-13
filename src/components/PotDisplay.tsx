interface PotDisplayProps {
  pot: number
  round: number
}

export function PotDisplay({ pot, round }: PotDisplayProps) {
  return (
    <div className="flex flex-col items-center py-6">
      <p className="text-xs font-medium uppercase tracking-widest text-white/40 mb-1">
        Round {round} · Pot
      </p>
      <p className="text-5xl font-bold text-accent tabular-nums">
        {pot.toLocaleString()}
      </p>
    </div>
  )
}
